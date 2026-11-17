import fs = require('fs');
import path = require('path');
import vm = require('vm');
import * as babel from '@babel/core';
import * as t from '@babel/types';
import type { Node, VariableDeclaration, VariableDeclarator } from '@babel/types';

interface DeclarationEntry {
  node: VariableDeclaration;
  decl: VariableDeclarator;
}

type JsonRecord = Record<string, unknown>;

const inputFile = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../../index.js');
const outputFile = path.resolve(__dirname, '../../src/rules.ts');

if (!fs.existsSync(inputFile)) {
  console.error(`[Error] Cannot find source file: ${inputFile}`);
  console.error('Usage: npm run extract-rules -- <path-to-original-index.js>');
  process.exit(1);
}

console.log(`[Extract] Parsing ${inputFile}...`);
const sourceCode = fs.readFileSync(inputFile, 'utf8');
const parsed = babel.parseSync(sourceCode, { sourceType: 'script' });
if (!parsed) throw new Error(`Unable to parse source file: ${inputFile}`);

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function containsDocumentationUrl(node: Node | null | undefined): boolean {
  if (!node) return false;
  if (
    t.isStringLiteral(node) &&
    /\/(?:dev\/(?:api|component)\/|configuration\/(?:app|page)\.html)/.test(node.value)
  ) {
    return true;
  }
  for (const value of Object.values(node)) {
    if (t.isNode(value) && containsDocumentationUrl(value)) return true;
    if (Array.isArray(value) && value.some((child) => t.isNode(child) && containsDocumentationUrl(child))) {
      return true;
    }
  }
  return false;
}

function isStaticInitializer(node: Node | null | undefined): boolean {
  return (
    !!node &&
    (t.isObjectExpression(node) ||
      t.isArrayExpression(node) ||
      t.isIdentifier(node) ||
      (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'Object' }) &&
        t.isIdentifier(node.callee.property, { name: 'freeze' })))
  );
}

function collectReferences(
  node: Node | null | undefined,
  references: string[] = [],
  parent?: Node,
  property?: string
): string[] {
  if (!node) return references;
  if (t.isIdentifier(node)) {
    if (
      !(
        (parent &&
          t.isObjectProperty(parent) &&
          property === 'key' &&
          !parent.computed &&
          !parent.shorthand) ||
        (parent && t.isMemberExpression(parent) && property === 'property' && !parent.computed)
      )
    ) {
      references.push(node.name);
    }
    return references;
  }

  for (const [key, value] of Object.entries(node)) {
    if (t.isNode(value)) collectReferences(value, references, node, key);
    else if (Array.isArray(value)) {
      for (const child of value) {
        if (t.isNode(child)) collectReferences(child, references, node, key);
      }
    }
  }
  return references;
}

const declarationsByName = new Map<string, DeclarationEntry>();
for (const node of parsed.program.body) {
  if (!t.isVariableDeclaration(node)) continue;
  for (const decl of node.declarations) {
    if (t.isIdentifier(decl.id)) declarationsByName.set(decl.id.name, { node, decl });
  }
}

const staticNodes: VariableDeclaration[] = [];
const includedDeclarations = new Set<VariableDeclarator>();
function includeDeclaration(entry: DeclarationEntry): void {
  if (includedDeclarations.has(entry.decl) || !isStaticInitializer(entry.decl.init)) return;
  includedDeclarations.add(entry.decl);

  for (const name of collectReferences(entry.decl.init)) {
    const dependency = declarationsByName.get(name);
    if (dependency) includeDeclaration(dependency);
  }

  staticNodes.push(t.variableDeclaration(entry.node.kind, [entry.decl]));
}

for (const entry of declarationsByName.values()) {
  if (containsDocumentationUrl(entry.decl.init)) includeDeclaration(entry);
}

const staticCode = babel.transformFromAstSync(t.file(t.program(staticNodes)), sourceCode)?.code;
if (!staticCode) throw new Error(`Unable to generate static declarations from ${inputFile}`);

const sandbox: JsonRecord = {
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

vm.createContext(sandbox);
vm.runInContext(staticCode, sandbox);

const apis: Record<string, JsonRecord> = {};
const components: Record<string, JsonRecord> = {};
const globalconfig: Record<string, JsonRecord> = {};
const pageconfig: Record<string, JsonRecord> = {};

function addRule(target: Record<string, JsonRecord>, name: string, value: unknown): void {
  if (isRecord(value)) target[name] = value;
}

function addByDocumentationUrl(name: string, value: JsonRecord): void {
  const url = isRecord(value.url) ? value.url : undefined;
  const original = url?.original;
  if (typeof original !== 'string') return;

  const cleanName = name.replace(/\$\d+$/, '');
  if (original.includes('/dev/api/')) addRule(apis, cleanName, value);
  else if (original.includes('/dev/component/')) addRule(components, cleanName, value);
  else if (original.includes('/configuration/app.html')) addRule(globalconfig, cleanName, value);
  else if (original.includes('/configuration/page.html')) addRule(pageconfig, cleanName, value);
}

for (const [varName, value] of Object.entries(sandbox)) {
  if (!isRecord(value)) continue;
  addByDocumentationUrl(varName, value);

  for (const [subKey, subValue] of Object.entries(value)) {
    if (isRecord(subValue)) addByDocumentationUrl(subKey, subValue);
  }
}

const apiRenameMap: Record<string, string> = {};
const paramRenameMap: Record<string, Record<string, string>> = {};

for (const [apiName, rule] of Object.entries(apis)) {
  const body = isRecord(rule.body) ? rule.body : undefined;
  if (body?.type === 1 && typeof body.value === 'string') {
    apiRenameMap[apiName] = body.value;
  }

  const params = body && isRecord(body.params) ? body.params : undefined;
  const props = params && isRecord(params.props) ? params.props : undefined;
  if (!props) continue;

  for (const [propKey, propValue] of Object.entries(props)) {
    if (!isRecord(propValue)) continue;
    if (propValue.type === 1 && typeof propValue.msg === 'string') {
      paramRenameMap[apiName] ??= {};
      paramRenameMap[apiName][propKey] = propValue.msg;
    }
  }
}

const outputContent = `// Auto-generated from original index.js by scripts/extract-rules.ts
import type { Rule } from './types';

export const API_RENAME_MAP: Record<string, string> = ${JSON.stringify(apiRenameMap, null, 2)};

export const PARAM_RENAME_MAP: Record<string, Record<string, string>> = ${JSON.stringify(paramRenameMap, null, 2)};

export const CONTEXT_MANAGERS: Record<string, string> = {
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

export const apis = ${JSON.stringify(apis, null, 2)} as Record<string, Rule>;

export const components = ${JSON.stringify(components, null, 2)} as Record<string, Rule>;

export const globalconfig = ${JSON.stringify(globalconfig, null, 2)} as Record<string, Rule>;

export const pageconfig = ${JSON.stringify(pageconfig, null, 2)} as Record<string, Rule>;
`;

fs.writeFileSync(outputFile, outputContent, 'utf8');
console.log(
  `[Extract] Success! Extracted ${Object.keys(apis).length} APIs and ${Object.keys(components).length} components to src/rules.ts`
);
