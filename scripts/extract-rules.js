'use strict';

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const vm = require('vm');

const inputFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../index.js');

const outputFile = path.resolve(__dirname, '../src/rules.js');

if (!fs.existsSync(inputFile)) {
  console.error(`[Error] Cannot find source file: ${inputFile}`);
  console.error('Usage: node scripts/extract-rules.js <path-to-original-index.js>');
  process.exit(1);
}

console.log(`[Extract] Parsing ${inputFile}...`);
const sourceCode = fs.readFileSync(inputFile, 'utf8');

// Parse AST to find the `config$1` object which holds { components, apis, globalconfig, pageconfig }
const ast = babel.parseSync(sourceCode, { sourceType: 'script' });

// Evaluate static variable declarations in a sandboxed VM up to config$1
const sandbox = {
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Date,
  Math,
  JSON,
  console,
  globalThis: {},
  window: {},
  global: {},
  self: {},
  exports: {},
  module: { exports: {} },
  require: () => new Proxy(() => ({}), { get: () => () => ({}) }),
  __dirname: path.dirname(inputFile),
  __filename: inputFile,
};

function containsDocumentationUrl(node) {
  if (!node || typeof node !== 'object') return false;
  if (
    node.type === 'StringLiteral' &&
    /\/(?:dev\/(?:api|component)\/|configuration\/(?:app|page)\.html)/.test(node.value)
  ) {
    return true;
  }
  return Object.values(node).some((value) =>
    Array.isArray(value)
      ? value.some(containsDocumentationUrl)
      : containsDocumentationUrl(value),
  );
}

function isStaticInitializer(node) {
  return (
    node &&
    (node.type === 'ObjectExpression' ||
      node.type === 'ArrayExpression' ||
      node.type === 'Identifier' ||
      (node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.name === 'Object' &&
        node.callee.property.name === 'freeze'))
  );
}

function collectReferences(node, references = [], parent = null, property = null) {
  if (!node || typeof node !== 'object') return references;
  if (node.type === 'Identifier') {
    if (
      !(
        (parent?.type === 'ObjectProperty' &&
          property === 'key' &&
          !parent.computed &&
          !parent.shorthand) ||
        (parent?.type === 'MemberExpression' && property === 'property' && !parent.computed)
      )
    ) {
      references.push(node.name);
    }
    return references;
  }

  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => collectReferences(child, references, node, key));
    } else {
      collectReferences(value, references, node, key);
    }
  }
  return references;
}

const declarationsByName = new Map();
for (const node of ast.program.body) {
  if (node.type !== 'VariableDeclaration') continue;
  for (const decl of node.declarations) {
    if (decl.id.type === 'Identifier') declarationsByName.set(decl.id.name, { node, decl });
  }
}

const staticNodes = [];
const includedDeclarations = new Set();
function includeDeclaration(entry) {
  if (includedDeclarations.has(entry.decl) || !isStaticInitializer(entry.decl.init)) return;
  includedDeclarations.add(entry.decl);

  for (const name of collectReferences(entry.decl.init)) {
    const dependency = declarationsByName.get(name);
    if (dependency) includeDeclaration(dependency);
  }

  staticNodes.push({ ...entry.node, declarations: [entry.decl] });
}

for (const entry of declarationsByName.values()) {
  if (containsDocumentationUrl(entry.decl.init)) includeDeclaration(entry);
}

const staticCode = babel.transformFromAstSync({
  type: 'Program',
  body: staticNodes,
}).code;

vm.createContext(sandbox);
vm.runInContext(staticCode, sandbox);

// Merge all extracted API and Component definitions from sandbox
const apis = {};
const components = {};
const globalconfig = {};
const pageconfig = {};

for (const [varName, val] of Object.entries(sandbox)) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) continue;

  // Detect WeChat API objects (contain url.original pointing to developers.weixin.qq.com/miniprogram/dev/api/)
  if (val.url && typeof val.url.original === 'string') {
    const cleanName = varName.replace(/\$\d+$/, '');
    if (val.url.original.includes('/dev/api/')) {
      apis[cleanName] = val;
    } else if (val.url.original.includes('/dev/component/')) {
      components[cleanName] = val;
    } else if (val.url.original.includes('/configuration/app.html')) {
      globalconfig[cleanName] = val;
    } else if (val.url.original.includes('/configuration/page.html')) {
      pageconfig[cleanName] = val;
    }
  }

  // Detect grouped category maps (e.g. file$2 containing "FileSystemManager.readFile", view$6 containing "scroll-view")
  for (const [subKey, subVal] of Object.entries(val)) {
    if (subVal && typeof subVal === 'object' && subVal.url && typeof subVal.url.original === 'string') {
      if (subVal.url.original.includes('/dev/api/')) {
        apis[subKey] = subVal;
      } else if (subVal.url.original.includes('/dev/component/')) {
        components[subKey] = subVal;
      }
    }
  }
}

// Build fast lookup tables for API and parameter renaming
const apiRenameMap = {};
const paramRenameMap = {};

for (const [apiName, rule] of Object.entries(apis)) {
  if (rule.body && rule.body.type === 1 && rule.body.value) {
    apiRenameMap[apiName] = rule.body.value;
  }
  if (rule.body && rule.body.params && rule.body.params.props) {
    for (const [propKey, propRule] of Object.entries(rule.body.params.props)) {
      if (propRule.type === 1 && propRule.msg) {
        paramRenameMap[apiName] = paramRenameMap[apiName] || {};
        paramRenameMap[apiName][propKey] = propRule.msg;
      }
    }
  }
}

const outputContent = `// Auto-generated from original index.js by scripts/extract-rules.js
'use strict';

const API_RENAME_MAP = ${JSON.stringify(apiRenameMap, null, 2)};

const PARAM_RENAME_MAP = ${JSON.stringify(paramRenameMap, null, 2)};

const CONTEXT_MANAGERS = {
  getRecorderManager: 'RecorderManager',
  getFileSystemManager: 'FileSystemManager',
  downloadFile: 'DownloadTask',
  createCameraContext: 'CameraContext',
  createVideoContext: 'VideoContext',
  createAudioContext: 'AudioContext',
  createSelectorQuery: 'SelectorQuery',
  createMapContext: 'MapContext',
  getUpdateManager: 'UpdateManager',
};

const apis = ${JSON.stringify(apis, null, 2)};

const components = ${JSON.stringify(components, null, 2)};

const globalconfig = ${JSON.stringify(globalconfig, null, 2)};

const pageconfig = ${JSON.stringify(pageconfig, null, 2)};

module.exports = {
  API_RENAME_MAP,
  PARAM_RENAME_MAP,
  CONTEXT_MANAGERS,
  apis,
  components,
  globalconfig,
  pageconfig,
};
`;

fs.writeFileSync(outputFile, outputContent, 'utf8');
console.log(`[Extract] Success! Extracted ${Object.keys(apis).length} APIs and ${Object.keys(components).length} components to src/rules.js`);
