'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var fsExtra = require('@macle/fs-extra');
var fs = require('fs');
var open = require('@macle/open');
var prettier = require('prettier');
var htmlparser2 = require('htmlparser2');
var core = require('@babel/core');
var os = require('os');
var postcss = require('postcss');
var jsBase64 = require('js-base64');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fsExtra__default = /*#__PURE__*/_interopDefaultLegacy(fsExtra);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var open__default = /*#__PURE__*/_interopDefaultLegacy(open);
var prettier__default = /*#__PURE__*/_interopDefaultLegacy(prettier);
var htmlparser2__default = /*#__PURE__*/_interopDefaultLegacy(htmlparser2);
var core__default = /*#__PURE__*/_interopDefaultLegacy(core);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var jsBase64__default = /*#__PURE__*/_interopDefaultLegacy(jsBase64);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

let entry = '';
let packageInfo = null;
function parserFileInfo(filepath, deep, parent) {
  return {
    type: fsExtra__default["default"].statSync(filepath).isFile() ? 'file' : 'directory',
    path: filepath,
    extname: path__default["default"].extname(filepath),
    filename: path__default["default"].basename(filepath),
    dirname: path__default["default"].dirname(filepath),
    basename: path__default["default"].basename(filepath).split('.')[0],
    children: null,
    parent,
    deep
  };
}
const exportObj$4 = {
  emptyFiles(dirname, fileArr = []) {
    fsExtra__default["default"].readdirSync(dirname).forEach(filename => {
      if (!fileArr.includes(filename)) {
        fsExtra__default["default"].removeSync(path__default["default"].join(dirname, filename));
      }
    });
  },
  parserDirInfo(options = {}, cb = () => {}, deep = 0, parent = null) {
    const dirpath = options.dirpath;
    const temp = fsExtra__default["default"].readdirSync(dirpath);
    let files = [];
    entry = options.entry;
    if (!packageInfo && fsExtra__default["default"].pathExistsSync(path__default["default"].join(entry, 'package.json'))) {
      packageInfo = JSON.parse(fsExtra__default["default"].readFileSync(path__default["default"].join(entry, 'package.json'), 'utf8'));
    }
    temp.forEach(filename => {
      if (filename === 'node_modules') {
        return files;
      }
      let fileinfo = path__default["default"].join(dirpath, filename);
      fileinfo = parserFileInfo(fileinfo, deep, parent);
      fileinfo.entry = entry;
      let ismatch;
      options.exclude.forEach(reg => {
        if (fileinfo.path.match(reg) || fileinfo.filename.match(reg)) {
          ismatch = true;
        }
        return ismatch;
      });
      if (ismatch) {
        return ismatch;
      }
      cb(fileinfo);
      if (fileinfo.type === 'directory') {
        const _opts = Object.assign({}, options, {
          dirpath: fileinfo.path
        });
        fileinfo.children = exportObj$4.parserDirInfo(_opts, cb, deep + 1, fileinfo);
      } else {
        fileinfo.packageInfo = packageInfo;
      }
      files.push(fileinfo);
      return files;
    });
    let isComponent = 0;
    let wxmlFileIndex = 0;
    files.forEach((el, i) => {
      const ext = el.extname;
      if (ext === '.wxml') {
        wxmlFileIndex = i;
      }
      if (ext === '.json' || ext === '.wxml') {
        isComponent++;
      }
    });
    isComponent = isComponent === 2;
    if (isComponent) {
      const _el = files.splice(wxmlFileIndex, 1);
      files.unshift(_el[0]);
    }
    const newPathArr = [...files];
    if (newPathArr.length > 4) {
      const pathData = {};
      newPathArr.forEach(obj => {
        const baseName = obj.basename || 'null';
        pathData[baseName] = pathData[baseName] || [];
        pathData[baseName].push(obj);
      });
      let pathDataArr = [];
      Object.keys(pathData).forEach(key => {
        pathData[key].forEach((item, index) => {
          if (item.extname === '.json') {
            pathData[key].splice(index, 1);
            pathData[key].push(item);
          }
        });
        pathDataArr = [...pathDataArr, ...pathData[key]];
      });
      files = pathDataArr;
    }
    return files;
  },
  callIfIsFunc(cb, params, p2) {
    cb(params, p2);
  }
};
var file$4 = exportObj$4;

const {
  parserDirInfo,
  callIfIsFunc
} = file$4;
function walk(fn, arr = []) {
  arr.forEach(element => {
    if (Array.isArray(element.children)) {
      walk(fn, element.children);
    } else {
      fn && fn(element);
    }
  });
}
const copyFile = (sourcePath, targetPath) => {
  fsExtra__default["default"].copySync(sourcePath, targetPath);
};
function getNodeModules(dir) {
  const dirPath = path__default["default"].resolve(__dirname, dir);
  // 该文件夹下的所有文件名称 (文件夹 + 文件)
  const files = fs__default["default"].readdirSync(dirPath);
  let result = '';
  try {
    files.forEach(file => {
      // 当前文件 | 文件夹的路径
      const filePath = `${dir}/${file}`;

      // 满足查询条件文件
      if (file === 'node_modules') {
        throw filePath;
      }

      // 继续深搜文件夹
      if (fs__default["default"].statSync(filePath).isDirectory()) {
        const cRes = getNodeModules(filePath);
        if (cRes) {
          throw cRes;
        }
      }
    });
  } catch (res) {
    result = res;
  }
  return result;
}
function judgeDirSame$1(entry, output) {
  return entry === output;
}
var transform = class Transform {
  constructor(plugin, option = {}) {
    this.$options = option || {};
    this.$plugin = plugin;
  }
  beforeRun() {
    const inputDir = this.$options.entry;
    const outputDir = this.$options.dist;
    const {
      lifeCycles
    } = this.$plugin;
    const selfThis = this;
    this.$options.exclude = this.$options.exclude.concat(lifeCycles.defaultOptions.exclude);
    lifeCycles.$options = Object.assign(lifeCycles.defaultOptions, this.$options);
    lifeCycles.beforeParse(() => {
      selfThis.run(inputDir, outputDir);
    });
  }
  run(inputDir, outputDir) {
    const selfThis = this;
    this.entry = inputDir;
    this.output = outputDir;
    this.$plugin.$options = this.$options;
    const {
      lifeCycles
    } = this.$plugin;
    const _opts = {
      ...this.$options,
      dirpath: inputDir
    };
    if (this.$options.type === 'h5-macle' && judgeDirSame$1(this.$options.entry, this.$options.dist)) {
      callIfIsFunc(lifeCycles.compiled.bind(this), this);
    } else {
      const modulesPath = getNodeModules(this.$options.entry);
      let nodeModulesTargetPath = '';
      nodeModulesTargetPath = this.$options.ifGenerate ? `${this.$options.dist}${path__default["default"].sep}app${path__default["default"].sep}node_modules` : `${this.$options.dist}${path__default["default"].sep}node_modules`;
      modulesPath && copyFile(modulesPath, nodeModulesTargetPath);
      const inputProjectInfo = parserDirInfo(_opts, info => {
        const inputDirNew = inputDir.replace(/\//g, path__default["default"].sep);
        info.dist = path__default["default"].join(outputDir, info.path.split(inputDirNew)[1]);
        callIfIsFunc(lifeCycles.onParsing.bind(selfThis.$plugin), info);
      });
      walk(fileInfo => {
        callIfIsFunc(lifeCycles.onCompiling.bind(selfThis.$plugin), fileInfo, selfThis);
      }, inputProjectInfo);
      callIfIsFunc(lifeCycles.compiled.bind(this), this);
    }
  }
};

function processOpt(opts = {}) {
  opts.exclude = [];
  // 排除输出目录
  if (opts.type !== 'h5-macle') {
    opts.exclude.push(/^\.\w+/);
  } else {
    opts.exclude.push('.claude');
    opts.exclude.push('.opencode');
    opts.exclude.push('.git');
    opts.exclude.push('.macle');
  }
  opts.exclude.push(opts.dist);
}
var convertor$1 = function () {
  const app = {
    plugins: []
  };
  app.use = function (plugin, opts) {
    processOpt(opts);
    app.plugins.push({
      plugin,
      opts
    });
    return app;
  };
  app.start = function () {
    app.plugins.forEach(plugin => {
      new transform(plugin.plugin, plugin.opts).beforeRun();
    });
    return app;
  };
  return app;
};

var config$4 = {
  // 编译输出目录
  customReportPrefix: '/macle-report'
};

const logManager = {
  info: console.info,
  log: console.log,
  warn: console.warn,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd
};
var logManager_1 = logManager;

let config$3;
function exists(src, dst, callback) {
  if (fs__default["default"].existsSync(dst)) {
    callback(src, dst);
  } else {
    fs__default["default"].mkdirSync(dst);
    callback(src, dst);
  }
}
async function openBower(distpath) {
  const pageUrl = path__default["default"].join(distpath, '/report/index.html');
  await open__default["default"](pageUrl);
}
function copyDir(src, dst) {
  const paths = fs__default["default"].readdirSync(src);
  paths.forEach(_path => {
    const _src = `${src}/${_path}`;
    const _dst = `${dst}/${_path}`;
    let readable;
    let writable;
    const st = fs__default["default"].statSync(_src);
    if (st.isFile()) {
      readable = fs__default["default"].createReadStream(_src);
      writable = fs__default["default"].createWriteStream(_dst);
      readable.pipe(writable);
      return;
    }
    if (st.isDirectory()) {
      exists(_src, _dst, copyDir);
    }
  });
}
function jsonConverFailCount(content, key, convertorCount) {
  const start = content.indexOf(key);
  let braceCount = 0;
  let end = content.length - 1;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
    }
    if (content[i] === '{') {
      braceCount--;
      if (braceCount === 0) {
        end = i;
        break;
      }
    }
  }
  convertorCount.jsonFailLineCount += content.substring(start, end).split(/\n/).length;
}
function obtainAttrs(ast, result, conf) {
  ast.forEach(item => {
    const eleName = item.type;
    // 查找规则
    const componentObj = {
      name: '',
      attrs: [],
      doc: ''
    };
    if (conf.components.descObject[eleName]) {
      const urlBody = conf.components.descObject[eleName];
      componentObj.name = eleName;
      try {
        componentObj.doc = urlBody.url.target || urlBody.url.original;
      } catch (err) {
        componentObj.doc = '';
      }
      for (const key in item.props) {
        if (item.props[key]) {
          const propsObj = urlBody.props || {};
          const props = propsObj[key];
          if (props && props.status === 2) {
            result.status = 2;
            componentObj.attrs.push(key);
          }
        }
      }
      // 组件不支持
      if (urlBody.status === 2) {
        result.status = 3;
        componentObj.attrs = ['不支持此组件'];
        componentObj.name = eleName;
      }
    }
    if (componentObj.attrs.length > 0) {
      let flag = false;
      result.components.forEach(_item => {
        if (_item.name === eleName) {
          flag = true;
          _item.attrs = [...new Set(_item.attrs.concat(componentObj.attrs))];
        }
      });
      if (!flag) {
        result.components.push(componentObj);
      }
    }
    if (item.children && item.children.length > 0) {
      obtainAttrs(item.children, result, conf);
    }
  });
}
const funs$1 = {};
function getCustomScript(pathInformation) {
  const result = {};
  result.type = 'modularWxs';
  result.components = [];
  const pathInfoArr = pathInformation.split(path__default["default"].sep);
  pathInfoArr.shift();
  const pagePath = pathInfoArr.join('/');
  result.status = 1;
  const obj = {};
  obj[pagePath] = result;
  return obj;
}
function getJsonDiff(pathInfo, content, convertorCount) {
  const result = {};
  result.type = 'jsonModular';
  result.components = [];
  const contentData = JSON.parse(content);
  Object.keys(contentData).forEach(key => {
    if (pathInfo.indexOf('project.config.json') !== -1) {
      return;
    }
    if (pathInfo.indexOf('pages') !== -1) {
      if (config$3.pageconfig[key]) {
        const jsonData = {
          name: key,
          attrs: [],
          doc: config$3.pageconfig[key].url.original || config$3.pageconfig[key].url.target
        };
        if (config$3.pageconfig[key].status === 2) {
          jsonData.attrs = ['属性不支持'];
          result.components.push(jsonData);
          jsonConverFailCount(content, key, convertorCount);
        }
      }
    } else {
      // app.json
      if (!config$3.globalconfig[key] || config$3.globalconfig[key].type === 7) {
        return;
      }
      const jsonData = {
        name: key,
        attrs: [],
        doc: config$3.globalconfig[key].url.original || config$3.globalconfig[key].url.target
      };
      if (config$3.globalconfig[key].status === 2) {
        jsonData.attrs = ['属性不支持'];
        result.components.push(jsonData);
        jsonConverFailCount(content, key, convertorCount);
        return;
      }
      if (config$3.globalconfig[key].status === 1) {
        if (config$3.globalconfig[key].props) {
          Object.keys(contentData[key]).forEach(prop => {
            if (config$3.globalconfig[key].props[prop] === undefined) {
              return;
            }
            if (config$3.globalconfig[key].props[prop].status === 2) {
              jsonData.attrs.push(prop);
              jsonConverFailCount(content, prop, convertorCount);
            }
          });
          if (jsonData.attrs.length > 0) {
            result.components.push(jsonData);
          }
        }
      }
    }
  });
  let pathInfoNew = pathInfo.replace(/\\/g, '/');
  const pathArray = pathInfoNew.split('/');
  pathArray.shift();
  const pagePath = pathArray.join('/');
  result.status = 1;
  if (result.components.length > 0) {
    result.status = 2;
  }
  // All not supported
  if (Object.keys(contentData).length === result.components.length && Object.keys(contentData).length !== 0) {
    result.status = 3;
  }
  const obj = {};
  obj[pagePath] = result;
  return obj;
}
function getOthersFile(url) {
  const result = {};
  result.type = 'otherModular';
  result.components = [];
  const dirArr = url.replace(/\\/g, '/').split('/');
  dirArr.shift(dirArr[0]);
  const pagePath = dirArr.join('/');
  result.status = 1;
  const obj = {};
  obj[pagePath] = result;
  return obj;
}
function getStyleData(pathInfoRaw) {
  const result = {};
  result.components = [];
  result.type = 'wxssModular';
  result.status = 1;
  let pathInfo = pathInfoRaw.replace(/\\/g, '/');
  const pathArr = pathInfo.split('/');
  pathArr.shift();
  const pagePath = pathArr.join('/');
  const obj = {};
  obj[pagePath] = result;
  return obj;
}
function getTemplateDataDiff(fileInfo, projectName = '') {
  const result = {};
  result.components = [];
  result.type = 'templete';
  let prjPath = '';
  let pagePath = '';
  if (projectName) {
    let temp = fileInfo.path && fileInfo.path.replace(/\\/g, '/').split(projectName.replace(/\\/g, '/'))[1];
    pagePath = temp ? temp.substr(1) : undefined;
  } else if (fileInfo.path.indexOf('pages') !== -1) {
    prjPath = fileInfo.path.split('pages')[0];
    pagePath = fileInfo.path.split(prjPath)[1].replace(/\\/g, '/');
  } else {
    prjPath = fileInfo.path.split('components')[0];
    pagePath = fileInfo.path.split(prjPath)[1].replace(/\\/g, '/');
  }
  result.status = 1;
  obtainAttrs(fileInfo.ast, result, config$3);
  let obj;
  if (pagePath) {
    obj = {};
    obj[pagePath] = result;
  }
  return obj;
}
function getAPIDocUrl(apiInfo, projectType = 'wx') {
  if (apiInfo) {
    if (projectType === 'my') {
      return apiInfo.url.overseasUrl || '';
    }
    return apiInfo.url.target || apiInfo.url.original;
  }
  return '';
}
function getScriptData(pathInfoRaw, apiObj, originCode, projectType = 'wx') {
  const result = {};
  result.status = 1;
  result.openData = [];
  result.components = [];
  const pathInfo = pathInfoRaw.replace(/\\/g, '/');
  const pathArr = pathInfo.split('/');
  pathArr.shift();
  function partialSupportProps(apiresilt, item) {
    const apiProps = apiObj[item].props;
    apiresilt.name = `${projectType}.${item}`;
    const apiBody = config$3.apis.descObject[item].body;
    const params = apiBody.params || {};
    const propskey = params.props || {};
    const defectArr = [];
    const differenceArr = [];
    if (apiBody.type === 1) {
      apiresilt.attrs.push(`命名差异: ${apiresilt.name} => ma.${apiBody.value}`);
    }
    Object.keys(propskey).forEach(prop => {
      if (apiProps) {
        if (apiProps.includes(prop)) {
          if (propskey[prop].type === 0) {
            defectArr.push(prop);
            return;
          }
          if (propskey[prop].type === 4) {
            differenceArr.push(`${prop}的默认值`);
          }
          if (propskey[prop].type !== 7 && propskey[prop].type !== 1 && propskey[prop].type !== 4) {
            differenceArr.push(prop);
          }
        }
      } else {
        if (propskey[prop].type === 0) {
          defectArr.push(prop);
          return;
        }
        if (propskey[prop].type !== 7) {
          differenceArr.push(prop);
        }
      }
    });
    defectArr.length > 0 && apiresilt.attrs.push(`不支持参数${defectArr.join('、')}`);
    differenceArr.length > 0 && apiresilt.attrs.push(`参数${differenceArr.join('、')} 存在差异`);
    if (apiresilt.attrs.length !== 0) {
      result.components.push(apiresilt);
      if (result.status !== 3) {
        result.status = 2;
      }
    }
  }
  const pagePath = pathArr.join('/');
  result.type = 'jsModular';
  Object.keys(apiObj).forEach(item => {
    const apiresilt = {};
    apiresilt.attrs = [];
    apiresilt.doc = getAPIDocUrl(config$3.apis.descObject[item], projectType);
    if (config$3.apis.descObject[item] && config$3.apis.descObject[item].status === 1) {
      partialSupportProps(apiresilt, item);
      return;
    }
    if (!config$3.apis.descObject[item] || config$3.apis.descObject[item].status === 2) {
      result.status = 3;
      apiresilt.name = `${projectType}.${item}`;
      apiresilt.attrs = ['不支持'];
      result.components.push(apiresilt);
    }
  });
  const resultData = {};
  resultData[pagePath] = result;
  return resultData;
}
function statistics(transforms) {
  const statisticInfo = {
    modelAll: 0,
    completely: 0,
    partial: 0,
    notsupport: 0
  };
  Object.keys(transforms).forEach(key => {
    statisticInfo.modelAll++;
    if (transforms[key].status === 1) {
      statisticInfo.completely++;
    } else if (transforms[key].status === 2) {
      statisticInfo.partial++;
    } else {
      statisticInfo.notsupport++;
    }
  });
  return statisticInfo;
}
function writeReportPage(data, distpath, isAutoOpenReport, extensionPath, lan = 'zh') {
  const dayastr = `window.pageData = ${JSON.stringify(data)};window.ideLan="${lan}"`;
  const local = path__default["default"].join(distpath.replace(/\\/g, '/').split('/.config.json')[0]);
  const htmlPath = path__default["default"].join(local, '/report');
  let viewPagePath = '';
  let dataFilePath = '';
  if (extensionPath) {
    viewPagePath = path__default["default"].join(extensionPath, '/node_modules/@macle/convertor/dist/view');
  } else {
    viewPagePath = path__default["default"].join(__dirname, './view');
  }
  if (fs__default["default"].existsSync(htmlPath)) {
    exists(viewPagePath, htmlPath, copyDir);
  } else {
    fs__default["default"].mkdirSync(htmlPath);
    exists(viewPagePath, htmlPath, copyDir);
  }
  dataFilePath = path__default["default"].join(htmlPath, 'js', 'data.js');
  if (fs__default["default"].existsSync(dataFilePath)) {
    fs__default["default"].unlinkSync(dataFilePath);
  }
  fs__default["default"].writeFileSync(dataFilePath, dayastr);
  logManager_1.log('即将打开日志页面...');
  if (isAutoOpenReport) {
    openBower(local);
  }
}
function resultDataInit() {
  return {
    transforms: {},
    apisLineMap: {}
  };
}
function statisticsAndReport(project, repData, output, ...args) {
  let [convertorCount, isAutoOpenReport, extensionPath, lan] = args;
  const tableInfo = {
    项目名称: project.name,
    项目路径: project.path,
    输出路径: project.distPath,
    文件数: String(project.fileNum)
  };
  repData.tableInfo = tableInfo;
  const statisticsData = statistics(repData.transforms);
  repData.opening = {};
  repData.concept = statisticsData;
  const targetPath = path__default["default"].join(output, `${config$4.customReportPrefix}`);
  if (!fs__default["default"].existsSync(targetPath)) {
    fs__default["default"].mkdirSync(targetPath);
  }
  writeReportPage(repData, targetPath, isAutoOpenReport, extensionPath, lan);
}
funs$1.getCustomScript = getCustomScript;
funs$1.getJsonDiff = getJsonDiff;
funs$1.getOthersFile = getOthersFile;
funs$1.getStyleData = getStyleData;
funs$1.getTemplateDataDiff = getTemplateDataDiff;
funs$1.getScriptData = getScriptData;
funs$1.statistics = statistics;
funs$1.writeReportPage = writeReportPage;
funs$1.resultDataInit = resultDataInit;
funs$1.statisticsAndReport = statisticsAndReport;
var record$3 = function (configs = {}) {
  config$3 = configs;
  return funs$1;
};

const exportObj$3 = {
  blue(str) {
    return `\x1b[1m\x1b[34m${str}\x1b[39m\x1b[22m`;
  },
  red(str) {
    return `\x1B[31m${str}\x1B[0m`;
  },
  magenta(str) {
    return `\x1B[35m${str}\x1B[0m`;
  },
  gray(str) {
    return `\x1B[2m${str}\x1B[0m`;
  }
};
var chalk = exportObj$3;

var preprocessCode = {
  prettierCode(code = '', type = 'babel', opts = {}) {
    let option = {
      semi: true,
      parser: type,
      tabWidth: 4
    };
    option = Object.assign(option, opts);
    let codeNew = code;
    prettier__default["default"].format(code, option).then(res => {
      codeNew = res;
    });
    return codeNew;
  }
};

const {
  emptyFiles: emptyFiles$2
} = file$4;
const {
  red: red$3,
  blue: blue$1,
  magenta: magenta$4,
  gray: gray$1
} = chalk;
const {
  prettierCode: prettierCode$4
} = preprocessCode;
var utils = {
  isTypeFile(extname, filepath) {
    return extname === path__default["default"].extname(filepath);
  },
  createSupportProp(desc) {
    return {
      type: 7,
      status: 0,
      desc
    };
  },
  emptyFiles: emptyFiles$2,
  record: record$3,
  prettierCode: prettierCode$4,
  red: red$3,
  blue: blue$1,
  magenta: magenta$4,
  gray: gray$1
};

function processProps$1(obj = {}) {
  const props = {};
  Object.keys(obj).forEach(prop => {
    const val = obj[prop];
    props[prop] = {
      type: 'unknown',
      value: [val]
    };
  });
  return props;
}
function createText(text, parser) {
  return {
    value: text,
    parent: null,
    type: 'textContent',
    start: parser.startIndex,
    end: parser.endIndex
  };
}
function parseString$2(code) {
  const astCode = [];
  let zIndex = 0;
  let currentNode = null;
  let tagIsText = false;
  let preTextNode = null;
  const parser = new htmlparser2__default["default"].Parser({
    onopentag(name, attrs) {
      const node = {
        type: name,
        props: processProps$1(attrs),
        children: [],
        parent: null,
        start: parser.startIndex,
        end: parser.endIndex
      };
      let _fn = 'push';
      if (name === 'wxs') {
        _fn = 'unshift';
      }
      if (zIndex === 0) {
        currentNode = node;
        astCode[_fn](node);
      } else {
        node.parent = currentNode;
        currentNode.children[_fn](node);
        currentNode = node;
      }
      tagIsText = false;
      zIndex++;
    },
    ontext(contentRaw) {
      const content = contentRaw.trim();
      if (content) {
        if (tagIsText) {
          preTextNode.value += content;
          return;
        }
        const node = createText(content, parser);
        if (zIndex === 0) {
          astCode.push(node);
        } else {
          node.parent = currentNode;
          currentNode.children.push(node);
        }
        preTextNode = node;
        tagIsText = true;
      }
    },
    onclosetag() {
      zIndex--;
      currentNode.end = parser.endIndex;
      currentNode = currentNode.parent;
      tagIsText = false;
    }
  }, {
    decodeEntities: false,
    xmlMode: true
  });
  parser.write(code);
  parser.end();
  return astCode;
}
const funs = {};
funs.createText = createText;
funs.parseString = parseString$2;
var parseml = function () {
  return funs;
};

const {
  parseString: parseString$1
} = parseml();
function parseFile$1(filename) {
  const code = fs__default["default"].readFileSync(filename, 'utf8');
  const ast = parseString$1(code);
  return [...ast];
}
var parse_1$1 = {
  parseFile: parseFile$1,
  parseString: parseString$1
};

var rename = function (...p) {
  return {
    visitor: {
      Identifier(path) {
        if (path.node.name === p[1].entryName) {
          path.node.name = p[1].outputName;
        }
      }
    }
  };
};

const apiMapConfig$4 = {
  'getRecorderManager': {
    prefix: 'RecorderManager',
    identifer: []
  },
  'getFileSystemManager': {
    prefix: 'FileSystemManager',
    identifer: []
  },
  'downloadFile': {
    prefix: 'DownloadTask',
    identifer: []
  },
  'createCameraContext': {
    prefix: 'CameraContext',
    identifer: []
  },
  'createVideoContext': {
    prefix: 'VideoContext',
    identifer: []
  },
  'createAudioContext': {
    prefix: 'AudioContext',
    identifer: []
  },
  'createSelectorQuery': {
    prefix: 'SelectorQuery',
    identifer: []
  },
  'createMapContext': {
    prefix: 'MapContext',
    identifer: []
  },
  'getUpdateManager': {
    prefix: 'UpdateManager',
    identifer: []
  }
};
var apiMapConfig_1 = {
  apiMapConfig: apiMapConfig$4
};

const {
  apiMapConfig: apiMapConfig$3,
  apiCallee
} = apiMapConfig_1;
var replaceCallMember = function (...p) {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.object && path.node.callee.object.name === p[1].entryName) {
          p[1].cb(path.node.callee.property.name, path.node.arguments, path.node);
        }
        for (let key in apiMapConfig$3) {
          if (path.node.callee.object && apiMapConfig$3[key].identifer.indexOf(path.node.callee.object.name) > -1) {
            p[1].cb(`${apiMapConfig$3[key].prefix}.${path.node.callee.property.name}`, path.node.arguments, path.node);
          }
        }
      }
    }
  };
};

var sjsToMacle = function (babel) {
  const t = babel.types;
  return {
    visitor: {
      ExportDefaultDeclaration(path) {
        path.node.declaration.properties.forEach(node => {
          node.shorthand = false;
        });
        path.replaceWith(t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('module'), t.identifier('exports')), path.node.declaration)));
      }
    }
  };
};

const {
  apiMapConfig: apiMapConfig$2
} = apiMapConfig_1;
var replaceCallee = function (...p) {
  return {
    visitor: {
      MemberExpression(path) {
        if (path.node.object.type === 'Identifier' && path.node.object.name === p[1].entryName) {
          p[1].opts[path.node.property.name] = {
            props: []
          };
          if (typeof p[1].cb === 'function') {
            const args = path.parent.arguments || path.parent.argument;
            if (args) {
              p[1].cb(p[1].opts[path.node.property.name].props, args);
            }
          }
        }
        for (let key in apiMapConfig$2) {
          if (path.node.object.type === 'Identifier' && apiMapConfig$2[key].identifer.indexOf(path.node.object.name) > -1) {
            p[1].opts[`${apiMapConfig$2[key].prefix}.${path.node.property.name}`] = {
              props: []
            };
            if (typeof p[1].cb === 'function') {
              const args = path.parent.arguments || path.parent.argument;
              if (args) {
                p[1].cb(p[1].opts[`${apiMapConfig$2[key].prefix}.${path.node.property.name}`].props, args);
              }
            }
          }
        }
      }
    }
  };
};

const {
  apiMapConfig: apiMapConfig$1
} = apiMapConfig_1;
var collectIdentifer = function (...p) {
  return {
    visitor: {
      VariableDeclaration(path) {
        const declarations = path.node.declarations;
        for (const declaration of declarations) {
          if (declaration && declaration.type === 'VariableDeclarator') {
            const init = declaration.init;
            if (init && init.type === 'CallExpression' && init.callee.object && init.callee.object.name === p[1].entryName) {
              if (init.callee.property.type === 'Identifier' && apiMapConfig$1[init.callee.property.name]) {
                const id = declaration.id;
                apiMapConfig$1[init.callee.property.name].identifer.push(id.name);
              }
            }
          }
        }
      }
    }
  };
};

const {
  magenta: magenta$3
} = utils;
function collectIdentiferHandleFn$1(code, entryName) {
  return core__default["default"].transform(code, {
    plugins: [[collectIdentifer, {
      entryName
    }]]
  });
}
function renamehandleFn$1(code, entryName, outputName) {
  return core__default["default"].transform(code, {
    plugins: [[rename, {
      entryName,
      outputName
    }]]
  }).code;
}
function replaceCallMemberHandleFn$1(code, entryName, cb) {
  return core__default["default"].transform(code, {
    plugins: [[replaceCallMember, {
      entryName,
      cb
    }]]
  }).code;
}
function getAttrsHandleFn$1(code, entryName, outputName, cb, opts = {}) {
  return core__default["default"].transform(code, {
    plugins: [[replaceCallee, {
      entryName,
      outputName,
      opts,
      cb
    }]]
  }).code;
}
function transformEs5$1(code) {
  return core__default["default"].transform(code, {
    plugins: [[sjsToMacle]]
  }).code;
}
function tryToBabel(fn) {
  return function (...args) {
    const code = args[0];
    try {
      return fn(...args);
    } catch (error) {
      logManager_1.log(magenta$3(`${error.message}`));
      return code;
    }
  };
}
var babel_1 = {
  renamehandleFn: tryToBabel(renamehandleFn$1),
  transformEs5: tryToBabel(transformEs5$1),
  replaceCallMemberHandleFn: tryToBabel(replaceCallMemberHandleFn$1),
  getAttrsHandleFn: tryToBabel(getAttrsHandleFn$1),
  collectIdentiferHandleFn: tryToBabel(collectIdentiferHandleFn$1)
};

function getAttr$1(prop) {
  let attr;
  if (prop.type === 'SpreadElement') {
    attr = prop.argument;
  } else {
    attr = prop.key;
  }
  return attr;
}
function getNonsupportApiConfigMap$2(apiInfo, nonsupportApiConfigMap, diffApiMap) {
  Object.keys(apiInfo).forEach(apiName => {
    const api = apiInfo[apiName];
    if (api.status === 1) {
      if (api.body && api.body.params && api.body.params.props) {
        const props = api.body.params.props;
        nonsupportApiConfigMap[apiName] = {};
        diffApiMap[apiName] = {
          status: 1
        };
        Object.keys(props).forEach(prop => {
          const value = props[prop];
          if (value.type === 1) {
            nonsupportApiConfigMap[apiName][prop] = value.msg;
          }
          if (value.type === 0 || value.type === 3) {
            diffApiMap[apiName][prop] = {};
            diffApiMap[apiName].status = 1;
          }
        });
      }
    }
    if (api.status === 2) {
      nonsupportApiConfigMap[apiName] = {};
      diffApiMap[apiName] = {
        status: 2
      };
    }
  });
}
function obtainAttrName$1(props, args) {
  if (Array.isArray(args)) {
    args.forEach(argument => {
      const properties = argument.properties;
      if (properties) {
        properties.forEach(prop => {
          const attr = getAttr$1(prop);
          props.push(attr.name);
        });
      }
    });
  } else {
    const prop = args.property;
    let attr;
    if (prop.type === 'SpreadElement') {
      attr = prop.argument;
    } else {
      attr = prop;
    }
    props.push(attr.name);
  }
}
function mkParamsConfigMap$2(apiInfo, apiConfigMap) {
  Object.keys(apiInfo).forEach(apiName => {
    const api = apiInfo[apiName];
    if (api.status === 1) {
      if (api.body && api.body.params && api.body.params.props) {
        const props = api.body.params.props;
        apiConfigMap[apiName] = {};
        Object.keys(props).forEach(prop => {
          const value = props[prop];
          if (value.type === 1) {
            apiConfigMap[apiName][prop] = value.msg;
          }
        });
      }
    }
  });
}
var makeConfig = {
  getNonsupportApiConfigMap: getNonsupportApiConfigMap$2,
  obtainAttrName: obtainAttrName$1,
  getAttr: getAttr$1,
  mkParamsConfigMap: mkParamsConfigMap$2
};

var config$2 = {
  macleCallName: 'ma',
  apiSummaryMap: {
    wx: {
      nonsupportApiConfigMap: 'wxNonsupportApiConfigMap',
      diffApiMap: 'wxDiffApiMap',
      apiConfigMap: 'wxApiConfigMap',
      wholeApiMap: 'wxWholeApi'
    },
    my: {
      nonsupportApiConfigMap: 'aliNonsupportApiConfigMap',
      diffApiMap: 'aliDiffApiMap',
      apiConfigMap: 'aliApiConfigMap',
      wholeApiMap: 'aliWholeApi'
    }
  }
};

const {
  renamehandleFn,
  getAttrsHandleFn,
  replaceCallMemberHandleFn,
  collectIdentiferHandleFn
} = babel_1;
const {
  getAttr,
  obtainAttrName
} = makeConfig;
const {
  apiMapConfig
} = apiMapConfig_1;
function collectApiSection(node, name, apiName, prop, apisLine) {
  const diffApiMap = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].diffApiMap];
  const wholeConfigMap = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].wholeApiMap];
  if (diffApiMap[apiName]) {
    if (diffApiMap[apiName].status === 2) {
      apisLine[apiName] = {};
      apisLine[apiName].start = node.start;
      apisLine[apiName].end = node.end;
      return;
    }
    if (diffApiMap[apiName][name]) {
      apisLine[apiName] = {};
      apisLine[apiName][name] = {
        start: prop.start,
        end: prop.end
      };
    }
  }
  if (!wholeConfigMap[apiName]) {
    apisLine[apiName] = {};
    apisLine[apiName].start = node.start;
    apisLine[apiName].end = node.end;
  }
}
function collectUnsupportApis(apiName, props, node, apisLine) {
  const nonsupportApiConfigMap = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].nonsupportApiConfigMap];
  const wholeConfigMap = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].wholeApiMap];
  if (nonsupportApiConfigMap[apiName] || !wholeConfigMap[apiName]) {
    props.forEach(argument => {
      if (argument.type === 'ObjectExpression') {
        const properties = argument.properties;
        if (properties) {
          properties.forEach(prop => {
            const attr = getAttr(prop);
            const name = attr.name;
            collectApiSection(node, name, apiName, prop, apisLine);
          });
        }
      } else {
        let name;
        if (argument.type === 'Identifier') {
          name = argument.name;
        } else {
          name = argument.key;
        }
        collectApiSection(node, name, apiName, argument, apisLine);
      }
    });
  }
}
function parseAppJs$2(originCode, apis, apisLine) {
  let callName = commonjsGlobal.type;
  if (config$2.repacleCalleeName !== undefined) {
    callName = config$2.repacleCalleeName;
  }
  collectIdentiferHandleFn(originCode, callName);
  let parseCode = getAttrsHandleFn(originCode, callName, config$2.macleCallName, (props, args) => {
    obtainAttrName(props, args);
  }, apis);
  const apiConfigMap = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].apiConfigMap];
  parseCode = replaceCallMemberHandleFn(originCode, callName, (apiName, args, node) => {
    collectUnsupportApis(apiName, args, node, apisLine);
    if (apiConfigMap[apiName]) {
      args.forEach(argument => {
        const {
          properties
        } = argument;
        if (properties) {
          properties.forEach(prop => {
            const attr = getAttr(prop);
            if (attr.type === 'Identifier') {
              if (apiConfigMap[apiName][attr.name]) {
                attr.name = apiConfigMap[apiName][attr.name];
              }
            }
          });
        }
      });
    }
  });
  parseCode = renamehandleFn(originCode, callName, config$2.macleCallName);
  const wholeApis = commonjsGlobal[config$2.apiSummaryMap[commonjsGlobal.type].wholeApiMap];
  for (const api in apis) {
    if (wholeApis[api] && wholeApis[api].body.type === 1) {
      parseCode = parseCode.replaceAll(`ma.${api}`, `ma.${wholeApis[api].body.value}`);
    }
  }
  Object.values(apiMapConfig).forEach(value => {
    value.identifer = [];
  });
  return parseCode;
}
var compilejs = {
  parseAppJs: parseAppJs$2
};

var canIUse$1 = {
	status: 0,
	desc: "判断小程序的 API，回调，参数，组件等是否在当前版本可用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wx.canIUse.html",
		target: ""
	},
	body: {
	}
};
var getSystemSetting$1 = {
	status: 0,
	desc: "获取设备设置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemSetting.html",
		target: ""
	},
	body: {
	}
};
var getSystemInfoSync$1 = {
	status: 1,
	desc: "获取系统信息同步版本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wx.getSystemInfoSync.html",
		target: ""
	},
	body: {
		msg: "返回值缺失",
		returnValue: {
			props: {
				version: {
					type: 0,
					desc: "微信版本号"
				},
				platform: {
					type: 0,
					desc: "客户端平台"
				},
				fontSizeSetting: {
					type: 0,
					desc: "用户字体大小（单位px）。以微信客户端「我 - 设置 - 通用 - 字体大小」中的设置为准"
				},
				SDKVersion: {
					type: 0,
					desc: "客户端基础库版本"
				},
				benchmarkLevel: {
					type: 0,
					desc: "设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）"
				},
				albumAuthorized: {
					type: 0,
					desc: "允许微信使用相册的开关（仅 iOS 有效）"
				},
				cameraAuthorized: {
					type: 0,
					desc: "允许微信使用摄像头的开关"
				},
				locationAuthorized: {
					type: 0,
					desc: "允许微信使用定位的开关"
				},
				microphoneAuthorized: {
					type: 0,
					desc: "允许微信使用麦克风的开关"
				},
				notificationAuthorized: {
					type: 0,
					desc: "允许微信通知的开关"
				},
				notificationAlertAuthorized: {
					type: 0,
					desc: "允许微信通知带有提醒的开关（仅 iOS 有效）"
				},
				notificationBadgeAuthorized: {
					type: 0,
					desc: "允许微信通知带有标记的开关（仅 iOS 有效）"
				},
				notificationSoundAuthorized: {
					type: 0,
					desc: "允许微信通知带有声音的开关（仅 iOS 有效）"
				},
				phoneCalendarAuthorized: {
					type: 0,
					desc: "允许微信使用日历的开关"
				},
				bluetoothEnabled: {
					type: 0,
					desc: "蓝牙的系统开关"
				},
				locationEnabled: {
					type: 0,
					desc: "地理位置的系统开关"
				},
				wifiEnabled: {
					type: 0,
					desc: "Wi-Fi 的系统开关"
				},
				safeArea: {
					type: 0,
					desc: "在竖屏正方向下的安全区域"
				},
				locationReducedAccuracy: {
					type: 0,
					desc: "系统当前主题，取值为light或dark，全局配置darkmode:true时才能获取，否则为 undefined （不支持小游戏）"
				},
				host: {
					type: 0,
					desc: "当前小程序运行的宿主环境"
				},
				enableDebug: {
					type: 0,
					desc: "是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试。"
				},
				deviceOrientation: {
					type: 0,
					desc: "设备方向"
				}
			}
		}
	}
};
var getSystemInfo$1 = {
	status: 1,
	desc: "获取系统信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/system/system-info/wx.getSystemInfo.html",
		target: ""
	},
	body: {
		msg: "返回值缺失",
		returnValue: {
			props: {
				version: {
					type: 0,
					desc: "微信版本号"
				},
				platform: {
					type: 0,
					desc: "客户端平台"
				},
				fontSizeSetting: {
					type: 0,
					desc: "用户字体大小（单位px）。以微信客户端「我 - 设置 - 通用 - 字体大小」中的设置为准"
				},
				SDKVersion: {
					type: 0,
					desc: "客户端基础库版本"
				},
				benchmarkLevel: {
					type: 0,
					desc: "设备性能等级（仅 Android）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）"
				},
				albumAuthorized: {
					type: 0,
					desc: "允许微信使用相册的开关（仅 iOS 有效）"
				},
				cameraAuthorized: {
					type: 0,
					desc: "允许微信使用摄像头的开关"
				},
				locationAuthorized: {
					type: 0,
					desc: "允许微信使用定位的开关"
				},
				microphoneAuthorized: {
					type: 0,
					desc: "允许微信使用麦克风的开关"
				},
				notificationAuthorized: {
					type: 0,
					desc: "允许微信通知的开关"
				},
				notificationAlertAuthorized: {
					type: 0,
					desc: "允许微信通知带有提醒的开关（仅 iOS 有效）"
				},
				notificationBadgeAuthorized: {
					type: 0,
					desc: "允许微信通知带有标记的开关（仅 iOS 有效）"
				},
				notificationSoundAuthorized: {
					type: 0,
					desc: "允许微信通知带有声音的开关（仅 iOS 有效）"
				},
				phoneCalendarAuthorized: {
					type: 0,
					desc: "允许微信使用日历的开关"
				},
				bluetoothEnabled: {
					type: 0,
					desc: "蓝牙的系统开关"
				},
				locationEnabled: {
					type: 0,
					desc: "地理位置的系统开关"
				},
				wifiEnabled: {
					type: 0,
					desc: "Wi-Fi 的系统开关"
				},
				safeArea: {
					type: 0,
					desc: "在竖屏正方向下的安全区域"
				},
				locationReducedAccuracy: {
					type: 0,
					desc: "系统当前主题，取值为light或dark，全局配置darkmode:true时才能获取，否则为 undefined （不支持小游戏）"
				},
				host: {
					type: 0,
					desc: "当前小程序运行的宿主环境"
				},
				enableDebug: {
					type: 0,
					desc: "是否已打开调试。可通过右上角菜单或 wx.setEnableDebug 打开调试。"
				},
				deviceOrientation: {
					type: 0,
					desc: "设备方向"
				}
			}
		}
	}
};
var getUpdateManager$1 = {
	status: 0,
	desc: "获取全局唯一的版本更新管理器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.getUpdateManager.html",
		target: ""
	},
	body: {
	}
};
var getLaunchOptionsSync$1 = {
	status: 1,
	desc: "获取小程序启动时的参数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html",
		target: ""
	},
	body: {
		msg: "返回值缺失",
		returnValue: {
			props: {
				path: {
					type: 0,
					desc: "启动小程序的路径"
				},
				scene: {
					type: 0,
					desc: "启动小程序的场景值"
				},
				query: {
					type: 0,
					desc: "启动小程序的 query 参数"
				},
				shareTicket: {
					type: 0,
					desc: "shareTicket"
				},
				referrerInfo: {
					type: 0,
					desc: "来源信息"
				},
				forwardMaterials: {
					type: 0,
					desc: "打开的文件信息数组"
				},
				chatType: {
					type: 0,
					desc: "群聊/单聊类型"
				},
				apiCategory: {
					type: 0,
					desc: "API 类别"
				}
			}
		}
	}
};
var onPageNotFound = {
	status: 2,
	desc: "监听小程序要打开的页面不存在事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html",
		target: ""
	},
	body: {
	}
};
var onError$1 = {
	status: 0,
	desc: "监听小程序错误事件。如脚本错误或 API 调用报错等。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html",
		target: ""
	},
	body: {
	}
};
var onAudioInterruptionBegin = {
	status: 2,
	desc: "监听音频因为受到系统占用而被中断开始事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionBegin.html",
		target: ""
	},
	body: {
	}
};
var onAudioInterruptionEnd = {
	status: 2,
	desc: "监听音频中断结束事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAudioInterruptionEnd.html",
		target: ""
	},
	body: {
	}
};
var onAppShow$1 = {
	status: 0,
	desc: "监听小程序切前台事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html",
		target: ""
	},
	body: {
	}
};
var onAppHide$1 = {
	status: 0,
	desc: "监听小程序切后台事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html",
		target: ""
	},
	body: {
	}
};
var offPageNotFound = {
	status: 2,
	desc: "取消监听小程序要打开的页面不存在事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offPageNotFound.html",
		target: ""
	},
	body: {
	}
};
var offError$1 = {
	status: 0,
	desc: "监听小程序切前台事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offError.html",
		target: ""
	},
	body: {
	}
};
var offAudioInterruptionBegin = {
	status: 2,
	desc: "取消监听音频因为受到系统占用而被中断开始事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAudioInterruptionBegin.html",
		target: ""
	},
	body: {
	}
};
var offAudioInterruptionEnd = {
	status: 2,
	desc: "取消监听音频中断结束事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAudioInterruptionEnd.html",
		target: ""
	},
	body: {
	}
};
var offAppShow$1 = {
	status: 0,
	desc: "取消监听小程序切前台事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppShow.html",
		target: ""
	},
	body: {
	}
};
var offAppHide$1 = {
	status: 0,
	desc: "取消监听小程序切后台事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offAppHide.html",
		target: ""
	},
	body: {
	}
};
var setEnableDebug = {
	status: 2,
	desc: "设置是否打开调试开关。此开关对正式版也能生效",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.setEnableDebug.html",
		target: ""
	},
	body: {
	}
};
var getLogManager = {
	status: 2,
	desc: "获取日志管理器对象。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getLogManager.html",
		target: ""
	},
	body: {
	}
};
var base64ToArrayBuffer$1 = {
	status: 0,
	desc: "将 Base64 字符串转成 ArrayBuffer 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.base64ToArrayBuffer.html",
		target: ""
	},
	body: {
	}
};
var arrayBufferToBase64$1 = {
	status: 0,
	desc: "将 ArrayBuffer 字符串转成 Base64 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.arrayBufferToBase64.html",
		target: ""
	},
	body: {
	}
};
var updateWeChatApp = {
	status: 2,
	desc: "更新客户端版本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/wx.updateWeChatApp.html",
		target: ""
	},
	body: {
	}
};
var getEnterOptionsSync = {
	status: 2,
	desc: "获取本次小程序启动时的参数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getEnterOptionsSync.html",
		target: ""
	},
	body: {
	}
};
var onUnhandledRejection = {
	status: 2,
	desc: "监听未处理的 Promise 拒绝事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html",
		target: ""
	},
	body: {
	}
};
var onThemeChange = {
	status: 2,
	desc: "监听系统主题改变事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onThemeChange.html",
		target: ""
	},
	body: {
	}
};
var offUnhandledRejection = {
	status: 2,
	desc: "取消监听未处理的 Promise 拒绝事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offUnhandledRejection.html",
		target: ""
	},
	body: {
	}
};
var offThemeChange = {
	status: 2,
	desc: "取消监听系统主题改变事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.offThemeChange.html",
		target: ""
	},
	body: {
	}
};
var getRealtimeLogManager = {
	status: 2,
	desc: "获取实时日志管理器对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/debug/wx.getRealtimeLogManager.html",
		target: ""
	},
	body: {
	}
};
var basic$6 = {
	canIUse: canIUse$1,
	getSystemSetting: getSystemSetting$1,
	getSystemInfoSync: getSystemInfoSync$1,
	getSystemInfo: getSystemInfo$1,
	getUpdateManager: getUpdateManager$1,
	"UpdateManager.applyUpdate": {
	status: 0,
	desc: "强制小程序重启并使用新版本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.applyUpdate.html",
		target: ""
	},
	body: {
	}
},
	"UpdateManager.onCheckForUpdate": {
	status: 0,
	desc: "监听后台请求检查更新结果事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onCheckForUpdate.html",
		target: ""
	},
	body: {
	}
},
	"UpdateManager.onUpdateReady": {
	status: 0,
	desc: "监听小程序有版本更新事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onUpdateReady.html",
		target: ""
	},
	body: {
	}
},
	"UpdateManager.onUpdateFailed": {
	status: 0,
	desc: "监听小程序更新失败事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/update/UpdateManager.onUpdateFailed.html",
		target: ""
	},
	body: {
	}
},
	getLaunchOptionsSync: getLaunchOptionsSync$1,
	onPageNotFound: onPageNotFound,
	onError: onError$1,
	onAudioInterruptionBegin: onAudioInterruptionBegin,
	onAudioInterruptionEnd: onAudioInterruptionEnd,
	onAppShow: onAppShow$1,
	onAppHide: onAppHide$1,
	offPageNotFound: offPageNotFound,
	offError: offError$1,
	offAudioInterruptionBegin: offAudioInterruptionBegin,
	offAudioInterruptionEnd: offAudioInterruptionEnd,
	offAppShow: offAppShow$1,
	offAppHide: offAppHide$1,
	setEnableDebug: setEnableDebug,
	getLogManager: getLogManager,
	base64ToArrayBuffer: base64ToArrayBuffer$1,
	arrayBufferToBase64: arrayBufferToBase64$1,
	updateWeChatApp: updateWeChatApp,
	getEnterOptionsSync: getEnterOptionsSync,
	onUnhandledRejection: onUnhandledRejection,
	onThemeChange: onThemeChange,
	offUnhandledRejection: offUnhandledRejection,
	offThemeChange: offThemeChange,
	getRealtimeLogManager: getRealtimeLogManager
};

var basic$7 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	canIUse: canIUse$1,
	getSystemSetting: getSystemSetting$1,
	getSystemInfoSync: getSystemInfoSync$1,
	getSystemInfo: getSystemInfo$1,
	getUpdateManager: getUpdateManager$1,
	getLaunchOptionsSync: getLaunchOptionsSync$1,
	onPageNotFound: onPageNotFound,
	onError: onError$1,
	onAudioInterruptionBegin: onAudioInterruptionBegin,
	onAudioInterruptionEnd: onAudioInterruptionEnd,
	onAppShow: onAppShow$1,
	onAppHide: onAppHide$1,
	offPageNotFound: offPageNotFound,
	offError: offError$1,
	offAudioInterruptionBegin: offAudioInterruptionBegin,
	offAudioInterruptionEnd: offAudioInterruptionEnd,
	offAppShow: offAppShow$1,
	offAppHide: offAppHide$1,
	setEnableDebug: setEnableDebug,
	getLogManager: getLogManager,
	base64ToArrayBuffer: base64ToArrayBuffer$1,
	arrayBufferToBase64: arrayBufferToBase64$1,
	updateWeChatApp: updateWeChatApp,
	getEnterOptionsSync: getEnterOptionsSync,
	onUnhandledRejection: onUnhandledRejection,
	onThemeChange: onThemeChange,
	offUnhandledRejection: offUnhandledRejection,
	offThemeChange: offThemeChange,
	getRealtimeLogManager: getRealtimeLogManager,
	'default': basic$6
});

var createCanvasContext$1 = {
	status: 2,
	desc: "创建 canvas 的绘图上下文 CanvasContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html",
		target: ""
	},
	body: {
	}
};
var canvasToTempFilePath = {
	status: 2,
	desc: "把当前画布指定区域的内容导出生成指定大小的图片",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasToTempFilePath.html",
		target: ""
	},
	body: {
	}
};
var canvasPutImageData = {
	status: 2,
	desc: "将像素数据绘制到画布",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasPutImageData.html",
		target: ""
	},
	body: {
	}
};
var canvasGetImageData = {
	status: 2,
	desc: "获取 canvas 区域隐含的像素数据。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.canvasGetImageData.html",
		target: ""
	},
	body: {
	}
};
var createOffscreenCanvas = {
	status: 2,
	desc: "创建离屏 canvas 实例",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createOffscreenCanvas.html",
		target: ""
	},
	body: {
	}
};
var canvas$6 = {
	createCanvasContext: createCanvasContext$1,
	canvasToTempFilePath: canvasToTempFilePath,
	canvasPutImageData: canvasPutImageData,
	canvasGetImageData: canvasGetImageData,
	createOffscreenCanvas: createOffscreenCanvas
};

var canvas$7 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	createCanvasContext: createCanvasContext$1,
	canvasToTempFilePath: canvasToTempFilePath,
	canvasPutImageData: canvasPutImageData,
	canvasGetImageData: canvasGetImageData,
	createOffscreenCanvas: createOffscreenCanvas,
	'default': canvas$6
});

var stopBeaconDiscovery$1 = {
	status: 2,
	desc: "停止搜索附近的 iBeacon 设备",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.stopBeaconDiscovery.html",
		target: ""
	},
	body: {
	}
};
var startBeaconDiscovery$1 = {
	status: 2,
	desc: "开始搜索附近的 iBeacon 设备",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.startBeaconDiscovery.html",
		target: ""
	},
	body: {
	}
};
var onBeaconUpdate$1 = {
	status: 2,
	desc: "监听 iBeacon 设备更新事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.onBeaconUpdate.html",
		target: ""
	},
	body: {
	}
};
var onBeaconServiceChange$1 = {
	status: 2,
	desc: "监听 iBeacon 服务状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.onBeaconServiceChange.html",
		target: ""
	},
	body: {
	}
};
var getBeacons$1 = {
	status: 2,
	desc: "获取所有已搜索到的 iBeacon 设备",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/ibeacon/wx.getBeacons.html",
		target: ""
	},
	body: {
	}
};
var stopWifi = {
	status: 2,
	desc: "关闭 Wi-Fi 模块",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.stopWifi.html",
		target: ""
	},
	body: {
	}
};
var startWifi = {
	status: 2,
	desc: "初始化 Wi-Fi 模块",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.startWifi.html",
		target: ""
	},
	body: {
	}
};
var setWifiList = {
	status: 2,
	desc: "设置 wifiList 中 AP 的相关信息。在 onGetWifiList 回调后调用，iOS特有接口",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.setWifiList.html",
		target: ""
	},
	body: {
	}
};
var onWifiConnected = {
	status: 2,
	desc: "监听连接上 Wi-Fi 的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.onWifiConnected.html",
		target: ""
	},
	body: {
	}
};
var onGetWifiList = {
	status: 2,
	desc: "监听获取到 Wi-Fi 列表数据事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.onGetWifiList.html",
		target: ""
	},
	body: {
	}
};
var getWifiList = {
	status: 2,
	desc: "监听连接上 Wi-Fi 的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.getWifiList.html",
		target: ""
	},
	body: {
	}
};
var getConnectedWifi = {
	status: 2,
	desc: "监听连接上 Wi-Fi 的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.getConnectedWifi.html",
		target: ""
	},
	body: {
	}
};
var connectWifi = {
	status: 2,
	desc: "连接 Wi-Fi。若已知 Wi-Fi 信息，可以直接利用该接口连接",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.connectWifi.html",
		target: ""
	},
	body: {
	}
};
var writeBLECharacteristicValue$1 = {
	status: 0,
	desc: "读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持 read 才可以成功调用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html",
		target: ""
	},
	body: {
	}
};
var readBLECharacteristicValue$1 = {
	status: 2,
	desc: "读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持 read 才可以成功调用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.readBLECharacteristicValue.html",
		target: ""
	},
	body: {
	}
};
var onBLEConnectionStateChange = {
	status: 2,
	desc: "监听低功耗蓝牙连接状态的改变事件。包括开发者主动连接或断开连接，设备丢失，连接异常断开等等",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLEConnectionStateChange.html",
		target: ""
	},
	body: {
	}
};
var onBLECharacteristicValueChange$1 = {
	status: 2,
	desc: "监听低功耗蓝牙设备的特征值变化事件。必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLECharacteristicValueChange.html",
		target: ""
	},
	body: {
	}
};
var notifyBLECharacteristicValueChange$1 = {
	status: 2,
	desc: "监听低功耗蓝牙设备的特征值变化事件。必须先启用 notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.onBLECharacteristicValueChange.html",
		target: ""
	},
	body: {
	}
};
var getBLEDeviceServices$1 = {
	status: 0,
	desc: "获取蓝牙设备所有服务",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceServices.html",
		target: ""
	},
	body: {
	}
};
var getBLEDeviceCharacteristics$1 = {
	status: 0,
	desc: "获取蓝牙设备某个服务中所有特征值",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceCharacteristics.html",
		target: ""
	},
	body: {
	}
};
var createBLEConnection = {
	status: 0,
	desc: "连接低功耗蓝牙设备。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.createBLEConnection.html",
		target: ""
	},
	body: {
	}
};
var closeBLEConnection = {
	status: 0,
	desc: "断开与低功耗蓝牙设备的连接。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.closeBLEConnection.html",
		target: ""
	},
	body: {
	}
};
var addPhoneContact$1 = {
	status: 2,
	desc: "添加手机通讯录联系人。用户可以选择将该表单以「新增联系人」或「添加到已有联系人」的方式，写入手机系统通讯录。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/contact/wx.addPhoneContact.html",
		target: ""
	},
	body: {
	}
};
var chooseContact$1 = {
	status: 0,
	desc: "添加手机通讯录联系人。用户可以选择将该表单以「新增联系人」或「添加到已有联系人」的方式，写入手机系统通讯录。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/contact/wx.chooseContact.html",
		target: ""
	},
	body: {
	}
};
var stopBluetoothDevicesDiscovery$1 = {
	status: 0,
	desc: "停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.stopBluetoothDevicesDiscovery.html",
		target: ""
	},
	body: {
	}
};
var startBluetoothDevicesDiscovery$1 = {
	status: 1,
	desc: "开始搜寻附近的蓝牙外围设备",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.startBluetoothDevicesDiscovery.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				allowDuplicatesKey: {
					type: 0,
					desc: "是否允许重复上报同一设备"
				},
				interval: {
					type: 0,
					desc: "上报设备的间隔"
				},
				powerLevel: {
					type: 0,
					desc: "扫描模式，越高扫描越快，也越耗电。"
				}
			}
		}
	}
};
var openBluetoothAdapter$1 = {
	status: 1,
	desc: "初始化蓝牙模块",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.openBluetoothAdapter.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				mode: {
					type: 0,
					desc: "蓝牙模式，可作为主/从设备，仅 iOS 需要。"
				}
			}
		}
	}
};
var offBluetoothDeviceFound$1 = {
	status: 0,
	desc: "移除搜索到新设备的事件的全部监听函数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.offBluetoothDeviceFound.html",
		target: ""
	},
	body: {
	}
};
var onBluetoothDeviceFound$1 = {
	status: 0,
	desc: "监听寻找到新设备的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothDeviceFound.html",
		target: ""
	},
	body: {
	}
};
var onBluetoothAdapterStateChange$1 = {
	status: 2,
	desc: "监听蓝牙适配器状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothAdapterStateChange.html",
		target: ""
	},
	body: {
	}
};
var getConnectedBluetoothDevices$1 = {
	status: 2,
	desc: "根据 uuid 获取处于已连接状态的设备",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getConnectedBluetoothDevices.html",
		target: ""
	},
	body: {
	}
};
var getBluetoothDevices$1 = {
	status: 2,
	desc: "获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothDevices.html",
		target: ""
	},
	body: {
	}
};
var getBluetoothAdapterState$1 = {
	status: 2,
	desc: "获取本机蓝牙适配器状态。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothAdapterState.html",
		target: ""
	},
	body: {
	}
};
var closeBluetoothAdapter$1 = {
	status: 0,
	desc: "关闭蓝牙模块。调用该方法将断开所有已建立的连接并释放系统资源",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.closeBluetoothAdapter.html",
		target: ""
	},
	body: {
	}
};
var getBatteryInfoSync$1 = {
	status: 2,
	desc: "wx.getBatteryInfo 的同步版本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/battery/wx.getBatteryInfoSync.html",
		target: ""
	},
	body: {
	}
};
var getBatteryInfo$1 = {
	status: 0,
	desc: "获取设备电量。同步 API wx.getBatteryInfoSync 在 iOS 上不可用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/battery/wx.getBatteryInfo.html",
		target: ""
	},
	body: {
	}
};
var stopHCE = {
	status: 2,
	desc: "关闭 NFC 模块。仅在安卓系统下有效",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.stopHCE.html",
		target: ""
	},
	body: {
	}
};
var startHCE = {
	status: 2,
	desc: "初始化 NFC 模块。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.startHCE.html",
		target: ""
	},
	body: {
	}
};
var sendHCEMessage = {
	status: 2,
	desc: "发送 NFC 消息。仅在安卓系统下有效。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.sendHCEMessage.html",
		target: ""
	},
	body: {
	}
};
var onHCEMessage = {
	status: 2,
	desc: "监听接收 NFC 设备消息事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.onHCEMessage.html",
		target: ""
	},
	body: {
	}
};
var getHCEState = {
	status: 2,
	desc: "判断当前设备是否支持 HCE 能力",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.getHCEState.html",
		target: ""
	},
	body: {
	}
};
var onNetworkStatusChange$1 = {
	status: 0,
	desc: "监听网络状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.onNetworkStatusChange.html",
		target: ""
	},
	body: {
	}
};
var getNetworkType$1 = {
	status: 0,
	desc: "获取网络类型",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.getNetworkType.html",
		target: ""
	},
	body: {
	}
};
var setScreenBrightness$1 = {
	status: 0,
	desc: "设置屏幕亮度",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setScreenBrightness.html",
		target: ""
	},
	body: {
	}
};
var setKeepScreenOn$1 = {
	status: 0,
	desc: "设置是否保持常亮状态。仅在当前小程序生效，离开小程序后设置失效。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setKeepScreenOn.html",
		target: ""
	},
	body: {
	}
};
var onUserCaptureScreen$1 = {
	status: 2,
	desc: "监听用户主动截屏事件。用户使用系统截屏按键截屏时触发",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.onUserCaptureScreen.html",
		target: ""
	},
	body: {
	}
};
var getScreenBrightness$1 = {
	status: 0,
	desc: "获取屏幕亮度",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.getScreenBrightness.html",
		target: ""
	},
	body: {
	}
};
var makePhoneCall$1 = {
	status: 0,
	desc: "拨打电话",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/phone/wx.makePhoneCall.html",
		target: ""
	},
	body: {
	}
};
var onAccelerometerChange$1 = {
	status: 2,
	desc: "监听加速度数据事件。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.onAccelerometerChange.html",
		target: ""
	},
	body: {
	}
};
var startAccelerometer = {
	status: 2,
	desc: "开始监听罗盘数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.startAccelerometer.html",
		target: ""
	},
	body: {
	}
};
var stopAccelerometer = {
	status: 2,
	desc: "停止监听加速度数据。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/accelerometer/wx.stopAccelerometer.html",
		target: ""
	},
	body: {
	}
};
var onCompassChange$1 = {
	status: 2,
	desc: "监听罗盘数据变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.onCompassChange.html",
		target: ""
	},
	body: {
	}
};
var startCompass = {
	status: 2,
	desc: "开始监听罗盘数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.startCompass.html",
		target: ""
	},
	body: {
	}
};
var stopCompass = {
	status: 2,
	desc: "停止监听罗盘数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/compass/wx.stopCompass.html",
		target: ""
	},
	body: {
	}
};
var onDeviceMotionChange = {
	status: 2,
	desc: "监听设备方向变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.onDeviceMotionChange.html",
		target: ""
	},
	body: {
	}
};
var startDeviceMotionListening = {
	status: 2,
	desc: "开始监听设备方向的变化",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.startDeviceMotionListening.html",
		target: ""
	},
	body: {
	}
};
var stopDeviceMotionListening = {
	status: 2,
	desc: "停止监听设备方向的变化",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.stopDeviceMotionListening.html",
		target: ""
	},
	body: {
	}
};
var onGyroscopeChange$1 = {
	status: 0,
	desc: "监听陀螺仪数据变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.onGyroscopeChange.html",
		target: ""
	},
	body: {
	}
};
var offGyroscopeChange$1 = {
	status: 0,
	desc: "监听陀螺仪数据变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.offGyroscopeChange.html",
		target: ""
	},
	body: {
	}
};
var startGyroscope$1 = {
	status: 0,
	desc: "开始监听陀螺仪数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.startGyroscope.html",
		target: ""
	},
	body: {
	}
};
var stopGyroscope$1 = {
	status: 0,
	desc: "停止监听陀螺仪数据。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/gyroscope/wx.stopGyroscope.html",
		target: ""
	},
	body: {
	}
};
var onMemoryWarning$1 = {
	status: 0,
	desc: "监听内存不足告警事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/performance/wx.onMemoryWarning.html",
		target: ""
	},
	body: {
	}
};
var scanCode = {
	status: 0,
	desc: "调起客户端扫码界面进行扫码",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/scan/wx.scanCode.html",
		target: ""
	},
	body: {
	}
};
var vibrateLong$1 = {
	status: 0,
	desc: "使手机发生较长时间的振动",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/vibrate/wx.vibrateLong.html",
		target: ""
	},
	body: {
	}
};
var vibrateShort$1 = {
	status: 0,
	desc: "使手机发生较长时间的振动",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/vibrate/wx.vibrateShort.html",
		target: ""
	},
	body: {
	}
};
var onBLEPeripheralConnectionStateChanged = {
	status: 2,
	desc: "监听当前外围设备被连接或断开连接事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.onBLEPeripheralConnectionStateChanged.html",
		target: ""
	},
	body: {
	}
};
var offBLEPeripheralConnectionStateChanged = {
	status: 2,
	desc: "取消监听当前外围设备被连接或断开连接事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.offBLEPeripheralConnectionStateChanged.html",
		target: ""
	},
	body: {
	}
};
var createBLEPeripheralServer = {
	status: 2,
	desc: "建立本地作为外围设备的服务端，可创建多个",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-peripheral/wx.createBLEPeripheralServer.html",
		target: ""
	},
	body: {
	}
};
var offHCEMessage = {
	status: 2,
	desc: "接收 NFC 设备消息事件，取消事件监听",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.offHCEMessage.html",
		target: ""
	},
	body: {
	}
};
var getNFCAdapter = {
	status: 2,
	desc: "获取 NFC 实例",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/nfc/wx.getNFCAdapter.html",
		target: ""
	},
	body: {
	}
};
var offWifiConnected = {
	status: 2,
	desc: "取消监听连接上 Wi-Fi 的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offWifiConnected.html",
		target: ""
	},
	body: {
	}
};
var offGetWifiList = {
	status: 2,
	desc: "取消监听获取到 Wi-Fi 列表数据事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/wifi/wx.offGetWifiList.html",
		target: ""
	},
	body: {
	}
};
var setBLEMTU = {
	status: 2,
	desc: "设置蓝牙最大传输单元",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.setBLEMTU.html",
		target: ""
	},
	body: {
	}
};
var offBLEConnectionStateChange = {
	status: 2,
	desc: "取消监听低功耗蓝牙连接状态的改变事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.offBLEConnectionStateChange.html",
		target: ""
	},
	body: {
	}
};
var offBLECharacteristicValueChange$1 = {
	status: 2,
	desc: "取消监听低功耗蓝牙设备的特征值变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.offBLECharacteristicValueChange.html",
		target: ""
	},
	body: {
	}
};
var makeBluetoothPair = {
	status: 2,
	desc: "蓝牙配对接口，仅安卓使用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.makeBluetoothPair.html",
		target: ""
	},
	body: {
	}
};
var getBLEDeviceRSSI = {
	status: 2,
	desc: "获取蓝牙设备的信号强度",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceRSSI.html",
		target: ""
	},
	body: {
	}
};
var checkIsOpenAccessibility = {
	status: 2,
	desc: "检测是否开启视觉无障碍功能",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/accessibility/wx.checkIsOpenAccessibility.html",
		target: ""
	},
	body: {
	}
};
var offBluetoothAdapterStateChange$1 = {
	status: 2,
	desc: "取消监听蓝牙适配器状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.offBluetoothAdapterStateChange.html",
		target: ""
	},
	body: {
	}
};
var setClipboardData = {
	status: 0,
	desc: "设置系统剪贴板的内容",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.setClipboardData.html",
		target: ""
	},
	body: {
	}
};
var getClipboardData = {
	status: 0,
	desc: "获取系统剪贴板的内容",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/clipboard/wx.getClipboardData.html",
		target: ""
	},
	body: {
	}
};
var offNetworkStatusChange$1 = {
	status: 0,
	desc: "取消监听网络状态变化事件，参数为空，则取消所有的事件监听",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/network/wx.offNetworkStatusChange.html",
		target: ""
	},
	body: {
	}
};
var offUserCaptureScreen = {
	status: 2,
	desc: "用户主动截屏事件。取消事件监听",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.offUserCaptureScreen.html",
		target: ""
	},
	body: {
	}
};
var offDeviceMotionChange = {
	status: 2,
	desc: "取消监听设备方向变化事件，参数为空，则取消所有的事件监听",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/motion/wx.offDeviceMotionChange.html",
		target: ""
	},
	body: {
	}
};
var offMemoryWarning$1 = {
	status: 0,
	desc: "取消监听内存不足告警事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/device/performance/wx.offMemoryWarning.html",
		target: ""
	},
	body: {
	}
};
var equipment$2 = {
	stopBeaconDiscovery: stopBeaconDiscovery$1,
	startBeaconDiscovery: startBeaconDiscovery$1,
	onBeaconUpdate: onBeaconUpdate$1,
	onBeaconServiceChange: onBeaconServiceChange$1,
	getBeacons: getBeacons$1,
	stopWifi: stopWifi,
	startWifi: startWifi,
	setWifiList: setWifiList,
	onWifiConnected: onWifiConnected,
	onGetWifiList: onGetWifiList,
	getWifiList: getWifiList,
	getConnectedWifi: getConnectedWifi,
	connectWifi: connectWifi,
	writeBLECharacteristicValue: writeBLECharacteristicValue$1,
	readBLECharacteristicValue: readBLECharacteristicValue$1,
	onBLEConnectionStateChange: onBLEConnectionStateChange,
	onBLECharacteristicValueChange: onBLECharacteristicValueChange$1,
	notifyBLECharacteristicValueChange: notifyBLECharacteristicValueChange$1,
	getBLEDeviceServices: getBLEDeviceServices$1,
	getBLEDeviceCharacteristics: getBLEDeviceCharacteristics$1,
	createBLEConnection: createBLEConnection,
	closeBLEConnection: closeBLEConnection,
	addPhoneContact: addPhoneContact$1,
	chooseContact: chooseContact$1,
	stopBluetoothDevicesDiscovery: stopBluetoothDevicesDiscovery$1,
	startBluetoothDevicesDiscovery: startBluetoothDevicesDiscovery$1,
	openBluetoothAdapter: openBluetoothAdapter$1,
	offBluetoothDeviceFound: offBluetoothDeviceFound$1,
	onBluetoothDeviceFound: onBluetoothDeviceFound$1,
	onBluetoothAdapterStateChange: onBluetoothAdapterStateChange$1,
	getConnectedBluetoothDevices: getConnectedBluetoothDevices$1,
	getBluetoothDevices: getBluetoothDevices$1,
	getBluetoothAdapterState: getBluetoothAdapterState$1,
	closeBluetoothAdapter: closeBluetoothAdapter$1,
	getBatteryInfoSync: getBatteryInfoSync$1,
	getBatteryInfo: getBatteryInfo$1,
	stopHCE: stopHCE,
	startHCE: startHCE,
	sendHCEMessage: sendHCEMessage,
	onHCEMessage: onHCEMessage,
	getHCEState: getHCEState,
	onNetworkStatusChange: onNetworkStatusChange$1,
	getNetworkType: getNetworkType$1,
	setScreenBrightness: setScreenBrightness$1,
	setKeepScreenOn: setKeepScreenOn$1,
	onUserCaptureScreen: onUserCaptureScreen$1,
	getScreenBrightness: getScreenBrightness$1,
	makePhoneCall: makePhoneCall$1,
	onAccelerometerChange: onAccelerometerChange$1,
	startAccelerometer: startAccelerometer,
	stopAccelerometer: stopAccelerometer,
	onCompassChange: onCompassChange$1,
	startCompass: startCompass,
	stopCompass: stopCompass,
	onDeviceMotionChange: onDeviceMotionChange,
	startDeviceMotionListening: startDeviceMotionListening,
	stopDeviceMotionListening: stopDeviceMotionListening,
	onGyroscopeChange: onGyroscopeChange$1,
	offGyroscopeChange: offGyroscopeChange$1,
	startGyroscope: startGyroscope$1,
	stopGyroscope: stopGyroscope$1,
	onMemoryWarning: onMemoryWarning$1,
	scanCode: scanCode,
	vibrateLong: vibrateLong$1,
	vibrateShort: vibrateShort$1,
	onBLEPeripheralConnectionStateChanged: onBLEPeripheralConnectionStateChanged,
	offBLEPeripheralConnectionStateChanged: offBLEPeripheralConnectionStateChanged,
	createBLEPeripheralServer: createBLEPeripheralServer,
	offHCEMessage: offHCEMessage,
	getNFCAdapter: getNFCAdapter,
	offWifiConnected: offWifiConnected,
	offGetWifiList: offGetWifiList,
	setBLEMTU: setBLEMTU,
	offBLEConnectionStateChange: offBLEConnectionStateChange,
	offBLECharacteristicValueChange: offBLECharacteristicValueChange$1,
	makeBluetoothPair: makeBluetoothPair,
	getBLEDeviceRSSI: getBLEDeviceRSSI,
	checkIsOpenAccessibility: checkIsOpenAccessibility,
	offBluetoothAdapterStateChange: offBluetoothAdapterStateChange$1,
	setClipboardData: setClipboardData,
	getClipboardData: getClipboardData,
	offNetworkStatusChange: offNetworkStatusChange$1,
	offUserCaptureScreen: offUserCaptureScreen,
	offDeviceMotionChange: offDeviceMotionChange,
	offMemoryWarning: offMemoryWarning$1
};

var equipment$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	stopBeaconDiscovery: stopBeaconDiscovery$1,
	startBeaconDiscovery: startBeaconDiscovery$1,
	onBeaconUpdate: onBeaconUpdate$1,
	onBeaconServiceChange: onBeaconServiceChange$1,
	getBeacons: getBeacons$1,
	stopWifi: stopWifi,
	startWifi: startWifi,
	setWifiList: setWifiList,
	onWifiConnected: onWifiConnected,
	onGetWifiList: onGetWifiList,
	getWifiList: getWifiList,
	getConnectedWifi: getConnectedWifi,
	connectWifi: connectWifi,
	writeBLECharacteristicValue: writeBLECharacteristicValue$1,
	readBLECharacteristicValue: readBLECharacteristicValue$1,
	onBLEConnectionStateChange: onBLEConnectionStateChange,
	onBLECharacteristicValueChange: onBLECharacteristicValueChange$1,
	notifyBLECharacteristicValueChange: notifyBLECharacteristicValueChange$1,
	getBLEDeviceServices: getBLEDeviceServices$1,
	getBLEDeviceCharacteristics: getBLEDeviceCharacteristics$1,
	createBLEConnection: createBLEConnection,
	closeBLEConnection: closeBLEConnection,
	addPhoneContact: addPhoneContact$1,
	chooseContact: chooseContact$1,
	stopBluetoothDevicesDiscovery: stopBluetoothDevicesDiscovery$1,
	startBluetoothDevicesDiscovery: startBluetoothDevicesDiscovery$1,
	openBluetoothAdapter: openBluetoothAdapter$1,
	offBluetoothDeviceFound: offBluetoothDeviceFound$1,
	onBluetoothDeviceFound: onBluetoothDeviceFound$1,
	onBluetoothAdapterStateChange: onBluetoothAdapterStateChange$1,
	getConnectedBluetoothDevices: getConnectedBluetoothDevices$1,
	getBluetoothDevices: getBluetoothDevices$1,
	getBluetoothAdapterState: getBluetoothAdapterState$1,
	closeBluetoothAdapter: closeBluetoothAdapter$1,
	getBatteryInfoSync: getBatteryInfoSync$1,
	getBatteryInfo: getBatteryInfo$1,
	stopHCE: stopHCE,
	startHCE: startHCE,
	sendHCEMessage: sendHCEMessage,
	onHCEMessage: onHCEMessage,
	getHCEState: getHCEState,
	onNetworkStatusChange: onNetworkStatusChange$1,
	getNetworkType: getNetworkType$1,
	setScreenBrightness: setScreenBrightness$1,
	setKeepScreenOn: setKeepScreenOn$1,
	onUserCaptureScreen: onUserCaptureScreen$1,
	getScreenBrightness: getScreenBrightness$1,
	makePhoneCall: makePhoneCall$1,
	onAccelerometerChange: onAccelerometerChange$1,
	startAccelerometer: startAccelerometer,
	stopAccelerometer: stopAccelerometer,
	onCompassChange: onCompassChange$1,
	startCompass: startCompass,
	stopCompass: stopCompass,
	onDeviceMotionChange: onDeviceMotionChange,
	startDeviceMotionListening: startDeviceMotionListening,
	stopDeviceMotionListening: stopDeviceMotionListening,
	onGyroscopeChange: onGyroscopeChange$1,
	offGyroscopeChange: offGyroscopeChange$1,
	startGyroscope: startGyroscope$1,
	stopGyroscope: stopGyroscope$1,
	onMemoryWarning: onMemoryWarning$1,
	scanCode: scanCode,
	vibrateLong: vibrateLong$1,
	vibrateShort: vibrateShort$1,
	onBLEPeripheralConnectionStateChanged: onBLEPeripheralConnectionStateChanged,
	offBLEPeripheralConnectionStateChanged: offBLEPeripheralConnectionStateChanged,
	createBLEPeripheralServer: createBLEPeripheralServer,
	offHCEMessage: offHCEMessage,
	getNFCAdapter: getNFCAdapter,
	offWifiConnected: offWifiConnected,
	offGetWifiList: offGetWifiList,
	setBLEMTU: setBLEMTU,
	offBLEConnectionStateChange: offBLEConnectionStateChange,
	offBLECharacteristicValueChange: offBLECharacteristicValueChange$1,
	makeBluetoothPair: makeBluetoothPair,
	getBLEDeviceRSSI: getBLEDeviceRSSI,
	checkIsOpenAccessibility: checkIsOpenAccessibility,
	offBluetoothAdapterStateChange: offBluetoothAdapterStateChange$1,
	setClipboardData: setClipboardData,
	getClipboardData: getClipboardData,
	offNetworkStatusChange: offNetworkStatusChange$1,
	offUserCaptureScreen: offUserCaptureScreen,
	offDeviceMotionChange: offDeviceMotionChange,
	offMemoryWarning: offMemoryWarning$1,
	'default': equipment$2
});

var getExtConfig = {
	status: 2,
	desc: "获取第三方平台自定义的数据字段。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ext/wx.getExtConfig.html",
		target: ""
	},
	body: {
	}
};
var getExtConfigSync = {
	status: 2,
	desc: "wx.getExtConfig 的同步版本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ext/wx.getExtConfigSync.html",
		target: ""
	},
	body: {
	}
};
var extPlatform = {
	getExtConfig: getExtConfig,
	getExtConfigSync: getExtConfigSync
};

var extPlatform$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	getExtConfig: getExtConfig,
	getExtConfigSync: getExtConfigSync,
	'default': extPlatform
});

var saveFile$1 = {
	status: 0,
	desc: "保存文件到本地",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.saveFile.html",
		target: ""
	},
	body: {
	}
};
var removeSavedFile$1 = {
	status: 0,
	desc: "删除本地缓存文件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.removeSavedFile.html",
		target: ""
	},
	body: {
	}
};
var openDocument$1 = {
	status: 1,
	desc: "新开页面打开文档",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.openDocument.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				showMenu: {
					type: 0,
					desc: "是否显示右上角菜单"
				}
			}
		}
	}
};
var getSavedFileList$1 = {
	status: 0,
	desc: "获取保存的所有文件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileList.html",
		target: ""
	},
	body: {
	}
};
var getSavedFileInfo$1 = {
	status: 0,
	desc: "获取保存的文件信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileInfo.html",
		target: ""
	},
	body: {
	}
};
var getFileSystemManager$1 = {
	status: 0,
	desc: "获取全局唯一的文件管理器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getFileSystemManager.html",
		target: ""
	},
	body: {
	}
};
var getFileInfo$1 = {
	status: 1,
	desc: "获取文件信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.getFileInfo.html",
		target: ""
	},
	body: {
		params: {
			props: {
				digestAlgorithm: {
					type: 0,
					desc: "alipay: md5, macle: sha256"
				}
			}
		}
	}
};
var saveFileToDisk = {
	status: 2,
	desc: "保存文件系统的文件到用户磁盘，仅在 PC 端支持",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.saveFileToDisk.html",
		target: ""
	},
	body: {
	}
};
var file$2 = {
	saveFile: saveFile$1,
	removeSavedFile: removeSavedFile$1,
	"FileSystemManager.removeSavedFile": {
	status: 0,
	desc: "删除本地缓存文件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.removeSavedFile.html",
		target: ""
	},
	body: {
	}
},
	openDocument: openDocument$1,
	getSavedFileList: getSavedFileList$1,
	"FileSystemManager.getSavedFileList": {
	status: 0,
	desc: "获取保存的所有文件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileList.html",
		target: ""
	},
	body: {
	}
},
	getSavedFileInfo: getSavedFileInfo$1,
	"FileSystemManager.getSavedFileInfo": {
	status: 0,
	desc: "获取保存的文件信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/wx.getSavedFileInfo.html",
		target: ""
	},
	body: {
	}
},
	getFileSystemManager: getFileSystemManager$1,
	getFileInfo: getFileInfo$1,
	"FileSystemManager.getFileInfo": {
	status: 1,
	desc: "获取文件信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.getFileInfo.html",
		target: ""
	},
	body: {
		params: {
			props: {
				digestAlgorithm: {
					type: 4,
					desc: "wx: md5, macle: sha256"
				}
			}
		}
	}
},
	saveFileToDisk: saveFileToDisk,
	"FileSystemManager.access": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.accessSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.appendFile": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.appendFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.close": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.closeSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.copyFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.copyFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.fstat": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.fstatSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.ftruncate": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.ftruncateSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.mkdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.mkdir": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.open": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.openSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readCompressedFile": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readCompressedFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readdir": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.moveFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.readZipEntry": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.rename": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.renameSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.rmdir": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.rmdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.saveFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.saveFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.stat": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.statSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.truncate": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.truncateSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.unlinkSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.unlink": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.unzip": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.writeFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.writeFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
},
	"FileSystemManager.writeSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/file/FileSystemManager.html",
		target: ""
	},
	body: {
	}
}
};

var file$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	saveFile: saveFile$1,
	removeSavedFile: removeSavedFile$1,
	openDocument: openDocument$1,
	getSavedFileList: getSavedFileList$1,
	getSavedFileInfo: getSavedFileInfo$1,
	getFileSystemManager: getFileSystemManager$1,
	getFileInfo: getFileInfo$1,
	saveFileToDisk: saveFileToDisk,
	'default': file$2
});

var openLocation$1 = {
	status: 2,
	desc: "打开位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.openLocation.html",
		target: ""
	},
	body: {
	}
};
var getLocation$1 = {
	status: 1,
	desc: "获取位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html",
		target: ""
	},
	body: {
		msg: "命名不同/参数差异/返回值差异",
		params: {
			props: {
				type: {
					type: 0,
					desc: "wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标"
				},
				altitude: {
					type: 0,
					desc: "传入 true 会返回高度信息，由于获取高度需要较高精确度，会减慢接口返回速度"
				},
				isHighAccuracy: {
					type: 0,
					desc: "开启高精度定位"
				},
				highAccuracyExpireTime: {
					type: 0,
					desc: "高精度定位超时时间(ms)，指定时间内返回最高精度，该值3000ms以上高精度定位才有效果"
				}
			}
		}
	}
};
var chooseLocation$1 = {
	status: 2,
	desc: "打开地图选择位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.chooseLocation.html",
		target: ""
	},
	body: {
	}
};
var stopLocationUpdate = {
	status: 2,
	desc: "关闭监听实时位置变化，前后台都停止消息接收",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.stopLocationUpdate.html",
		target: ""
	},
	body: {
	}
};
var startLocationUpdateBackground = {
	status: 2,
	desc: "开启小程序进入前后台时均接收位置消息，需引导用户开启授权",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.startLocationUpdateBackground.html",
		target: ""
	},
	body: {
	}
};
var startLocationUpdate = {
	status: 2,
	desc: "开启小程序进入前台时接收位置消息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.startLocationUpdate.html",
		target: ""
	},
	body: {
	}
};
var onLocationChange = {
	status: 2,
	desc: "监听实时地理位置变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.onLocationChange.html",
		target: ""
	},
	body: {
	}
};
var offLocationChange = {
	status: 2,
	desc: "取消监听实时地理位置变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.offLocationChange.html",
		target: ""
	},
	body: {
	}
};
var location$2 = {
	openLocation: openLocation$1,
	getLocation: getLocation$1,
	chooseLocation: chooseLocation$1,
	stopLocationUpdate: stopLocationUpdate,
	startLocationUpdateBackground: startLocationUpdateBackground,
	startLocationUpdate: startLocationUpdate,
	onLocationChange: onLocationChange,
	offLocationChange: offLocationChange
};

var location$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	openLocation: openLocation$1,
	getLocation: getLocation$1,
	chooseLocation: chooseLocation$1,
	stopLocationUpdate: stopLocationUpdate,
	startLocationUpdateBackground: startLocationUpdateBackground,
	startLocationUpdate: startLocationUpdate,
	onLocationChange: onLocationChange,
	offLocationChange: offLocationChange,
	'default': location$2
});

var createMapContext$1 = {
	status: 0,
	desc: "创建 map 上下文 MapContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/wx.createMapContext.html",
		target: ""
	},
	body: {
	}
};
var saveImageToPhotosAlbum$1 = {
	status: 0,
	desc: "保存图片到系统相册不支持网络图片路径",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.saveImageToPhotosAlbum.html",
		target: ""
	},
	body: {
	}
};
var previewImage$1 = {
	status: 1,
	desc: "在新页面中全屏预览图片",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewImage.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				showmenu: {
					type: 0,
					desc: "是否显示长按菜单"
				},
				referrerPolicy: {
					type: 0,
					desc: "origin: 发送完整的referrer; no-referrer: 不发送"
				}
			}
		}
	}
};
var getImageInfo$1 = {
	status: 0,
	desc: "获取图片信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.getImageInfo.html",
		target: ""
	},
	body: {
	}
};
var compressImage$1 = {
	status: 1,
	desc: "压缩图片接口，可选压缩质量",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.compressImage.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				compressedWidth: {
					type: 0,
					desc: "压缩后图片的宽度"
				},
				compressedHeight: {
					type: 0,
					desc: "压缩后图片的高度"
				}
			}
		}
	}
};
var chooseMessageFile = {
	status: 2,
	desc: "从客户端会话选择文件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseMessageFile.html",
		target: ""
	},
	body: {
	}
};
var chooseImage$1 = {
	status: 0,
	desc: "从本地相册选择图片或使用相机拍照",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseImage.html",
		target: ""
	},
	body: {
	}
};
var saveVideoToPhotosAlbum = {
	status: 0,
	desc: "保存视频到系统相册",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.saveVideoToPhotosAlbum.html",
		target: ""
	},
	body: {
	}
};
var createVideoContext$1 = {
	status: 0,
	desc: "创建 video 上下文 VideoContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.createVideoContext.html",
		target: ""
	},
	body: {
	}
};
var chooseVideo$1 = {
	status: 1,
	desc: "拍摄视频或从手机相册中选视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseVideo.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				compressed: {
					type: 0,
					desc: "是否压缩所选择的视频文件"
				},
				maxDuration: {
					type: 0,
					desc: "拍摄视频最长拍摄时间，单位：秒"
				}
			}
		}
	}
};
var stopVoice = {
	status: 0,
	desc: "结束播放语音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.stopVoice.html",
		target: ""
	},
	body: {
	}
};
var setInnerAudioOption = {
	status: 2,
	desc: "设置 InnerAudioContext 的播放选项",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.setInnerAudioOption.html",
		target: ""
	},
	body: {
	}
};
var playVoice = {
	status: 0,
	desc: "开始播放语音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.playVoice.html",
		target: ""
	},
	body: {
	}
};
var pauseVoice = {
	status: 2,
	desc: "暂停正在播放的语音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.pauseVoice.html",
		target: ""
	},
	body: {
	}
};
var getAvailableAudioSources = {
	status: 2,
	desc: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.getAvailableAudioSources.html",
	url: {
		original: "",
		target: ""
	},
	body: {
	}
};
var createInnerAudioContext = {
	status: 2,
	desc: "创建内部 audio 上下文 InnerAudioContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createInnerAudioContext.html",
		target: ""
	},
	body: {
	}
};
var createAudioContext = {
	status: 0,
	desc: "创建 audio 上下文 AudioContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/wx.createAudioContext.html",
		target: ""
	},
	body: {
	}
};
var stopBackgroundAudio = {
	status: 2,
	desc: "停止播放音乐",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.stopBackgroundAudio.html",
		target: ""
	},
	body: {
	}
};
var seekBackgroundAudio = {
	status: 2,
	desc: "控制音乐播放进度",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.seekBackgroundAudio.html",
		target: ""
	},
	body: {
	}
};
var playBackgroundAudio = {
	status: 2,
	desc: "使用后台播放器播放音乐",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.playBackgroundAudio.html",
		target: ""
	},
	body: {
	}
};
var pauseBackgroundAudio = {
	status: 2,
	desc: "暂停播放音乐",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.pauseBackgroundAudio.html",
		target: ""
	},
	body: {
	}
};
var onBackgroundAudioStop = {
	status: 2,
	desc: "监听音乐停止事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioStop.html",
		target: ""
	},
	body: {
	}
};
var onBackgroundAudioPlay = {
	status: 2,
	desc: "监听音乐播放事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioPlay.html",
		target: ""
	},
	body: {
	}
};
var onBackgroundAudioPause = {
	status: 2,
	desc: "监听音乐暂停事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.onBackgroundAudioPause.html",
		target: ""
	},
	body: {
	}
};
var getBackgroundAudioPlayerState = {
	status: 2,
	desc: "获取后台音乐播放状态",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.getBackgroundAudioPlayerState.html",
		target: ""
	},
	body: {
	}
};
var getBackgroundAudioManager = {
	status: 2,
	desc: "获取全局唯一的背景音频管理器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/background-audio/wx.getBackgroundAudioManager.html",
		target: ""
	},
	body: {
	}
};
var createLivePusherContext = {
	status: 2,
	desc: "创建 live-pusher 上下文 LivePusherContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/live/wx.createLivePusherContext.html",
		target: ""
	},
	body: {
	}
};
var createLivePlayerContext = {
	status: 2,
	desc: "创建 live-player 上下文 LivePlayerContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/live/wx.createLivePlayerContext.html",
		target: ""
	},
	body: {
	}
};
var stopRecord = {
	status: 2,
	desc: "停止录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.stopRecord.html",
		target: ""
	},
	body: {
	}
};
var startRecord = {
	status: 2,
	desc: "开始录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.startRecord.html",
		target: ""
	},
	body: {
	}
};
var getRecorderManager$1 = {
	status: 0,
	desc: "获取全局唯一的录音管理器 RecorderManager",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
		target: ""
	},
	body: {
	}
};
var createCameraContext$1 = {
	status: 0,
	desc: "创建 camera 上下文 CameraContext 对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/wx.createCameraContext.html",
		target: ""
	},
	body: {
	}
};
var previewMedia = {
	status: 2,
	desc: "预览图片和视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewMedia.html",
		target: ""
	},
	body: {
	}
};
var openVideoEditor = {
	status: 2,
	desc: "打开视频编辑器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.openVideoEditor.html",
		target: ""
	},
	body: {
	}
};
var getVideoInfo = {
	status: 2,
	desc: "获取视频详细信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.getVideoInfo.html",
		target: ""
	},
	body: {
	}
};
var compressVideo = {
	status: 2,
	desc: "压缩视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.compressVideo.html",
		target: ""
	},
	body: {
	}
};
var chooseMedia = {
	status: 2,
	desc: "拍摄或从手机相册中选择图片或视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html",
		target: ""
	},
	body: {
	}
};
var createMediaContainer = {
	status: 2,
	desc: "创建音视频处理容器，最终可将容器中的轨道合成一个视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video-processing/wx.createMediaContainer.html",
		target: ""
	},
	body: {
	}
};
var updateVoIPChatMuteConfig = {
	status: 2,
	desc: "更新实时语音静音设置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.updateVoIPChatMuteConfig.html",
		target: ""
	},
	body: {
	}
};
var subscribeVoIPVideoMembers = {
	status: 2,
	desc: "订阅视频画面成员",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.subscribeVoIPVideoMembers.html",
		target: ""
	},
	body: {
	}
};
var setEnable1v1Chat = {
	status: 2,
	desc: "开启双人通话",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.setEnable1v1Chat.html",
		target: ""
	},
	body: {
	}
};
var onVoIPVideoMembersChanged = {
	status: 2,
	desc: "监听实时语音通话成员视频状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPVideoMembersChanged.html",
		target: ""
	},
	body: {
	}
};
var onVoIPChatSpeakersChanged = {
	status: 2,
	desc: "监听实时语音通话成员通话状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatSpeakersChanged.html",
		target: ""
	},
	body: {
	}
};
var onVoIPChatMembersChanged = {
	status: 2,
	desc: "监听实时语音通话成员在线状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatMembersChanged.html",
		target: ""
	},
	body: {
	}
};
var onVoIPChatInterrupted = {
	status: 2,
	desc: "监听被动断开实时语音通话事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.onVoIPChatInterrupted.html",
		target: ""
	},
	body: {
	}
};
var offVoIPVideoMembersChanged = {
	status: 2,
	desc: "取消监听实时语音通话成员视频状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPVideoMembersChanged.html",
		target: ""
	},
	body: {
	}
};
var offVoIPChatMembersChanged = {
	status: 2,
	desc: "取消监听实时语音通话成员在线状态变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPChatMembersChanged.html",
		target: ""
	},
	body: {
	}
};
var offVoIPChatInterrupted = {
	status: 2,
	desc: "取消监听被动断开实时语音通话事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.offVoIPChatInterrupted.html",
		target: ""
	},
	body: {
	}
};
var joinVoIPChat = {
	status: 2,
	desc: "加入 (创建) 实时语音通话",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.joinVoIPChat.html",
		target: ""
	},
	body: {
	}
};
var join1v1Chat = {
	status: 2,
	desc: "加入（创建）双人通话",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.join1v1Chat.html",
		target: ""
	},
	body: {
	}
};
var exitVoIPChat = {
	status: 2,
	desc: "退出（销毁）实时语音通话",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/voip/wx.exitVoIPChat.html",
		target: ""
	},
	body: {
	}
};
var createMediaRecorder = {
	status: 2,
	desc: "创建 WebGL 画面录制器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/media-recorder/wx.createMediaRecorder.html",
		target: ""
	},
	body: {
	}
};
var createVideoDecoder = {
	status: 2,
	desc: "创建视频解码器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video-decoder/wx.createVideoDecoder.html",
		target: ""
	},
	body: {
	}
};
var media$6 = {
	createMapContext: createMapContext$1,
	"MapContext.addMarkers": {
	status: 0,
	desc: "添加 marker。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.addMarkers.html",
		target: ""
	},
	body: {
	}
},
	"MapContext.removeMarkers": {
	status: 0,
	desc: "移除 marker。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.removeMarkers.html",
		target: ""
	},
	body: {
	}
},
	"MapContext.moveToLocation": {
	status: 0,
	desc: "移动地图中心位置。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/map/MapContext.moveToLocation.html",
		target: ""
	},
	body: {
	}
},
	saveImageToPhotosAlbum: saveImageToPhotosAlbum$1,
	previewImage: previewImage$1,
	getImageInfo: getImageInfo$1,
	compressImage: compressImage$1,
	chooseMessageFile: chooseMessageFile,
	chooseImage: chooseImage$1,
	saveVideoToPhotosAlbum: saveVideoToPhotosAlbum,
	createVideoContext: createVideoContext$1,
	"VideoContext.play": {
	status: 0,
	desc: "播放视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.play.html",
		target: ""
	},
	body: {
	}
},
	"VideoContext.pause": {
	status: 0,
	desc: "暂停播放视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.pause.html",
		target: ""
	},
	body: {
	}
},
	"VideoContext.stop": {
	status: 0,
	desc: "停止播放视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.stop.html",
		target: ""
	},
	body: {
	}
},
	"VideoContext.seek": {
	status: 0,
	desc: "跳转到指定位置播放视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/video/VideoContext.seek.html",
		target: ""
	},
	body: {
	}
},
	chooseVideo: chooseVideo$1,
	stopVoice: stopVoice,
	setInnerAudioOption: setInnerAudioOption,
	playVoice: playVoice,
	pauseVoice: pauseVoice,
	getAvailableAudioSources: getAvailableAudioSources,
	createInnerAudioContext: createInnerAudioContext,
	createAudioContext: createAudioContext,
	"AudioContext.pause": {
	status: 0,
	desc: "暂停音频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.pause.html",
		target: ""
	},
	body: {
	}
},
	"AudioContext.play": {
	status: 0,
	desc: "播放音频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.play.html",
		target: ""
	},
	body: {
	}
},
	"AudioContext.seek": {
	status: 0,
	desc: "跳转到指定位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.seek.html",
		target: ""
	},
	body: {
	}
},
	"AudioContext.setSrc": {
	status: 0,
	desc: "设置音频地址",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/AudioContext.setSrc.html",
		target: ""
	},
	body: {
	}
},
	stopBackgroundAudio: stopBackgroundAudio,
	seekBackgroundAudio: seekBackgroundAudio,
	playBackgroundAudio: playBackgroundAudio,
	pauseBackgroundAudio: pauseBackgroundAudio,
	onBackgroundAudioStop: onBackgroundAudioStop,
	onBackgroundAudioPlay: onBackgroundAudioPlay,
	onBackgroundAudioPause: onBackgroundAudioPause,
	getBackgroundAudioPlayerState: getBackgroundAudioPlayerState,
	getBackgroundAudioManager: getBackgroundAudioManager,
	createLivePusherContext: createLivePusherContext,
	createLivePlayerContext: createLivePlayerContext,
	stopRecord: stopRecord,
	startRecord: startRecord,
	getRecorderManager: getRecorderManager$1,
	"RecorderManager.start": {
	status: 1,
	desc: "开始录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				format: {
					type: 0,
					desc: "音频格式"
				},
				frameSize: {
					type: 0,
					desc: "指定帧大小，单位 KB"
				},
				audioSource: {
					type: 0,
					desc: "指定录音的音频输入源"
				}
			}
		}
	}
},
	"RecorderManager.pause": {
	status: 0,
	desc: "暂停录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.pause.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.resume": {
	status: 0,
	desc: "继续录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.resume.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.stop": {
	status: 0,
	desc: "停止录音",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.stop.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onStart": {
	status: 0,
	desc: "监听录音开始事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onStart.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onPause": {
	status: 0,
	desc: "监听录音暂停事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onPause.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onResume": {
	status: 0,
	desc: "监听录音继续事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onResume.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onStop": {
	status: 0,
	desc: "监听录音停止事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onStop.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onError": {
	status: 0,
	desc: "监听录音错误事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/RecorderManager.onError.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onFrameRecorded": {
	status: 2,
	desc: "监听已录制完指定帧大小的文件事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onInterruptionBegin": {
	status: 2,
	desc: "监听录音因为受到系统占用而被中断开始事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
		target: ""
	},
	body: {
	}
},
	"RecorderManager.onInterruptionEnd": {
	status: 2,
	desc: "监听录音中断结束事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/recorder/wx.getRecorderManager.html",
		target: ""
	},
	body: {
	}
},
	createCameraContext: createCameraContext$1,
	"CameraContext.setZoom": {
	status: 0,
	desc: "设置缩放级别",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.setZoom.html",
		target: ""
	},
	body: {
	}
},
	"CameraContext.startRecord": {
	status: 1,
	desc: "开始录像",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.startRecord.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				selfieMirror: {
					type: 0,
					desc: "是否开启镜像"
				}
			}
		}
	}
},
	"CameraContext.stopRecord": {
	status: 1,
	desc: "结束录像",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.stopRecord.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				compressed: {
					type: 0,
					desc: "是否压缩视频"
				}
			}
		}
	}
},
	"CameraContext.onCameraFrame": {
	status: 2,
	desc: "获取 Camera 实时帧数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/media/camera/CameraContext.onCameraFrame.html",
		target: ""
	},
	body: {
	}
},
	previewMedia: previewMedia,
	openVideoEditor: openVideoEditor,
	getVideoInfo: getVideoInfo,
	compressVideo: compressVideo,
	chooseMedia: chooseMedia,
	createMediaContainer: createMediaContainer,
	updateVoIPChatMuteConfig: updateVoIPChatMuteConfig,
	subscribeVoIPVideoMembers: subscribeVoIPVideoMembers,
	setEnable1v1Chat: setEnable1v1Chat,
	onVoIPVideoMembersChanged: onVoIPVideoMembersChanged,
	onVoIPChatSpeakersChanged: onVoIPChatSpeakersChanged,
	onVoIPChatMembersChanged: onVoIPChatMembersChanged,
	onVoIPChatInterrupted: onVoIPChatInterrupted,
	offVoIPVideoMembersChanged: offVoIPVideoMembersChanged,
	offVoIPChatMembersChanged: offVoIPChatMembersChanged,
	offVoIPChatInterrupted: offVoIPChatInterrupted,
	joinVoIPChat: joinVoIPChat,
	join1v1Chat: join1v1Chat,
	exitVoIPChat: exitVoIPChat,
	createMediaRecorder: createMediaRecorder,
	createVideoDecoder: createVideoDecoder
};

var media$7 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	createMapContext: createMapContext$1,
	saveImageToPhotosAlbum: saveImageToPhotosAlbum$1,
	previewImage: previewImage$1,
	getImageInfo: getImageInfo$1,
	compressImage: compressImage$1,
	chooseMessageFile: chooseMessageFile,
	chooseImage: chooseImage$1,
	saveVideoToPhotosAlbum: saveVideoToPhotosAlbum,
	createVideoContext: createVideoContext$1,
	chooseVideo: chooseVideo$1,
	stopVoice: stopVoice,
	setInnerAudioOption: setInnerAudioOption,
	playVoice: playVoice,
	pauseVoice: pauseVoice,
	getAvailableAudioSources: getAvailableAudioSources,
	createInnerAudioContext: createInnerAudioContext,
	createAudioContext: createAudioContext,
	stopBackgroundAudio: stopBackgroundAudio,
	seekBackgroundAudio: seekBackgroundAudio,
	playBackgroundAudio: playBackgroundAudio,
	pauseBackgroundAudio: pauseBackgroundAudio,
	onBackgroundAudioStop: onBackgroundAudioStop,
	onBackgroundAudioPlay: onBackgroundAudioPlay,
	onBackgroundAudioPause: onBackgroundAudioPause,
	getBackgroundAudioPlayerState: getBackgroundAudioPlayerState,
	getBackgroundAudioManager: getBackgroundAudioManager,
	createLivePusherContext: createLivePusherContext,
	createLivePlayerContext: createLivePlayerContext,
	stopRecord: stopRecord,
	startRecord: startRecord,
	getRecorderManager: getRecorderManager$1,
	createCameraContext: createCameraContext$1,
	previewMedia: previewMedia,
	openVideoEditor: openVideoEditor,
	getVideoInfo: getVideoInfo,
	compressVideo: compressVideo,
	chooseMedia: chooseMedia,
	createMediaContainer: createMediaContainer,
	updateVoIPChatMuteConfig: updateVoIPChatMuteConfig,
	subscribeVoIPVideoMembers: subscribeVoIPVideoMembers,
	setEnable1v1Chat: setEnable1v1Chat,
	onVoIPVideoMembersChanged: onVoIPVideoMembersChanged,
	onVoIPChatSpeakersChanged: onVoIPChatSpeakersChanged,
	onVoIPChatMembersChanged: onVoIPChatMembersChanged,
	onVoIPChatInterrupted: onVoIPChatInterrupted,
	offVoIPVideoMembersChanged: offVoIPVideoMembersChanged,
	offVoIPChatMembersChanged: offVoIPChatMembersChanged,
	offVoIPChatInterrupted: offVoIPChatInterrupted,
	joinVoIPChat: joinVoIPChat,
	join1v1Chat: join1v1Chat,
	exitVoIPChat: exitVoIPChat,
	createMediaRecorder: createMediaRecorder,
	createVideoDecoder: createVideoDecoder,
	'default': media$6
});

var request$1 = {
	status: 1,
	desc: "发起 HTTPS 网络请求",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				responseType: {
					type: 0,
					desc: "响应的数据类型"
				},
				enableHttp2: {
					type: 0,
					desc: "开启 http2"
				},
				enableQuic: {
					type: 0,
					desc: "开启 quic"
				},
				enableCache: {
					type: 0,
					desc: "开启 cache"
				},
				enableHttpDNS: {
					type: 0,
					desc: "是否开启 HttpDNS 服务。如开启，需要同时填入"
				},
				httpDNSServiceId: {
					type: 0,
					desc: "HttpDNS 服务商 Id。"
				},
				enableChunked: {
					type: 0,
					desc: "开启 transfer-encoding chunked"
				},
				forceCellularNetwork: {
					type: 0,
					desc: "wifi下使用移动网络发送请求"
				},
				useHighPerformanceMode: {
					type: 0,
					desc: "使用高性能模式"
				},
				enableProfile: {
					type: 0,
					desc: "是否开启 profile"
				},
				redirect: {
					type: 0,
					desc: "重定向拦截策略"
				}
			}
		},
		returnValue: {
			props: {
				header: {
					type: 0,
					desc: "开发者服务器返回的 HTTP Response Header"
				},
				cookies: {
					type: 0,
					desc: "开发者服务器返回的 cookies，格式为字符串数组"
				},
				profile: {
					type: 0,
					desc: "网络请求过程中一些调试信息"
				}
			}
		}
	}
};
var downloadFile$1 = {
	status: 1,
	desc: "下载文件资源到本地",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/wx.downloadFile.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				filePath: {
					type: 0,
					desc: "指定文件下载后存储的路径 (本地路径)"
				},
				enableProfile: {
					type: 0,
					desc: "是否开启 profile"
				},
				enableHttp2: {
					type: 0,
					desc: "是否开启 http2"
				}
			}
		},
		returnValue: {
			props: {
				filePath: {
					type: 0,
					desc: "用户文件路径 (本地路径)。传入 filePath 时会返回，跟传入的 filePath 一致"
				},
				profile: {
					type: 0,
					desc: "网络请求过程中一些调试信息"
				}
			}
		}
	}
};
var uploadFile$1 = {
	status: 1,
	desc: "上传本地资源到开发者服务器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/upload/wx.uploadFile.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				enableProfile: {
					type: 0,
					desc: "是否开启 profile"
				},
				enableHttp2: {
					type: 0,
					desc: "是否开启 http2"
				}
			}
		}
	}
};
var connectSocket$1 = {
	status: 1,
	desc: "创建一个 WebSocket 的连接",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.connectSocket.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				forceCellularNetwork: {
					type: 0,
					desc: "强制使用蜂窝网络发送请求"
				}
			}
		}
	}
};
var onSocketOpen$1 = {
	status: 0,
	desc: "监听WebSocket连接打开事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketOpen.html",
		target: ""
	},
	body: {
	}
};
var sendSocketMessage$1 = {
	status: 0,
	desc: "通过 WebSocket 连接发送数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.sendSocketMessage.html",
		target: ""
	},
	body: {
	}
};
var onSocketMessage$1 = {
	status: 0,
	desc: "监听WebSocket接受到服务器的消息事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketMessage.html",
		target: ""
	},
	body: {
	}
};
var onSocketError$1 = {
	status: 0,
	desc: "监听WebSocket错误",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketError.html",
		target: ""
	},
	body: {
	}
};
var onSocketClose$1 = {
	status: 0,
	desc: "监听WebSocket关闭",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.onSocketClose.html",
		target: ""
	},
	body: {
	}
};
var closeSocket$1 = {
	status: 0,
	desc: "关闭 WebSocket 连接",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/websocket/wx.closeSocket.html",
		target: ""
	},
	body: {
	}
};
var stopLocalServiceDiscovery = {
	status: 2,
	desc: "停止搜索 mDNS 服务",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.stopLocalServiceDiscovery.html",
		target: ""
	},
	body: {
	}
};
var startLocalServiceDiscovery = {
	status: 2,
	desc: "开始搜索局域网下的 mDNS 服务",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.startLocalServiceDiscovery.html",
		target: ""
	},
	body: {
	}
};
var onLocalServiceResolveFail = {
	status: 2,
	desc: "监听 mDNS 服务解析失败的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceResolveFail.html",
		target: ""
	},
	body: {
	}
};
var onLocalServiceLost = {
	status: 2,
	desc: "监听 mDNS 服务离开的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceLost.html",
		target: ""
	},
	body: {
	}
};
var onLocalServiceFound = {
	status: 2,
	desc: "监听 mDNS 服务发现的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceFound.html",
		target: ""
	},
	body: {
	}
};
var onLocalServiceDiscoveryStop = {
	status: 2,
	desc: "监听 mDNS 服务停止搜索的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.onLocalServiceDiscoveryStop.html",
		target: ""
	},
	body: {
	}
};
var offLocalServiceResolveFail = {
	status: 2,
	desc: "取消监听 mDNS 服务解析失败的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceResolveFail.html",
		target: ""
	},
	body: {
	}
};
var offLocalServiceLost = {
	status: 2,
	desc: "取消监听 mDNS 服务离开的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceLost.html",
		target: ""
	},
	body: {
	}
};
var offLocalServiceFound = {
	status: 2,
	desc: "取消监听 mDNS 服务发现的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceFound.html",
		target: ""
	},
	body: {
	}
};
var offLocalServiceDiscoveryStop = {
	status: 2,
	desc: "取消监听 mDNS 服务停止搜索的事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/mdns/wx.offLocalServiceDiscoveryStop.html",
		target: ""
	},
	body: {
	}
};
var createUDPSocket = {
	status: 2,
	desc: "创建一个 UDP Socket 实例",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/udp/wx.createUDPSocket.html",
		target: ""
	},
	body: {
	}
};
var network$2 = {
	request: request$1,
	downloadFile: downloadFile$1,
	"DownloadTask.abort": {
	status: 0,
	desc: "中断下载任务",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.abort.html",
		target: ""
	},
	body: {
	}
},
	"DownloadTask.onProgressUpdate": {
	status: 0,
	desc: "监听下载进度变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.onProgressUpdate.html",
		target: ""
	},
	body: {
	}
},
	"DownloadTask.offProgressUpdate": {
	status: 0,
	desc: "移除下载进度变化事件的监听函数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.offProgressUpdate.html",
		target: ""
	},
	body: {
	}
},
	"DownloadTask.onHeadersReceived": {
	status: 2,
	desc: "监听 HTTP Response Header 事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.html",
		target: ""
	},
	body: {
	}
},
	"DownloadTask.offHeadersReceived": {
	status: 2,
	desc: "移除 HTTP Response Header 事件的监听函数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/network/download/DownloadTask.html",
		target: ""
	},
	body: {
	}
},
	uploadFile: uploadFile$1,
	connectSocket: connectSocket$1,
	onSocketOpen: onSocketOpen$1,
	sendSocketMessage: sendSocketMessage$1,
	onSocketMessage: onSocketMessage$1,
	onSocketError: onSocketError$1,
	onSocketClose: onSocketClose$1,
	closeSocket: closeSocket$1,
	stopLocalServiceDiscovery: stopLocalServiceDiscovery,
	startLocalServiceDiscovery: startLocalServiceDiscovery,
	onLocalServiceResolveFail: onLocalServiceResolveFail,
	onLocalServiceLost: onLocalServiceLost,
	onLocalServiceFound: onLocalServiceFound,
	onLocalServiceDiscoveryStop: onLocalServiceDiscoveryStop,
	offLocalServiceResolveFail: offLocalServiceResolveFail,
	offLocalServiceLost: offLocalServiceLost,
	offLocalServiceFound: offLocalServiceFound,
	offLocalServiceDiscoveryStop: offLocalServiceDiscoveryStop,
	createUDPSocket: createUDPSocket
};

var network$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	request: request$1,
	downloadFile: downloadFile$1,
	uploadFile: uploadFile$1,
	connectSocket: connectSocket$1,
	onSocketOpen: onSocketOpen$1,
	sendSocketMessage: sendSocketMessage$1,
	onSocketMessage: onSocketMessage$1,
	onSocketError: onSocketError$1,
	onSocketClose: onSocketClose$1,
	closeSocket: closeSocket$1,
	stopLocalServiceDiscovery: stopLocalServiceDiscovery,
	startLocalServiceDiscovery: startLocalServiceDiscovery,
	onLocalServiceResolveFail: onLocalServiceResolveFail,
	onLocalServiceLost: onLocalServiceLost,
	onLocalServiceFound: onLocalServiceFound,
	onLocalServiceDiscoveryStop: onLocalServiceDiscoveryStop,
	offLocalServiceResolveFail: offLocalServiceResolveFail,
	offLocalServiceLost: offLocalServiceLost,
	offLocalServiceFound: offLocalServiceFound,
	offLocalServiceDiscoveryStop: offLocalServiceDiscoveryStop,
	createUDPSocket: createUDPSocket,
	'default': network$2
});

var login = {
	status: 1,
	desc: "调用接口获取登录凭证（code）",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html",
		target: ""
	},
	body: {
		type: 1,
		value: "getAuthCode",
		msg: "命名不同/参数缺失",
		params: {
			timeout: {
				type: {
					type: 0,
					desc: "超时时长，单位ms"
				}
			}
		}
	}
};
var getUserProfile = {
	status: 1,
	desc: "获取用户信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html",
		target: ""
	},
	body: {
		type: 1,
		value: "getOpenUserInfo",
		msg: "命名不同/参数缺失/返回值缺失",
		params: {
			lang: {
				type: {
					type: 0,
					desc: "显示用户信息的语言"
				}
			},
			desc: {
				type: {
					type: 0,
					desc: "声明获取用户个人信息后的用途，不超过30个字符"
				}
			}
		},
		returnValue: {
			props: {
				rawData: {
					type: 0,
					desc: "不包括敏感信息的原始数据字符串，用于计算签名"
				},
				signature: {
					type: 0,
					desc: "使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息"
				},
				encryptedData: {
					type: 0,
					desc: "包括敏感数据在内的完整用户信息的加密数据"
				},
				iv: {
					type: 0,
					desc: "加密算法的初始向量"
				},
				cloudID: {
					type: 0,
					desc: "敏感数据对应的云 ID，开通云开发的小程序才会返回，可通过云调用直接获取开放数据"
				}
			}
		}
	}
};
var checkSession = {
	status: 2,
	desc: "检查登录态是否过期",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.checkSession.html",
		target: ""
	},
	body: {
	}
};
var navigateToMiniProgram$1 = {
	status: 1,
	desc: "打开另一个小程序",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				extraData: {
					type: 0,
					desc: "需要传递给目标小程序的数据"
				},
				envVersion: {
					type: 0,
					desc: "要打开的小程序版本"
				},
				shortLink: {
					type: 0,
					desc: "小程序链接"
				},
				noRelaunchIfPathUnchanged: {
					type: 0,
					desc: "不relaunch目标小程序"
				}
			}
		}
	}
};
var navigateBackMiniProgram$1 = {
	status: 2,
	desc: "返回到上一个小程序",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/miniprogram-navigate/wx.navigateBackMiniProgram.html",
		target: ""
	},
	body: {
	}
};
var getAccountInfoSync = {
	status: 2,
	desc: "获取当前帐号信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/account-info/wx.getAccountInfoSync.html",
		target: ""
	},
	body: {
	}
};
var getUserInfo = {
	status: 2,
	desc: "获取用户信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserInfo.html",
		target: ""
	},
	body: {
	}
};
var UserInfo = {
	status: 2,
	desc: "用户信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/UserInfo.html",
		target: ""
	},
	body: {
	}
};
var reportMonitor = {
	status: 2,
	desc: "自定义业务数据监控上报接口",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/report/wx.reportMonitor.html",
		target: ""
	},
	body: {
	}
};
var reportAnalytics$1 = {
	status: 2,
	desc: "自定义分析数据上报接口",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/data-analysis/wx.reportAnalytics.html",
		target: ""
	},
	body: {
	}
};
var requestPayment = {
	status: 2,
	desc: "发起支付",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html",
		target: ""
	},
	body: {
		msg: "差异较大，建议参考macle文档startPay"
	}
};
var authorize = {
	status: 0,
	desc: "提前向用户发起授权请求",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/authorize/wx.authorize.html",
		target: ""
	},
	body: {
	}
};
var openSetting$1 = {
	status: 1,
	desc: "调起客户端小程序设置界面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/wx.openSetting.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				withSubscriptions: {
					type: 0,
					desc: "是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息"
				}
			}
		},
		returnValue: {
			props: {
				subscriptionsSetting: {
					type: 0,
					desc: "用户订阅消息设置，接口参数withSubscriptions值为true时才会返回。"
				}
			}
		}
	}
};
var getSetting$1 = {
	status: 1,
	desc: "获取用户的当前设置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/wx.getSetting.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				withSubscriptions: {
					type: 0,
					desc: "是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息"
				}
			}
		},
		returnValue: {
			props: {
				subscriptionsSetting: {
					type: 0,
					desc: "用户订阅消息设置"
				},
				miniprogramAuthSetting: {
					type: 0,
					desc: "在插件中调用时，当前宿主小程序的用户授权结果"
				}
			}
		}
	}
};
var AuthSetting = {
	status: 2,
	desc: "用户授权设置信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/setting/AuthSetting.html",
		target: ""
	},
	body: {
	}
};
var chooseAddress = {
	status: 2,
	desc: "打开地图选择位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/address/wx.chooseAddress.html",
		target: ""
	},
	body: {
	}
};
var openCard = {
	status: 2,
	desc: "查看微信卡包中的卡券",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/card/wx.openCard.html",
		target: ""
	},
	body: {
	}
};
var addCard = {
	status: 2,
	desc: "添加卡券",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/card/wx.addCard.html",
		target: ""
	},
	body: {
	}
};
var reportEvent = {
	status: 1,
	desc: "事件上报",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/data-analysis/wx.reportEvent.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				data: {
					type: 0,
					desc: "可被 JSON.stringify 的对象，将一起上报至系统"
				}
			}
		}
	}
};
var chooseInvoiceTitle = {
	status: 2,
	desc: "选择用户的发票抬头",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/invoice/wx.chooseInvoiceTitle.html",
		target: ""
	},
	body: {
	}
};
var chooseInvoice = {
	status: 2,
	desc: "选择用户已有的发票",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/invoice/wx.chooseInvoice.html",
		target: ""
	},
	body: {
	}
};
var startSoterAuthentication = {
	status: 2,
	desc: "开始 SOTER 生物认证",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.startSoterAuthentication.html",
		target: ""
	},
	body: {
	}
};
var checkIsSupportSoterAuthentication = {
	status: 2,
	desc: "获取本机支持的 SOTER 生物认证方式",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.checkIsSupportSoterAuthentication.html",
		target: ""
	},
	body: {
	}
};
var checkIsSoterEnrolledInDevice = {
	status: 2,
	desc: "获取设备内是否录入如指纹等生物信息的接口",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/soter/wx.checkIsSoterEnrolledInDevice.html",
		target: ""
	},
	body: {
	}
};
var getWeRunData = {
	status: 2,
	desc: "获取用户过去三十天微信运动步数",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/werun/wx.getWeRunData.html",
		target: ""
	},
	body: {
	}
};
var reportPerformance = {
	status: 2,
	desc: "小程序测速上报",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/base/performance/wx.reportPerformance.html",
		target: ""
	},
	body: {
	}
};
var getPerformance = {
	status: 2,
	desc: "获取当前小程序性能相关的信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/performance/wx.getPerformance.html",
		target: ""
	},
	body: {
	}
};
var requestSubscribeMessage = {
	status: 2,
	desc: "调起客户端小程序订阅消息界面，返回用户订阅消息的操作结果",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html",
		target: ""
	},
	body: {
	}
};
var showRedPackage = {
	status: 2,
	desc: "拉取h5领取红包封面页",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/redpackage/wx.showRedPackage.html",
		target: ""
	},
	body: {
	}
};
var getGroupEnterInfo = {
	status: 2,
	desc: "获取群工具小程序启动信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/open-api/group/wx.getGroupEnterInfo.html",
		target: ""
	},
	body: {
	}
};
var openAbility$6 = {
	login: login,
	getUserProfile: getUserProfile,
	checkSession: checkSession,
	navigateToMiniProgram: navigateToMiniProgram$1,
	navigateBackMiniProgram: navigateBackMiniProgram$1,
	getAccountInfoSync: getAccountInfoSync,
	getUserInfo: getUserInfo,
	UserInfo: UserInfo,
	reportMonitor: reportMonitor,
	reportAnalytics: reportAnalytics$1,
	requestPayment: requestPayment,
	authorize: authorize,
	openSetting: openSetting$1,
	getSetting: getSetting$1,
	AuthSetting: AuthSetting,
	chooseAddress: chooseAddress,
	openCard: openCard,
	addCard: addCard,
	reportEvent: reportEvent,
	chooseInvoiceTitle: chooseInvoiceTitle,
	chooseInvoice: chooseInvoice,
	startSoterAuthentication: startSoterAuthentication,
	checkIsSupportSoterAuthentication: checkIsSupportSoterAuthentication,
	checkIsSoterEnrolledInDevice: checkIsSoterEnrolledInDevice,
	getWeRunData: getWeRunData,
	reportPerformance: reportPerformance,
	getPerformance: getPerformance,
	requestSubscribeMessage: requestSubscribeMessage,
	showRedPackage: showRedPackage,
	getGroupEnterInfo: getGroupEnterInfo
};

var openAbility$7 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	login: login,
	getUserProfile: getUserProfile,
	checkSession: checkSession,
	navigateToMiniProgram: navigateToMiniProgram$1,
	navigateBackMiniProgram: navigateBackMiniProgram$1,
	getAccountInfoSync: getAccountInfoSync,
	getUserInfo: getUserInfo,
	UserInfo: UserInfo,
	reportMonitor: reportMonitor,
	reportAnalytics: reportAnalytics$1,
	requestPayment: requestPayment,
	authorize: authorize,
	openSetting: openSetting$1,
	getSetting: getSetting$1,
	AuthSetting: AuthSetting,
	chooseAddress: chooseAddress,
	openCard: openCard,
	addCard: addCard,
	reportEvent: reportEvent,
	chooseInvoiceTitle: chooseInvoiceTitle,
	chooseInvoice: chooseInvoice,
	startSoterAuthentication: startSoterAuthentication,
	checkIsSupportSoterAuthentication: checkIsSupportSoterAuthentication,
	checkIsSoterEnrolledInDevice: checkIsSoterEnrolledInDevice,
	getWeRunData: getWeRunData,
	reportPerformance: reportPerformance,
	getPerformance: getPerformance,
	requestSubscribeMessage: requestSubscribeMessage,
	showRedPackage: showRedPackage,
	getGroupEnterInfo: getGroupEnterInfo,
	'default': openAbility$6
});

var switchTab$1 = {
	status: 0,
	desc: "跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.switchTab.html",
		target: ""
	},
	body: {
	}
};
var reLaunch$1 = {
	status: 0,
	desc: "关闭所有页面，打开到应用内的某个页面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.reLaunch.html",
		target: ""
	},
	body: {
	}
};
var redirectTo$1 = {
	status: 0,
	desc: "关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabbar 页面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.redirectTo.html",
		target: ""
	},
	body: {
	}
};
var navigateTo$1 = {
	status: 1,
	desc: "保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabbar 页面。使用 wx.navigateBack 可以返回到原页面。小程序中页面栈最多十层",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				routeType: {
					type: 0,
					desc: "自定义路由类型"
				}
			}
		}
	}
};
var navigateBack$1 = {
	status: 0,
	desc: "关闭当前页面，返回上一页面或多级页面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateBack.html",
		target: ""
	},
	body: {
	}
};
var exitMiniProgram$1 = {
	status: 0,
	desc: "退出当前小程序",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.exitMiniProgram.html",
		target: ""
	},
	body: {
	}
};
var router = {
	switchTab: switchTab$1,
	reLaunch: reLaunch$1,
	redirectTo: redirectTo$1,
	navigateTo: navigateTo$1,
	navigateBack: navigateBack$1,
	exitMiniProgram: exitMiniProgram$1
};

var router$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	switchTab: switchTab$1,
	reLaunch: reLaunch$1,
	redirectTo: redirectTo$1,
	navigateTo: navigateTo$1,
	navigateBack: navigateBack$1,
	exitMiniProgram: exitMiniProgram$1,
	'default': router
});

var updateShareMenu = {
	status: 2,
	desc: "更新转发属性",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.updateShareMenu.html",
		target: ""
	},
	body: {
	}
};
var showShareMenu = {
	status: 2,
	desc: "显示当前页面的转发按钮",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.showShareMenu.html",
		target: ""
	},
	body: {
	}
};
var hideShareMenu$2 = {
	status: 2,
	desc: "隐藏转发按钮",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.hideShareMenu.html",
		target: ""
	},
	body: {
	}
};
var getShareInfo = {
	status: 2,
	desc: "获取转发详细信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.getShareInfo.html",
		target: ""
	},
	body: {
	}
};
var authPrivateMessage = {
	status: 2,
	desc: "验证私密消息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.authPrivateMessage.html",
		target: ""
	},
	body: {
	}
};
var share$2 = {
	updateShareMenu: updateShareMenu,
	showShareMenu: showShareMenu,
	hideShareMenu: hideShareMenu$2,
	getShareInfo: getShareInfo,
	authPrivateMessage: authPrivateMessage
};

var share$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	updateShareMenu: updateShareMenu,
	showShareMenu: showShareMenu,
	hideShareMenu: hideShareMenu$2,
	getShareInfo: getShareInfo,
	authPrivateMessage: authPrivateMessage,
	'default': share$2
});

var setStorageSync$1 = {
	status: 0,
	desc: "将数据存储在本地缓存中指定的 key 中",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html",
		target: ""
	},
	body: {
	}
};
var setStorage$1 = {
	status: 0,
	desc: "将数据存储在本地缓存中指定的 key 中异步接口",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorage.html",
		target: ""
	},
	body: {
	}
};
var removeStorageSync$1 = {
	status: 2,
	desc: "从本地缓存中同步移除指定 key",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorageSync.html",
		target: ""
	},
	body: {
	}
};
var removeStorage$1 = {
	status: 0,
	desc: "从本地缓存中移除指定 key",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.removeStorage.html",
		target: ""
	},
	body: {
	}
};
var getStorageSync$1 = {
	status: 0,
	desc: "获取缓存数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html",
		target: ""
	},
	body: {
	}
};
var getStorageInfoSync$1 = {
	status: 2,
	desc: "获取当前storage的相关信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfoSync.html",
		target: ""
	},
	body: {
	}
};
var getStorageInfo$1 = {
	status: 0,
	desc: "异步获取当前storage的相关信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageInfo.html",
		target: ""
	},
	body: {
	}
};
var getStorage$1 = {
	status: 0,
	desc: "从本地缓存中异步获取指定 key 的内容",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorage.html",
		target: ""
	},
	body: {
	}
};
var clearStorageSync$1 = {
	status: 2,
	desc: "同步清理本地数据缓存",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.clearStorageSync.html",
		target: ""
	},
	body: {
	}
};
var clearStorage$1 = {
	status: 0,
	desc: "清理本地数据缓存",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.clearStorage.html",
		target: ""
	},
	body: {
	}
};
var setBackgroundFetchToken = {
	status: 2,
	desc: "设置自定义登录态",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.setBackgroundFetchToken.html",
		target: ""
	},
	body: {
	}
};
var onBackgroundFetchData = {
	status: 2,
	desc: "监听收到 backgroundFetch 数据时的回调",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.onBackgroundFetchData.html",
		target: ""
	},
	body: {
	}
};
var getBackgroundFetchToken = {
	status: 2,
	desc: "获取设置过的自定义登录态",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.getBackgroundFetchToken.html",
		target: ""
	},
	body: {
	}
};
var getBackgroundFetchData$1 = {
	status: 0,
	desc: "拉取 backgroundFetch 客户端缓存数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/storage/background-fetch/wx.getBackgroundFetchData.html",
		target: ""
	},
	body: {
	}
};
var storage$2 = {
	setStorageSync: setStorageSync$1,
	setStorage: setStorage$1,
	removeStorageSync: removeStorageSync$1,
	removeStorage: removeStorage$1,
	getStorageSync: getStorageSync$1,
	getStorageInfoSync: getStorageInfoSync$1,
	getStorageInfo: getStorageInfo$1,
	getStorage: getStorage$1,
	clearStorageSync: clearStorageSync$1,
	clearStorage: clearStorage$1,
	setBackgroundFetchToken: setBackgroundFetchToken,
	onBackgroundFetchData: onBackgroundFetchData,
	getBackgroundFetchToken: getBackgroundFetchToken,
	getBackgroundFetchData: getBackgroundFetchData$1
};

var storage$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	setStorageSync: setStorageSync$1,
	setStorage: setStorage$1,
	removeStorageSync: removeStorageSync$1,
	removeStorage: removeStorage$1,
	getStorageSync: getStorageSync$1,
	getStorageInfoSync: getStorageInfoSync$1,
	getStorageInfo: getStorageInfo$1,
	getStorage: getStorage$1,
	clearStorageSync: clearStorageSync$1,
	clearStorage: clearStorage$1,
	setBackgroundFetchToken: setBackgroundFetchToken,
	onBackgroundFetchData: onBackgroundFetchData,
	getBackgroundFetchToken: getBackgroundFetchToken,
	getBackgroundFetchData: getBackgroundFetchData$1,
	'default': storage$2
});

var createSelectorQuery$1 = {
	status: 0,
	desc: "返回一个 SelectorQuery 对象实例",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html",
		target: ""
	},
	body: {
	}
};
var createIntersectionObserver$1 = {
	status: 2,
	desc: "创建并返回一个 IntersectionObserver 对象实例",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createIntersectionObserver.html",
		target: ""
	},
	body: {
	}
};
var IntersectionObserver = {
	status: 2,
	desc: "IntersectionObserver 对象，用于推断某些节点是否可以被用户看见、有多大比例可以被用户看见",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/IntersectionObserver.html",
		target: ""
	},
	body: {
	}
};
var NodesRef = {
	status: 2,
	desc: "用于获取 WXML 节点信息的对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/NodesRef.html",
		target: ""
	},
	body: {
	}
};
var SelectorQuery = {
	status: 0,
	desc: "查询节点信息的对象",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.html",
		target: ""
	},
	body: {
	}
};
var template$1 = {
	createSelectorQuery: createSelectorQuery$1,
	"SelectorQuery.exec": {
	status: 0,
	desc: "执行所有的请求",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.exec.html",
		target: ""
	},
	body: {
	}
},
	"SelectorQuery.in": {
	status: 0,
	desc: "将选择器的选取范围更改为自定义组件 component 内",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.in.html",
		target: ""
	},
	body: {
	}
},
	"SelectorQuery.select": {
	status: 0,
	desc: "在当前页面下选择匹配选择器（selector）的第一个节点",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.select.html",
		target: ""
	},
	body: {
	}
},
	"SelectorQuery.selectAll": {
	status: 0,
	desc: "在当前页面下选择匹配选择器（selector）的所有节点",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.selectAll.html",
		target: ""
	},
	body: {
	}
},
	"SelectorQuery.selectViewport": {
	status: 0,
	desc: "选择显示区域。可用于获取显示区域的尺寸、滚动位置等信息。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/wxml/SelectorQuery.selectViewport.html",
		target: ""
	},
	body: {
	}
},
	createIntersectionObserver: createIntersectionObserver$1,
	IntersectionObserver: IntersectionObserver,
	NodesRef: NodesRef,
	SelectorQuery: SelectorQuery
};

var template$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	createSelectorQuery: createSelectorQuery$1,
	createIntersectionObserver: createIntersectionObserver$1,
	IntersectionObserver: IntersectionObserver,
	NodesRef: NodesRef,
	SelectorQuery: SelectorQuery,
	'default': template$1
});

var showToast$1 = {
	status: 0,
	desc: "显示消息提示框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showToast.html",
		target: ""
	},
	body: {
	}
};
var showModal$1 = {
	status: 1,
	desc: "显示模态对话框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showModal.html",
		target: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				placeholderText: {
					type: 0,
					desc: "显示输入框时的提示文本"
				}
			}
		}
	}
};
var showLoading$1 = {
	status: 0,
	desc: "显示 loading 提示框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showLoading.html",
		target: ""
	},
	body: {
	}
};
var showActionSheet$1 = {
	status: 0,
	desc: "显示操作菜单",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showActionSheet.html",
		target: ""
	},
	body: {
	}
};
var hideToast$1 = {
	status: 1,
	desc: "隐藏消息提示框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideToast.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				noConflict: {
					type: 0,
					desc: "目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性"
				}
			}
		}
	}
};
var hideLoading$1 = {
	status: 1,
	desc: "隐藏 loading 提示框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.hideLoading.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				noConflict: {
					type: 0,
					desc: "目前 toast 和 loading 相关接口可以相互混用，此参数可用于取消混用特性"
				}
			}
		}
	}
};
var showNavigationBarLoading$1 = {
	status: 2,
	desc: "在当前页面显示导航条加载动画",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.showNavigationBarLoading.html",
		target: ""
	},
	body: {
	}
};
var setNavigationBarTitle$1 = {
	status: 0,
	desc: "动态设置当前页面的标题",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html",
		target: ""
	},
	body: {
	}
};
var setNavigationBarColor$1 = {
	status: 0,
	desc: "设置页面导航条颜色",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarColor.html",
		target: ""
	},
	body: {
	}
};
var hideNavigationBarLoading$1 = {
	status: 2,
	desc: "在当前页面隐藏导航条加载动画",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.hideNavigationBarLoading.html",
		target: ""
	},
	body: {
	}
};
var hideHomeButton = {
	status: 2,
	desc: "隐藏返回首页按钮",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.hideHomeButton.html",
		target: ""
	},
	body: {
	}
};
var setBackgroundTextStyle$1 = {
	status: 0,
	desc: "动态设置下拉背景字体、loading 图的样式",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/background/wx.setBackgroundTextStyle.html",
		target: ""
	},
	body: {
	}
};
var setBackgroundColor$1 = {
	status: 0,
	desc: "动态设置窗口的背景色",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/background/wx.setBackgroundColor.html",
		target: ""
	},
	body: {
	}
};
var showTabBarRedDot$1 = {
	status: 0,
	desc: "显示tabBar某一项的右上角的红点",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.showTabBarRedDot.html",
		target: ""
	},
	body: {
	}
};
var showTabBar$1 = {
	status: 0,
	desc: "显示 tabBar",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.showTabBar.html",
		target: ""
	},
	body: {
	}
};
var setTabBarStyle$1 = {
	status: 0,
	desc: "动态设置 tabBar 的整体样式",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarStyle.html",
		target: ""
	},
	body: {
	}
};
var setTabBarItem$1 = {
	status: 0,
	desc: "动态设置 tabBar 某一项的内容",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarItem.html",
		target: ""
	},
	body: {
	}
};
var setTabBarBadge$1 = {
	status: 0,
	desc: "为 tabBar 某一项的右上角添加文本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.setTabBarBadge.html",
		target: ""
	},
	body: {
	}
};
var removeTabBarBadge$1 = {
	status: 0,
	desc: "移除 tabBar 某一项右上角的文本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.removeTabBarBadge.html",
		target: ""
	},
	body: {
	}
};
var hideTabBarRedDot$1 = {
	status: 0,
	desc: "隐藏 tabBar 某一项的右上角的红点",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.hideTabBarRedDot.html",
		target: ""
	},
	body: {
	}
};
var hideTabBar$1 = {
	status: 0,
	desc: "隐藏 tabBar",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/tab-bar/wx.hideTabBar.html",
		target: ""
	},
	body: {
	}
};
var loadFontFace$1 = {
	status: 1,
	desc: "动态加载网络字体",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/font/wx.loadFontFace.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				scopes: {
					type: 0,
					desc: "字体作用范围"
				}
			}
		}
	}
};
var stopPullDownRefresh$1 = {
	status: 0,
	desc: "停止当前页面下拉刷新",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.stopPullDownRefresh.html",
		target: ""
	},
	body: {
	}
};
var startPullDownRefresh$1 = {
	status: 0,
	desc: "开始下拉刷新。调用后触发下拉刷新动画，效果与用户手动下拉刷新一致",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.startPullDownRefresh.html",
		target: ""
	},
	body: {
	}
};
var pageScrollTo$1 = {
	status: 1,
	desc: "将页面滚动到目标位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/scroll/wx.pageScrollTo.html",
		target: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				selector: {
					type: 0,
					desc: "选择器"
				},
				offsetTop: {
					type: 0,
					desc: "偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px"
				}
			}
		}
	}
};
var createAnimation$1 = {
	status: 2,
	desc: "创建一个动画实例 animation",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/animation/wx.createAnimation.html",
		target: ""
	},
	body: {
	}
};
var setTopBarText = {
	status: 2,
	desc: "动态设置置顶栏文字内容",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/sticky/wx.setTopBarText.html",
		target: ""
	},
	body: {
	}
};
var nextTick = {
	status: 0,
	desc: "延迟一部分操作到下一个时间片再执行",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/custom-component/wx.nextTick.html",
		target: ""
	},
	body: {
	}
};
var getMenuButtonBoundingClientRect$1 = {
	status: 1,
	desc: "获取菜单按钮（右上角胶囊按钮）的布局位置信息",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html",
		target: ""
	},
	body: {
		msg: "返回值不同",
		returnValue: {
			props: {
				success: {
					type: 0,
					desc: "微信直接返回const res = wx.getMenuButtonBoundingClientRect()，华为macle用函数ma.getMenuButtonBoundingClientRect({success(res) {console.log(res.width);}})"
				}
			}
		}
	}
};
var onWindowResize = {
	status: 2,
	desc: "监听窗口尺寸变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.onWindowResize.html",
		target: ""
	},
	body: {
	}
};
var offWindowResize = {
	status: 2,
	desc: "取消监听窗口尺寸变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.offWindowResize.html",
		target: ""
	},
	body: {
	}
};
var enableAlertBeforeUnload = {
	status: 2,
	desc: "开启小程序页面返回询问对话框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.enableAlertBeforeUnload.html",
		target: ""
	},
	body: {
	}
};
var disableAlertBeforeUnload = {
	status: 2,
	desc: "关闭小程序页面返回询问对话框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.disableAlertBeforeUnload.html",
		target: ""
	},
	body: {
	}
};
var setWindowSize = {
	status: 2,
	desc: "设置窗口大小，该接口仅适用于 PC 平台",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.setWindowSize.html",
		target: ""
	},
	body: {
	}
};
var onKeyboardHeightChange = {
	status: 0,
	desc: "监听键盘高度变化",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.onKeyboardHeightChange.html",
		target: ""
	},
	body: {
	}
};
var offKeyboardHeightChange = {
	status: 0,
	desc: "取消监听键盘高度变化事件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.offKeyboardHeightChange.html",
		target: ""
	},
	body: {
	}
};
var hideKeyboard$1 = {
	status: 0,
	desc: "在input、textarea等focus拉起键盘之后，手动调用此接口收起键盘",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.hideKeyboard.html",
		target: ""
	},
	body: {
	}
};
var getSelectedTextRange = {
	status: 2,
	desc: "在input、textarea等focus之后，获取输入框的光标位置",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/api/ui/keyboard/wx.getSelectedTextRange.html",
		target: ""
	},
	body: {
	}
};
var view$8 = {
	showToast: showToast$1,
	showModal: showModal$1,
	showLoading: showLoading$1,
	showActionSheet: showActionSheet$1,
	hideToast: hideToast$1,
	hideLoading: hideLoading$1,
	showNavigationBarLoading: showNavigationBarLoading$1,
	setNavigationBarTitle: setNavigationBarTitle$1,
	setNavigationBarColor: setNavigationBarColor$1,
	hideNavigationBarLoading: hideNavigationBarLoading$1,
	hideHomeButton: hideHomeButton,
	setBackgroundTextStyle: setBackgroundTextStyle$1,
	setBackgroundColor: setBackgroundColor$1,
	showTabBarRedDot: showTabBarRedDot$1,
	showTabBar: showTabBar$1,
	setTabBarStyle: setTabBarStyle$1,
	setTabBarItem: setTabBarItem$1,
	setTabBarBadge: setTabBarBadge$1,
	removeTabBarBadge: removeTabBarBadge$1,
	hideTabBarRedDot: hideTabBarRedDot$1,
	hideTabBar: hideTabBar$1,
	loadFontFace: loadFontFace$1,
	stopPullDownRefresh: stopPullDownRefresh$1,
	startPullDownRefresh: startPullDownRefresh$1,
	pageScrollTo: pageScrollTo$1,
	createAnimation: createAnimation$1,
	setTopBarText: setTopBarText,
	nextTick: nextTick,
	getMenuButtonBoundingClientRect: getMenuButtonBoundingClientRect$1,
	onWindowResize: onWindowResize,
	offWindowResize: offWindowResize,
	enableAlertBeforeUnload: enableAlertBeforeUnload,
	disableAlertBeforeUnload: disableAlertBeforeUnload,
	setWindowSize: setWindowSize,
	onKeyboardHeightChange: onKeyboardHeightChange,
	offKeyboardHeightChange: offKeyboardHeightChange,
	hideKeyboard: hideKeyboard$1,
	getSelectedTextRange: getSelectedTextRange
};

var view$9 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	showToast: showToast$1,
	showModal: showModal$1,
	showLoading: showLoading$1,
	showActionSheet: showActionSheet$1,
	hideToast: hideToast$1,
	hideLoading: hideLoading$1,
	showNavigationBarLoading: showNavigationBarLoading$1,
	setNavigationBarTitle: setNavigationBarTitle$1,
	setNavigationBarColor: setNavigationBarColor$1,
	hideNavigationBarLoading: hideNavigationBarLoading$1,
	hideHomeButton: hideHomeButton,
	setBackgroundTextStyle: setBackgroundTextStyle$1,
	setBackgroundColor: setBackgroundColor$1,
	showTabBarRedDot: showTabBarRedDot$1,
	showTabBar: showTabBar$1,
	setTabBarStyle: setTabBarStyle$1,
	setTabBarItem: setTabBarItem$1,
	setTabBarBadge: setTabBarBadge$1,
	removeTabBarBadge: removeTabBarBadge$1,
	hideTabBarRedDot: hideTabBarRedDot$1,
	hideTabBar: hideTabBar$1,
	loadFontFace: loadFontFace$1,
	stopPullDownRefresh: stopPullDownRefresh$1,
	startPullDownRefresh: startPullDownRefresh$1,
	pageScrollTo: pageScrollTo$1,
	createAnimation: createAnimation$1,
	setTopBarText: setTopBarText,
	nextTick: nextTick,
	getMenuButtonBoundingClientRect: getMenuButtonBoundingClientRect$1,
	onWindowResize: onWindowResize,
	offWindowResize: offWindowResize,
	enableAlertBeforeUnload: enableAlertBeforeUnload,
	disableAlertBeforeUnload: disableAlertBeforeUnload,
	setWindowSize: setWindowSize,
	onKeyboardHeightChange: onKeyboardHeightChange,
	offKeyboardHeightChange: offKeyboardHeightChange,
	hideKeyboard: hideKeyboard$1,
	getSelectedTextRange: getSelectedTextRange,
	'default': view$8
});

var require$$0$3 = getCjsExportFromNamespace(basic$7);

var require$$1$3 = getCjsExportFromNamespace(canvas$7);

var require$$2$3 = getCjsExportFromNamespace(equipment$3);

var require$$3$3 = getCjsExportFromNamespace(extPlatform$1);

var require$$4$3 = getCjsExportFromNamespace(file$3);

var require$$5$3 = getCjsExportFromNamespace(location$3);

var require$$6$3 = getCjsExportFromNamespace(media$7);

var require$$7$3 = getCjsExportFromNamespace(network$3);

var require$$8$3 = getCjsExportFromNamespace(openAbility$7);

var require$$9$1 = getCjsExportFromNamespace(router$1);

var require$$10$1 = getCjsExportFromNamespace(share$3);

var require$$11$1 = getCjsExportFromNamespace(storage$3);

var require$$12$1 = getCjsExportFromNamespace(template$2);

var require$$13$1 = getCjsExportFromNamespace(view$9);

const apiInfo$3 = [{
  name: '基础',
  type: 'basic',
  body: require$$0$3
}, {
  name: '画布',
  type: 'canvas',
  body: require$$1$3
}, {
  name: '设备相关',
  type: 'equipment',
  body: require$$2$3
}, {
  name: '第三方平台',
  type: 'extPlatform',
  body: require$$3$3
}, {
  name: '文件系统',
  type: 'file',
  body: require$$4$3
}, {
  name: '位置',
  type: 'location',
  body: require$$5$3
}, {
  name: '媒体',
  type: 'media',
  body: require$$6$3
}, {
  name: '网络',
  type: 'network',
  body: require$$7$3
}, {
  name: '开放能力',
  type: 'openAbility',
  body: require$$8$3
}, {
  name: '路由',
  type: 'router',
  body: require$$9$1
}, {
  name: '转发',
  type: 'share',
  body: require$$10$1
}, {
  name: '数据缓存',
  type: 'storage',
  body: require$$11$1
}, {
  name: 'wxml 模板',
  type: 'template',
  body: require$$12$1
}, {
  name: '界面',
  type: 'view',
  body: require$$13$1
}];
let descObject$3 = {};
apiInfo$3.forEach(apiItem => {
  descObject$3 = Object.assign(descObject$3, apiItem.body);
});
const info = {
  apiInfo: apiInfo$3,
  descObject: descObject$3
};
var apiInfo_1$1 = info;

const {
  parseAppJs: parseAppJs$1
} = compilejs;
const apiInfo$2 = apiInfo_1$1.descObject;
const {
  getNonsupportApiConfigMap: getNonsupportApiConfigMap$1,
  mkParamsConfigMap: mkParamsConfigMap$1
} = makeConfig;
const nonsupportApiConfigMap$1 = {};
const diffApiMap$1 = {};
const apiConfigMap$1 = {};
getNonsupportApiConfigMap$1(apiInfo$2, nonsupportApiConfigMap$1, diffApiMap$1);
mkParamsConfigMap$1(apiInfo$2, apiConfigMap$1);
commonjsGlobal.wxNonsupportApiConfigMap = nonsupportApiConfigMap$1;
commonjsGlobal.wxDiffApiMap = diffApiMap$1;
commonjsGlobal.wxApiConfigMap = apiConfigMap$1;
commonjsGlobal.wxWholeApi = apiInfo$2;
var compileJs$1 = function (fileInfo, originCode, apis, apisLine) {
  let parseCode = parseAppJs$1(originCode, apis, apisLine);
  fsExtra__default["default"].outputFileSync(fileInfo.dist, parseCode);
};

var compileWxss = function (fileInfo) {
  fileInfo.dist = fileInfo.dist.replace(/\.wxss/, '.mass');
  let cssContent = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8') || '';
  cssContent = cssContent.replace(/\.wxss("|')/g, (match, $1) => {
    return `.mass${$1}`;
  });
  fsExtra__default["default"].outputFileSync(fileInfo.dist, cssContent);
};

var convertPropMap$1 = {
  translationMap: {
    'wx-if': 'ma:if',
    'wx-else': 'ma:else'
  }
};

var swiper$1 = {
	status: 1,
	name: "滑块视图容器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html",
		target: ""
	},
	props: {
		"previous-margin": {
			type: 0,
			status: 2,
			desc: "前边距，可用于露出前一项的一小部分，接受 px 和 rpx 值"
		},
		"next-margin": {
			type: 0,
			status: 2,
			desc: "后边距，可用于露出后一项的一小部分，接受 px 和 rpx 值"
		},
		"snap-to-edge": {
			type: 0,
			status: 2,
			desc: "当 swiper-item 的个数大于等于 2，关闭 circular 并且开启 previous-margin 或 next-margin 的时候，可以指定这个边距是否应用到第一个、最后一个元素"
		},
		"display-multiple-items": {
			type: 0,
			status: 2,
			desc: "同时显示的滑块数量"
		},
		bindtransition: {
			type: 0,
			status: 2,
			desc: "swiper-item 的位置发生改变时会触发 transition 事件，event.detail = {dx: dx, dy: dy}"
		},
		bindanimationfinish: {
			type: 0,
			status: 2,
			desc: "动画结束时会触发 animationfinish 事件，event.detail 同上"
		}
	},
	desc: "其中只可放置swiper-item组件，否则会导致未定义的行为。"
};
var view$5 = {
	type: 7,
	status: 0,
	name: "视图容器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/view.html",
		target: ""
	},
	desc: "视图容器"
};
var view$6 = {
	"movable-view": {
	type: 0,
	status: 2,
	name: "可移动的视图容器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/movable-view.html",
		target: ""
	},
	desc: "在页面中可以拖拽滑动。movable-view必须在 movable-area 组件中，并且必须是直接子节点，否则不能移动。"
},
	"cover-image": {
	type: 0,
	status: 2,
	name: "覆盖在原生组件之上的图片视图",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/cover-image.html",
		target: ""
	},
	desc: "可覆盖的原生组件同cover-view，支持嵌套在cover-view里。"
},
	"cover-view": {
	type: 0,
	status: 2,
	name: "覆盖在原生组件之上的文本视图。",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/cover-view.html",
		target: ""
	},
	desc: "可覆盖的原生组件包括 map、video、canvas、camera、live-player、live-pusher只支持嵌套 cover-view、cover-image"
},
	"movable-area": {
	type: 0,
	status: 2,
	name: "movable-view的可移动区域",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/movable-area.html",
		target: ""
	},
	desc: "movable-view的可移动区域。"
},
	"scroll-view": {
	status: 1,
	name: "可滚动视图区域",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html",
		target: ""
	},
	props: {
		"enable-flex": {
			type: 0,
			status: 2,
			desc: "启用 flexbox 布局。开启后，当前节点声明了 display: flex 就会成为 flex container，并作用于其孩子节点。"
		},
		"scroll-anchoring": {
			type: 0,
			status: 2,
			desc: "开启 scroll anchoring 特性，即控制滚动位置不随内容变化而抖动，仅在 iOS 下生效，安卓下可参考 CSS overflow-anchor 属性"
		},
		"refresher-enabled": {
			type: 0,
			status: 2,
			desc: "开启自定义下拉刷新"
		},
		"refresher-threshold": {
			type: 0,
			status: 2,
			desc: "设置自定义下拉刷新阈值"
		},
		"refresher-default-style": {
			type: 0,
			status: 2,
			desc: "设置自定义下拉刷新默认样式，支持设置 black | white | none， none 表示不使用默认样式"
		},
		"refresher-background": {
			type: 0,
			status: 2,
			desc: "设置自定义下拉刷新区域背景颜色"
		},
		"refresher-triggered": {
			type: 0,
			status: 2,
			desc: "设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发"
		},
		bounces: {
			type: 0,
			status: 2,
			desc: "iOS 下 scroll-view 边界弹性控制 (同时开启 enhanced 属性后生效)"
		},
		"paging-enabled": {
			type: 0,
			status: 2,
			desc: "分页滑动效果 (同时开启 enhanced 属性后生效)"
		},
		"fast-deceleration": {
			type: 0,
			status: 2,
			desc: "滑动减速速率控制 (同时开启 enhanced 属性后生效)"
		},
		bindrefresherpulling: {
			type: 0,
			status: 2,
			desc: "自定义下拉刷新控件被下拉"
		},
		bindrefresherrefresh: {
			type: 0,
			status: 2,
			desc: "自定义下拉刷新被触发"
		},
		bindrefresherrestore: {
			type: 0,
			status: 2,
			desc: "自定义下拉刷新被复位"
		},
		bindrefresherabort: {
			type: 0,
			status: 2,
			desc: "自定义下拉刷新被中止"
		}
	},
	desc: "使用竖向滚动时，需要给scroll-view一个固定高度，通过 WXSS 设置 height。组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
},
	swiper: swiper$1,
	"swiper-item": {
	type: 7,
	status: 0,
	name: "仅可放置在swiper组件中，宽高自动设置为100%",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/swiper-item.html",
		target: ""
	},
	desc: "仅可放置在swiper组件中，宽高自动设置为100%。"
},
	view: view$5
};

var view$7 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	swiper: swiper$1,
	view: view$5,
	'default': view$6
});

var icon$1 = {
	type: 7,
	status: 0,
	name: "图标",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/icon.html",
		target: ""
	},
	desc: "组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
};
var progress$1 = {
	status: 1,
	name: "进度条",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/progress.html",
		target: ""
	},
	props: {
		color: {
			type: 0,
			status: 2,
			desc: "进度条颜色（请使用activeColor）"
		}
	},
	desc: "组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。"
};
var text$1 = {
	type: 7,
	status: 0,
	name: "文本",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/text.html",
		target: ""
	},
	desc: "文本。"
};
var wxs = {
	type: 1,
	status: 0,
	tagName: "sjs",
	desc: "微信脚本"
};
var block = {
	name: "块",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html#block%20wx:for",
		target: ""
	},
	desc: "渲染一个包含多节点的结构块",
	type: 7,
	status: 0
};
var include = {
	name: "引用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/import.html",
		target: ""
	},
	desc: "include 可以将目标文件除了 <template/> <wxs/> 外的整个代码引入，相当于是拷贝到 include 位置",
	type: 7,
	status: 0
};
var template = {
	name: "模板",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/template.html",
		target: ""
	},
	desc: "可以在模板中定义代码片段，然后在不同的地方调用",
	type: 7,
	status: 0
};
var basic$4 = {
	icon: icon$1,
	progress: progress$1,
	"rich-text": {
	name: "富文本",
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/rich-text.html",
		target: ""
	},
	desc: "富文本"
},
	text: text$1,
	wxs: wxs,
	block: block,
	"import": {
	name: "引用",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/import.html",
		target: ""
	},
	desc: "import可以在该文件中使用目标文件定义的template",
	type: 7,
	status: 0
},
	include: include,
	template: template
};

var basic$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	icon: icon$1,
	progress: progress$1,
	text: text$1,
	wxs: wxs,
	block: block,
	include: include,
	template: template,
	'default': basic$4
});

var checkbox$1 = {
	type: 7,
	status: 0,
	name: "多项选择器",
	url: {
		original: "",
		target: ""
	},
	desc: "多项选择器"
};
var form$3 = {
	status: 1,
	name: "表单",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/form.html",
		target: ""
	},
	props: {
		"report-submit-timeout": {
			type: 0,
			status: 2,
			desc: "等待一段时间（毫秒数）以确认 formId 是否生效"
		}
	},
	desc: "将组件内的用户输入的switch input checkbox slider radio picker 提交。"
};
var input$1 = {
	status: 1,
	name: "输入框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/input.html",
		target: ""
	},
	props: {
		"auto-focus": {
			type: 0,
			status: 2,
			desc: "(即将废弃，请直接使用 focus )自动聚焦，拉起键盘"
		},
		"always-embed": {
			type: 0,
			status: 2,
			desc: "安全键盘加密公钥的路径，只支持包内路径"
		},
		"safe-password-cert-path": {
			type: 0,
			status: 2,
			desc: "强制 input 处于同层状态，默认 focus 时 input 会切到非同层状态 (仅在 iOS 下生效)"
		},
		"safe-password-length": {
			type: 0,
			status: 2,
			desc: "安全键盘输入密码长度"
		},
		"safe-password-time-stamp": {
			type: 0,
			status: 2,
			desc: "安全键盘加密时间戳"
		},
		"safe-password-nonce": {
			type: 0,
			status: 2,
			desc: "安全键盘加密盐值"
		},
		"safe-password-salt": {
			type: 0,
			status: 2,
			desc: "安全键盘计算hash盐值，若指定custom-hash 则无效"
		},
		"safe-password-custom-hash": {
			type: 0,
			status: 2,
			desc: "安全键盘计算hash的算法表达式"
		}
	},
	desc: "该组件是原生组件，使用时请注意相关限制"
};
var picker$1 = {
	type: 7,
	status: 0,
	name: "从底部弹起的滚动选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/picker.html",
		target: ""
	},
	desc: "从底部弹起的滚动选择器。"
};
var radio$1 = {
	type: 7,
	status: 0,
	name: "单选项目",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/radio.html",
		target: ""
	},
	desc: "单选项目。"
};
var slider$1 = {
	status: 1,
	name: "滑动选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/slider.html",
		target: ""
	},
	props: {
		color: {
			type: 0,
			status: 2,
			desc: "背景条的颜色（请使用 backgroundColor）"
		},
		"selected-color": {
			type: 0,
			status: 2,
			desc: "已选择的颜色（请使用 activeColor）"
		}
	},
	desc: "滑动选择器。"
};
var textarea$1 = {
	type: 7,
	status: 0,
	name: "多行输入框",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/textarea.html",
		target: ""
	},
	desc: "该组件是原生组件，使用时请注意相关限制。"
};
var button$1 = {
	status: 1,
	name: "按钮",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/button.html",
		target: ""
	},
	props: {
		"open-type": {
			type: 0,
			status: 2,
			desc: "微信开放能力"
		},
		lang: {
			type: 0,
			status: 2,
			desc: "指定返回用户信息的语言，zh_CN 简体中文，zh_TW 繁体中文，en 英文。"
		},
		"session-from": {
			type: 0,
			status: 2,
			desc: "会话来源，open-type=contact时有效"
		},
		"send-message-title": {
			type: 0,
			status: 2,
			desc: "会话内消息卡片标题，open-type=contact时有效"
		},
		"send-message-path": {
			type: 0,
			status: 2,
			desc: "会话内消息卡片点击跳转小程序路径，open-type=contact时有效"
		},
		"send-message-img": {
			type: 0,
			status: 2,
			desc: "会话内消息卡片图片，open-type=contact时有效"
		},
		"app-parameter": {
			type: 0,
			status: 2,
			desc: "打开 APP 时，向 APP 传递的参数，open-type=launchApp时有效"
		},
		"show-message-card": {
			type: 0,
			status: 2,
			desc: "是否显示会话内消息卡片，设置此参数为 true，用户进入客服会话会在右下角显示'可能要发送的小程序'提示"
		},
		bindgetuserinfo: {
			type: 0,
			status: 2,
			desc: "用户点击该按钮时，会返回获取到的用户信息，回调的detail数据与wx.getUserInfo返回的一致，open-type=getUserInfo时有效"
		},
		bindcontact: {
			type: 0,
			status: 2,
			desc: "客服消息回调，open-type=contact时有效"
		},
		bindgetphonenumber: {
			type: 0,
			status: 2,
			desc: "获取用户手机号回调，open-type=getPhoneNumber时有效"
		},
		binderror: {
			type: 0,
			status: 2,
			desc: "当使用开放能力时，发生错误的回调，open-type=launchApp时有效"
		},
		bindopensetting: {
			type: 0,
			status: 2,
			desc: "在打开授权设置页后回调，open-type=openSetting时有效"
		},
		bindlaunchapp: {
			type: 0,
			status: 2,
			desc: "打开 APP 成功的回调，open-type=launchApp时有效"
		},
		bindchooseavatar: {
			type: 0,
			status: 2,
			desc: "获取用户头像回调，open-type=chooseAvatar时有效"
		}
	},
	desc: "按钮"
};
var editor = {
	name: "富文本编辑器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/editor.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "富文本编辑器，可以对图片、文字进行编辑"
};
var label$1 = {
	name: "用于改进表单组件的可用性",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/label.html",
		target: ""
	},
	type: 7,
	status: 0,
	desc: "用于改进表单组件的可用性"
};
var form$4 = {
	"checkbox-group": {
	type: 7,
	status: 0,
	name: "多项选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/checkbox-group.html",
		target: ""
	},
	desc: "多项选择器，内部由多个checkbox组成。"
},
	checkbox: checkbox$1,
	form: form$3,
	input: input$1,
	picker: picker$1,
	"picker-view": {
	status: 1,
	name: "嵌入页面的滚动选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/picker-view.html",
		target: ""
	},
	props: {
		"immediate-change": {
			type: 0,
			status: 2,
			desc: "是否在手指松开时立即触发 change 事件。若不开启则会在滚动动画结束后触发 change 事件。"
		}
	},
	desc: "其中只可放置 picker-view-column组件，其它节点不会显示。"
},
	"picker-view-column": {
	type: 7,
	status: 0,
	name: "滚动选择器子项",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/picker-view-column.html",
		target: ""
	},
	desc: "仅可放置于picker-view中，其孩子节点的高度会自动设置成与picker-view的选中框的高度一致"
},
	radio: radio$1,
	"radio-group": {
	type: 7,
	status: 0,
	name: "单项选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/radio-group.html",
		target: ""
	},
	desc: "单项选择器，内部由多个 radio 组成。"
},
	slider: slider$1,
	"switch": {
	type: 7,
	status: 0,
	name: "开关选择器",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/switch.html",
		target: ""
	},
	desc: "开关选择器。"
},
	textarea: textarea$1,
	button: button$1,
	editor: editor,
	label: label$1
};

var form$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	checkbox: checkbox$1,
	form: form$3,
	input: input$1,
	picker: picker$1,
	radio: radio$1,
	slider: slider$1,
	textarea: textarea$1,
	button: button$1,
	editor: editor,
	label: label$1,
	'default': form$4
});

var navigator$3 = {
	status: 1,
	name: "页面链接",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html",
		target: ""
	},
	props: {
		target: {
			type: 0,
			status: 2,
			desc: "在哪个目标上发生跳转，默认当前小程序"
		},
		"app-id": {
			type: 0,
			status: 2,
			desc: "当`target=miniProgram`时有效，要打开的小程序 appId"
		},
		path: {
			type: 0,
			status: 2,
			desc: "当`target=miniProgram`时有效，打开的页面路径，如果为空则打开首页"
		},
		"extra-data": {
			type: 0,
			status: 2,
			desc: "当`target=miniProgram`时有效，需要传递给目标小程序的数据，目标小程序可在 `App.onLaunch()`，`App.onShow()` 中获取到这份数据。"
		},
		version: {
			type: 0,
			status: 2,
			desc: "当`target=miniProgram`时有效，要打开的小程序版本"
		},
		"short-link": {
			type: 0,
			status: 2,
			desc: "当`target=miniProgram`时有效，当传递该参数后，可以不传 app-id 和 path。链接可以通过【小程序菜单】->【复制链接】获取"
		}
	},
	desc: "页面链接。"
};
var navigator$4 = {
	navigator: navigator$3,
	"functional-page-navigator": {
	name: "仅在插件中有效，用于跳转到插件功能页",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/functional-page-navigator.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "仅在插件中有效，用于跳转到插件功能页"
}
};

var navigator$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	navigator: navigator$3,
	'default': navigator$4
});

var audio$1 = {
	type: 7,
	status: 0,
	name: "音频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/audio.html",
		target: ""
	},
	desc: "1.6.0版本开始，该组件不再维护。建议使用能力更强的 wx.createInnerAudioContext 接口"
};
var image$1 = {
	status: 1,
	name: "图片",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/image.html",
		target: ""
	},
	props: {
		"lazy-load": {
			type: 0,
			status: 2,
			desc: "图片懒加载，在即将进入一定范围（上下三屏）时才开始加载"
		},
		"show-menu-by-longpress": {
			type: 0,
			status: 2,
			desc: "长按图片显示发送给朋友、收藏、保存图片、搜一搜、打开名片/前往群聊/打开小程序（若图片中包含对应二维码或小程序码）的菜单。"
		}
	},
	desc: "支持JPG、PNG、SVG格式，2.3.0 起支持云文件ID。"
};
var camera$1 = {
	type: 0,
	status: 2,
	name: "系统相机",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/camera.html",
		target: ""
	},
	desc: "扫码二维码功能，需升级微信客户端至6.7.3。需要用户授权 scope.camera。相关api：wx.createCameraContext"
};
var video$1 = {
	status: 1,
	name: "视频",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/video.html",
		target: ""
	},
	props: {
		"page-gesture": {
			type: 0,
			status: 2,
			desc: "在非全屏模式下，是否开启亮度与音量调节手势（废弃，见 vslide-gesture）"
		},
		"show-progress": {
			type: 0,
			status: 2,
			desc: "若不设置，宽度大于240时才会显示"
		},
		"show-fullscreen-btn": {
			type: 0,
			status: 2,
			desc: "是否显示全屏按钮"
		},
		"show-play-btn": {
			type: 0,
			status: 2,
			desc: "是否显示视频底部控制栏的播放按钮"
		},
		"show-center-play-btn": {
			type: 0,
			status: 2,
			desc: "是否显示视频中间的播放按钮"
		},
		"enable-progress-gesture": {
			type: 0,
			status: 2,
			desc: "是否开启控制进度的手势"
		},
		"show-mute-btn": {
			type: 0,
			status: 2,
			desc: "是否显示静音按钮"
		},
		title: {
			type: 0,
			status: 2,
			desc: "视频的标题，全屏时在顶部展示"
		},
		"play-btn-position": {
			type: 0,
			status: 2,
			desc: "播放按钮的位置"
		},
		"enable-play-gesture": {
			type: 0,
			status: 2,
			desc: "是否开启播放手势，即双击切换"
		},
		"auto-pause-if-navigate": {
			type: 0,
			status: 2,
			desc: "当跳转到本小程序的其他页面时，是否自动暂停本页面的视频播放"
		},
		"auto-pause-if-open-native": {
			type: 0,
			status: 2,
			desc: "当跳转到其它微信原生页面时，是否自动暂停本页面的视频"
		},
		"vslide-gesture": {
			type: 0,
			status: 2,
			desc: "在非全屏模式下，是否开启亮度与音量调节手势（同 page-gesture）"
		},
		"vslide-gesture-in-fullscreen": {
			type: 0,
			status: 2,
			desc: "在全屏模式下，是否开启亮度与音量调节手势"
		},
		"ad-unit-id": {
			type: 0,
			status: 2,
			desc: "视频前贴广告单元ID，更多详情可参考开放能力视频前贴广告"
		},
		"poster-for-crawler": {
			type: 0,
			status: 2,
			desc: "用于给搜索等场景作为视频封面展示，建议使用无播放 icon 的视频封面图，只支持网络地址"
		},
		"show-casting-button": {
			type: 0,
			status: 2,
			desc: "显示投屏按钮。安卓在同层渲染下生效，支持 DLNA 协议；iOS 支持 AirPlay 和 DLNA 协议"
		},
		"picture-in-picture-mode": {
			type: 0,
			status: 2,
			desc: "设置小窗模式： push, pop，空字符串或通过数组形式设置多种模式（如： [push, pop]）"
		},
		"picture-in-picture-show-progress": {
			type: 0,
			status: 2,
			desc: "是否在小窗模式下显示播放进度"
		},
		"enable-auto-rotation": {
			type: 0,
			status: 2,
			desc: "是否开启手机横屏时自动全屏，当系统设置开启自动旋转时生效"
		},
		"show-screen-lock-button": {
			type: 0,
			status: 2,
			desc: "是否显示锁屏按钮，仅在全屏时显示，锁屏后控制栏的操作"
		},
		"show-snapshot-button": {
			type: 0,
			status: 2,
			desc: "是否显示截屏按钮，仅在全屏时显示"
		},
		"show-background-playback-button": {
			type: 0,
			status: 2,
			desc: "是否展示后台音频播放按钮"
		},
		"background-poster": {
			type: 0,
			status: 2,
			desc: "进入后台音频播放后的通知栏图标（Android 独有）"
		},
		"referrer-policy": {
			type: 0,
			status: 2,
			desc: ""
		},
		"is-drm": {
			type: 0,
			status: 2,
			desc: "是否是 DRM 视频源"
		},
		"provision-url": {
			type: 0,
			status: 2,
			desc: "DRM 设备身份认证 url，仅 is-drm 为 true 时生效 (Android)"
		},
		"certificate-url": {
			type: 0,
			status: 2,
			desc: "DRM 设备身份认证 url，仅 is-drm 为 true 时生效 (iOS)"
		},
		"license-url": {
			type: 0,
			status: 2,
			desc: "DRM 获取加密信息 url，仅 is-drm 为 true 时生效"
		}
	},
	desc: "相关api：wx.createVideoContext"
};
var media$4 = {
	audio: audio$1,
	image: image$1,
	camera: camera$1,
	"live-player": {
	name: "实时音视频播放",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "实时音视频播放"
},
	"live-pusher": {
	name: "实时音视频录制",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/live-pusher.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "实时音视频录制"
},
	video: video$1
};

var media$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	audio: audio$1,
	image: image$1,
	camera: camera$1,
	video: video$1,
	'default': media$4
});

var map$3 = {
	name: "地图",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/map.html",
		target: ""
	}
};
var map$4 = {
	map: map$3
};

var map$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	map: map$3,
	'default': map$4
});

var canvas$3 = {
	name: "画布",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html",
		target: ""
	},
	type: 0,
	status: 2
};
var canvas$4 = {
	canvas: canvas$3
};

var canvas$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	canvas: canvas$3,
	'default': canvas$4
});

var ad = {
	name: "Banner 广告",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/ad.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "Banner 广告"
};
var openAbility$4 = {
	ad: ad,
	"official-account": {
	name: "公众号关注组件",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/official-account.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "当用户扫小程序码打开小程序时，开发者可在小程序内配置公众号关注组件，方便用户快捷关注公众号，可嵌套在原生组件内"
},
	"open-data": {
	name: "用于展示微信开放的数据",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/open-data.html",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "用于展示微信开放的数据"
},
	"web-view": {
	status: 1,
	name: "组件用于承载 H5 网页，自动铺满整个小程序页面",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html",
		target: ""
	},
	props: {
		bindmessage: {
			type: 0,
			status: 2,
			desc: "网页向小程序 postMessage 时，会在特定时机（小程序后退、组件销毁、分享）触发并收到消息。e.detail = { data }，data是多次 postMessage 的参数组成的数组"
		}
	},
	desc: "会自动铺满整个小程序页面，个人类型的小程序暂不支持使用。客户端 6.7.2 版本开始，navigationStyle: custom 对 web-view 组件无效"
}
};

var openAbility$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	ad: ad,
	'default': openAbility$4
});

var modal = {
	type: 0,
	status: 2,
	name: "模态弹窗",
	url: {
		original: "",
		target: ""
	},
	desc: "模态弹窗。"
};
var toast = {
	type: 0,
	status: 2,
	name: "消息提示框",
	url: {
		original: "",
		target: ""
	},
	desc: "消息提示框。"
};
var loading = {
	type: 0,
	status: 2,
	name: "加载提示",
	url: {
		original: "",
		target: ""
	},
	desc: "加载提示。"
};
var interaction = {
	modal: modal,
	toast: toast,
	loading: loading,
	"action-sheet": {
	type: 0,
	status: 2,
	name: "从屏幕底部出现的菜单表",
	url: {
		original: "",
		target: ""
	},
	desc: "从屏幕底部出现的菜单表。"
},
	"action-sheet-item": {
	type: 0,
	status: 2,
	name: "底部菜单表的子选项",
	url: {
		original: "",
		target: ""
	},
	desc: "底部菜单表的子选项。"
},
	"action-sheet-cancel": {
	type: 0,
	status: 2,
	name: "底部菜单表的取消按钮",
	url: {
		original: "",
		target: ""
	},
	desc: "底部菜单表的取消按钮，和action-sheet-item的区别是，点击它会触发action-sheet的change事件，并且外观上会同它上面的内容间隔开来。"
}
};

var interaction$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	modal: modal,
	toast: toast,
	loading: loading,
	'default': interaction
});

var require$$0$2 = getCjsExportFromNamespace(view$7);

var require$$1$2 = getCjsExportFromNamespace(basic$5);

var require$$2$2 = getCjsExportFromNamespace(form$5);

var require$$3$2 = getCjsExportFromNamespace(navigator$5);

var require$$4$2 = getCjsExportFromNamespace(media$5);

var require$$5$2 = getCjsExportFromNamespace(map$5);

var require$$6$2 = getCjsExportFromNamespace(canvas$5);

var require$$7$2 = getCjsExportFromNamespace(openAbility$5);

var require$$8$2 = getCjsExportFromNamespace(interaction$1);

const ComponentsInfo$1 = [{
  name: '视图容器',
  type: 'view',
  body: require$$0$2
}, {
  name: '基础内容',
  type: 'basic',
  body: require$$1$2
}, {
  name: '表单组件',
  type: 'form',
  body: require$$2$2
}, {
  name: '导航',
  type: 'navigator',
  body: require$$3$2
}, {
  name: '媒体组件',
  type: 'media',
  body: require$$4$2
}, {
  name: '地图',
  type: 'map',
  body: require$$5$2
}, {
  name: '画布',
  type: 'canvas',
  body: require$$6$2
}, {
  name: '开放能力',
  type: 'openAbility',
  body: require$$7$2
}, {
  name: '交互',
  type: 'interaction',
  body: require$$8$2
}];
let descObject$2 = {};
ComponentsInfo$1.forEach(component => {
  descObject$2 = Object.assign(descObject$2, component.body);
});
var componentsInfo$1 = {
  ComponentsInfo: ComponentsInfo$1,
  descObject: descObject$2
};
componentsInfo$1.ComponentsInfo;
componentsInfo$1.descObject;

function getLineCount$2(fileInfo, ast, tagInfo, convertorCount) {
  const {
    props
  } = ast;
  const content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf-8');
  let lineCount = 0;
  const subContent = content.substring(ast.start, ast.end);
  if (tagInfo.type === 0) {
    lineCount += subContent.split(/\n/).length;
  }
  if (tagInfo.type === 1) {
    ast.type = tagInfo.tagName || ast.type;
    ast.type;
  }
  if (tagInfo.props) {
    for (const apiProp in tagInfo.props) {
      const propInfo = tagInfo.props[apiProp];
      if (!props[apiProp]) {
        continue;
      }
      if (propInfo.type === 0) {
        const propValue = props[apiProp];
        const attrValue = propValue.value;
        const attrStart = subContent.indexOf(apiProp);
        const lastValue = attrValue[attrValue.length - 1];
        const attrEnd = subContent.indexOf(lastValue);
        const attrContent = subContent.substring(attrStart, attrEnd + lastValue.length);
        lineCount += attrContent.split(/\n/).length;
        return;
      }
      if (propInfo.type === 1) {
        // diff 命名不同的属性 重新命名
        const propValue = props[apiProp];
        delete props[apiProp];
        props[propInfo.key] = propValue;
      }
    }
  }
  convertorCount.axmlFailLineCount += lineCount;
}
var getLineCount_1 = {
  getLineCount: getLineCount$2
};

const componentMap$1 = componentsInfo$1.descObject;
const {
  getLineCount: getLineCount$1
} = getLineCount_1;
var props$1 = function (ast, fileInfo, convertorCount) {
  let {
    type
  } = ast;
  const _componentMap = componentMap$1;
  const tagInfo = _componentMap[type];
  if (tagInfo && tagInfo.type === 6) {
    ast.type = tagInfo.tagName || ast.type;
    type = ast.type;
  }
  if (tagInfo) {
    getLineCount$1(fileInfo, ast, tagInfo, convertorCount);
  }
};

const indentWidthChar = '  ';
function processTextContent(_ast) {
  if (_ast.value.match(/-->/)) {
    return '';
  }
  return `${_ast.value}`;
}
function propsHandle(key, value, type) {
  const newKey = key.replace(type, 'ma:');
  return {
    key: newKey,
    value
  };
}
function generateCode(propInf, attrCode, fileExt) {
  let attrCodeNew = attrCode;
  if (propInf.value === null) {
    // 无值属性
    attrCodeNew += ` ${propInf.key}`;
  } else {
    let value = propInf.value.value[0] || '';
    value = value.replaceAll(`.${fileExt}`, '.maml');
    if (propInf.value && propInf.value.type === 'unknown') {
      let singleIndex = value.indexOf("'");
      let doubleIndex = value.indexOf('"');
      singleIndex = singleIndex > -1 ? singleIndex : 0;
      doubleIndex = doubleIndex > -1 ? doubleIndex : 0;
      if (singleIndex > doubleIndex) {
        propInf.value.type = 'double';
      } else {
        propInf.value.type = 'single';
      }
    }
    if (propInf.value && propInf.value.type === 'double') {
      attrCodeNew += ` ${propInf.key}="${value}"`;
    } else if (value === '' || value === undefined || !value) {
      attrCodeNew += ` ${propInf.key}`;
    } else {
      attrCodeNew += ` ${propInf.key}='${value}'`;
    }
  }
  return attrCodeNew;
}
function processProps(props, translationMap, fileExt, type) {
  let attrCode = '';
  Object.keys(props).forEach(prop => {
    const propInfo = propsHandle(prop, props[prop], type);
    if (translationMap[propInfo.key]) {
      propInfo.key = translationMap[propInfo.key];
    }
    attrCode = generateCode(propInfo, attrCode, fileExt);
  });
  return attrCode;
}
function render$2(_ast, _fileInfo, indentWidth, pluginPara, cb) {
  let code = '';
  let indentWidthNew = indentWidth;
  function incIndent() {
    indentWidthNew += indentWidthChar;
  }
  function decIndent() {
    indentWidthNew = indentWidthNew.slice(0, -1 * indentWidthChar.length);
  }
  function appendCode(chars, endTag) {
    if (chars.trim().length === 0) {
      return;
    }
    if (chars.startsWith('<')) {
      if (chars.startsWith('</') && !/<\/text>/.test(chars)) {
        code += os__default["default"].EOL;
      }
      code += String(indentWidthNew) + chars;
      if (code.endsWith('</text>') || endTag) {
        code += os__default["default"].EOL;
      }
    } else if (chars.endsWith('>')) {
      if (/<\/text>/.test(chars) || code.trim().startsWith('<text')) {
        code += chars;
      } else {
        code += chars + os__default["default"].EOL;
      }
    } else {
      code += chars;
    }
  }
  let {
    props
  } = _ast;
  props = props || {};
  cb(_ast, _fileInfo, pluginPara.convertorCount, props);
  if (_ast.type === 'textContent') {
    return processTextContent(_ast);
  }
  const tagName = _ast.type;
  const children = _ast.children;
  appendCode(`<${tagName}`);
  const attrCode = processProps(props, pluginPara.translationMap, pluginPara.fileExt, pluginPara.callReg);
  if (children === undefined) {
    appendCode(`${attrCode}/>`);
  } else {
    appendCode(`${attrCode}>`);
    incIndent();
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (Array.isArray(child)) {
          child.forEach(subChild => {
            appendCode(render$2(subChild, _fileInfo, indentWidthNew, pluginPara, cb));
          });
        } else {
          appendCode(render$2(child, _fileInfo, indentWidthNew, pluginPara, cb));
        }
      });
    } else {
      appendCode(children);
    }
    decIndent();
    appendCode(`</${tagName}>`, true);
  }
  return code.replace(os__default["default"].EOL + os__default["default"].EOL, os__default["default"].EOL);
}
var generatemaml = {
  generateCode: generateCode,
  processProps: processProps,
  render: render$2
};

const translationMap$1 = convertPropMap$1.translationMap;
const {
  render: render$1
} = generatemaml;
function processWxs(_ast) {
  // sjs属性
  if (_ast.type === 'sjs') {
    if (_ast.props && _ast.props.src) {
      _ast.props.src.value.forEach((value, index) => {
        _ast.props.src.value[index] = value.replace(/\.wxs/, '.sjs');
      });
    }
  }
}
var generateMaml$1 = function wxmlRender(fileInfo, convertorCount, ast = []) {
  if (typeof ast === 'string') {
    return ast;
  }
  let _code = '';
  const indentWidth = '';
  const pluginPara = {
    convertorCount: convertorCount,
    translationMap: translationMap$1,
    fileExt: 'wxml',
    callReg: /wx:/
  };
  ast.forEach(tagAst => {
    _code += render$1(tagAst, fileInfo, indentWidth, pluginPara, (_tagAst, _fileInfo, _convertorCount, props) => {
      props$1(_tagAst, _fileInfo, convertorCount);
      processWxs(_tagAst);
    });
  });
  return _code;
};

var compileWxml = function (fileInfo, convertorCount) {
  fileInfo.dist = fileInfo.dist.replace(/\.wxml/, '.maml');
  const originCode = generateMaml$1(fileInfo, convertorCount, fileInfo.ast);
  fsExtra__default["default"].outputFileSync(fileInfo.dist, originCode);
};

const {
  magenta: magenta$2,
  gray,
  blue
} = utils;
const method = {
  report(consoleData) {
    const {
      time,
      status,
      reportData,
      after = '...',
      cycle = ''
    } = consoleData;
    logManager_1.log(`[${gray(time)}] ${status} '${blue(reportData)}' ${after} ${magenta$2(cycle)}`);
  },
  dateFormat(date, fmt) {
    let result = fmt;
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      // 季度
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) {
      result = fmt.replace(RegExp.$1, String(date.getFullYear()).substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        result = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(String(o[k]).length));
      }
    }
    return result;
  }
};
var reportMethods = {
  report(date, reportData = {}) {
    const finishiDate = Number(new Date());
    let logData = {};
    if (reportData.type === 'compile') {
      const _finishDate = new Date();
      const cycle = `${_finishDate - date}ms`;
      const time = method.dateFormat(_finishDate, 'hh:mm:ss');
      logData = {
        status: 'starting compile',
        reportData: reportData.info,
        time,
        after: 'after',
        cycle
      };
    }
    if (reportData.type === 'parse') {
      const time = method.dateFormat(date, 'hh:mm:ss');
      logData = {
        status: 'starting parse',
        reportData: reportData.info,
        time,
        after: '...',
        cycle: ''
      };
    }
    if (reportData.type === 'generate') {
      const _finishiDate = new Date();
      const cycle = `${_finishiDate - date}ms`;
      const time = method.dateFormat(_finishiDate, 'hh:mm:ss');
      logData = {
        status: 'finished generate',
        reportData: reportData.info,
        time,
        after: 'after',
        cycle
      };
    }
    method.report(logData);
    return finishiDate;
  }
};

function generateAppid() {
  return new Date().getTime();
}
var generateProjectConfig = function (output, input, appid) {
  const pathArr = input && input.split(path__default["default"].sep);
  const projectName = pathArr[pathArr.length - 1];
  const randomAppid = generateAppid();
  const appidFinal = appid || randomAppid;
  const jsonStr = `{
    "description": "Project Config File",
    "compileType": "miniprogram",
    "appid": "${appidFinal}",
    "projectname": "${projectName}",
    "setting":{
        "es5":true
    }
}`;
  const miniPath = path__default["default"].join(output, 'project.config.json');
  fsExtra__default["default"].outputFile(miniPath, jsonStr);
};

const {
  prettierCode: prettierCode$3
} = utils;
var projectConfigJson = function (ctx) {
  const configPath = `${ctx.entry}/project.config.json`;
  if (fsExtra__default["default"].existsSync(configPath)) {
    let content = fsExtra__default["default"].readFileSync(configPath, 'utf-8');
    const json = JSON.parse(content);
    if (json.setting) {
      json.setting.es5 = true;
      if (json.setting.es6) {
        delete json.setting.es6;
      }
    }
    content = JSON.stringify(json);
    content = prettierCode$3(content, 'json', {
      useTabs: true,
      tabWidth: 4
    });
    const miniPath = path__default["default"].join(ctx.output, 'project.config.json');
    fsExtra__default["default"].outputFile(miniPath, content);
  } else {
    generateProjectConfig(ctx.output, ctx.entry, ctx.$options.appid);
  }
};

var pages$1 = {
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#pages",
		target: ""
	},
	type: 7,
	status: 0,
	desc: "设置页面路径"
};
var window$2 = {
	name: "用于对小程序进行全局配置，设置页面文件的路径、窗口表现、网络超时时间、多 tab 等",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window",
		target: ""
	},
	desc: "window 用于设置小程序的状态栏、导航条、标题、窗口背景色等。",
	status: 1,
	props: {
		navigationBarBackgroundColor: {
			type: 7,
			status: 0,
			desc: "页面的背景色"
		},
		navigationBarTitleText: {
			type: 7,
			status: 0,
			desc: "页面默认标题"
		},
		enablePullDownRefresh: {
			type: 7,
			status: 0,
			desc: "是否允许下拉刷新。默认NO"
		},
		navigationStyle: {
			type: 7,
			status: 0,
			desc: "导航栏样式"
		},
		backgroundColor: {
			type: 7,
			status: 0,
			desc: "窗口的背景色"
		},
		navigationBarTextStyle: {
			type: 7,
			status: 0,
			desc: "导航栏标题颜色，仅支持 black / white",
			msg: "暂不支持"
		},
		backgroundTextStyle: {
			type: 0,
			status: 2,
			desc: "下拉 loading 的样式，仅支持 dark / light",
			msg: "暂不支持"
		},
		backgroundColorTop: {
			type: 0,
			status: 2,
			desc: "顶部窗口的背景色，仅 iOS 支持",
			msg: "暂不支持"
		},
		backgroundColorBottom: {
			type: 0,
			status: 2,
			desc: "底部窗口的背景色，仅 iOS 支持",
			msg: "暂不支持"
		},
		onReachBottomDistance: {
			type: 0,
			status: 2,
			desc: "页面上拉触底事件触发时距页面底部距离，单位为 px",
			msg: "暂不支持"
		},
		pageOrientation: {
			type: 0,
			status: 2,
			desc: "屏幕旋转设置，支持 auto / portrait / landscape",
			msg: "暂不支持"
		}
	}
};
var tabBar$1 = {
	status: 1,
	name: "底部 tab 栏的表现",
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#tabBar",
		target: ""
	},
	desc: "如果小程序是一个多 tab 应用（客户端窗口的底部或顶部有 tab 栏可以切换页面），可以通过 tabBar 配置项指定 tab 栏的表现，以及 tab 切换时显示的对应页面。",
	props: {
		color: {
			type: 7,
			status: 0,
			desc: "tab 上的文字默认颜色，仅支持十六进制颜色"
		},
		selectedColor: {
			type: 7,
			status: 0,
			desc: "选中文字颜色"
		},
		backgroundColor: {
			type: 7,
			status: 0,
			desc: "tab 的背景色，仅支持十六进制颜色"
		},
		borderStyle: {
			type: 7,
			status: 0,
			desc: "tabbar 上边框的颜色， 仅支持 black / white"
		},
		list: {
			type: 7,
			status: 0,
			desc: "tab 的列表，详见 list 属性说明，最少 2 个、最多 5 个 tab"
		},
		position: {
			type: 0,
			status: 2,
			desc: "tabBar 的位置，仅支持 bottom / top"
		},
		custom: {
			type: 0,
			status: 2,
			desc: "自定义 tabBar"
		}
	}
};
var usingComponents$2 = {
	name: "全局自定义组件配置",
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#usingComponents",
		target: ""
	},
	desc: "在此处声明的自定义组件视为全局自定义组件，在小程序内的页面或自定义组件中可以直接使用而无需再声明。"
};
var networkTimeout = {
	name: "网络超时时间",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#networkTimeout",
		target: ""
	},
	desc: "各类网络请求的超时时间，单位均为毫秒。"
};
var debug = {
	name: "是否开启 debug 模式，默认关闭",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#debug",
		target: ""
	},
	desc: "可以在开发者工具中开启 debug 模式，在开发者工具的控制台面板，调试信息以 info 的形式给出，其信息有 Page 的注册，页面路由，数据更新，事件触发等。可以帮助开发者快速定位一些常见的问题"
};
var functionalPages = {
	name: "是否启用插件功能页，默认关闭",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#functionalPages",
		target: ""
	},
	desc: "插件所有者小程序需要设置这一项来启用插件功能页。"
};
var subpackages = {
	name: "分包结构配置",
	status: 1,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#subpackages",
		target: ""
	},
	props: {
		root: {
			type: 7,
			status: 0,
			desc: "分包根目录"
		},
		name: {
			type: 0,
			status: 2,
			desc: "分包别名，分包预下载时可以使用"
		},
		pages: {
			type: 7,
			status: 0,
			desc: "分包页面路径，相对与分包根目录"
		},
		independent: {
			type: 0,
			status: 2,
			desc: "分包是否是独立分包"
		}
	},
	desc: "启用分包加载时，声明项目分包结构。"
};
var workers = {
	name: "Worker 代码放置的目录",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#workers",
		target: ""
	},
	desc: "使用 Worker 处理多线程任务时，设置 Worker 代码放置的目录"
};
var requiredBackgroundModes = {
	name: "需要在后台使用的能力，如「音乐播放」",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#requiredBackgroundModes",
		target: ""
	},
	desc: "申明需要后台运行的能力，类型为数组。目前支持以下项目：audio后台音乐播放"
};
var plugins = {
	name: "使用到的插件",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#plugins",
		target: ""
	},
	desc: "声明小程序需要使用的插件。"
};
var preloadRule = {
	name: "分包预下载规则",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#preloadRule",
		target: ""
	},
	desc: "声明分包预下载的规则"
};
var resizable = {
	name: "iPad 小程序是否支持屏幕旋转，默认关闭",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#resizable",
		target: ""
	},
	desc: "在 iPad 上运行的小程序可以设置支持屏幕旋转。"
};
var navigateToMiniProgramAppIdList = {
	name: "需要跳转的小程序列表，详见 wx.navigateToMiniProgram",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#navigateToMiniProgramAppIdList",
		target: ""
	},
	desc: "当小程序需要使用 wx.navigateToMiniProgram 接口跳转到其他小程序时，需要先在配置文件中声明需要跳转的小程序 appId 列表，最多允许填写 10 个"
};
var permission = {
	name: "小程序接口权限相关设置",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#permission",
		target: ""
	},
	desc: "小程序接口权限相关设置。字段类型为 Object"
};
var sitemapLocation = {
	name: "指明 sitemap.json 的位置",
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#sitemapLocation",
		target: ""
	},
	desc: "指明 sitemap.json 的位置"
};
var globalconfig$4 = {
	pages: pages$1,
	window: window$2,
	tabBar: tabBar$1,
	usingComponents: usingComponents$2,
	networkTimeout: networkTimeout,
	debug: debug,
	functionalPages: functionalPages,
	subpackages: subpackages,
	workers: workers,
	requiredBackgroundModes: requiredBackgroundModes,
	plugins: plugins,
	preloadRule: preloadRule,
	resizable: resizable,
	navigateToMiniProgramAppIdList: navigateToMiniProgramAppIdList,
	permission: permission,
	sitemapLocation: sitemapLocation
};

var globalconfig$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	pages: pages$1,
	window: window$2,
	tabBar: tabBar$1,
	usingComponents: usingComponents$2,
	networkTimeout: networkTimeout,
	debug: debug,
	functionalPages: functionalPages,
	subpackages: subpackages,
	workers: workers,
	requiredBackgroundModes: requiredBackgroundModes,
	plugins: plugins,
	preloadRule: preloadRule,
	resizable: resizable,
	navigateToMiniProgramAppIdList: navigateToMiniProgramAppIdList,
	permission: permission,
	sitemapLocation: sitemapLocation,
	'default': globalconfig$4
});

var navigationBarBackgroundColor = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "导航栏背景颜色，如 #000000"
};
var navigationBarTextStyle = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "导航栏标题颜色，仅支持 black / white"
};
var navigationBarTitleText = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "导航栏标题文字内容"
};
var navigationStyle = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "导航栏样式，仅支持以下值，default 默认样式,custom 自定义导航栏，只保留右上角胶囊按钮"
};
var enablePullDownRefresh = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "是否开启当前页面下拉刷新。详见 Page.onPullDownRefresh"
};
var usingComponents$1 = {
	type: 7,
	status: 0,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "页面自定义组件配置"
};
var backgroundColor$1 = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "窗口的背景色"
};
var backgroundTextStyle = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "下拉 loading 的样式，仅支持 dark / light"
};
var backgroundColorTop = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "顶部窗口的背景色，仅 iOS 支持"
};
var backgroundColorBottom = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "底部窗口的背景色，仅 iOS 支持"
};
var onReachBottomDistance = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "页面上拉触底事件触发时距页面底部距离，单位为px。详见 Page.onReachBottom"
};
var pageOrientation = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "屏幕旋转设置，支持 auto / portrait / landscape 详见 响应显示区域变化"
};
var disableScroll = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "设置为 true 则页面整体不能上下滚动。只在页面配置中有效，无法在 app.json 中设置"
};
var disableSwipeBack = {
	type: 0,
	status: 2,
	url: {
		original: "https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html",
		target: ""
	},
	desc: "禁止页面右滑手势返回"
};
var pageconfig$4 = {
	navigationBarBackgroundColor: navigationBarBackgroundColor,
	navigationBarTextStyle: navigationBarTextStyle,
	navigationBarTitleText: navigationBarTitleText,
	navigationStyle: navigationStyle,
	enablePullDownRefresh: enablePullDownRefresh,
	usingComponents: usingComponents$1,
	backgroundColor: backgroundColor$1,
	backgroundTextStyle: backgroundTextStyle,
	backgroundColorTop: backgroundColorTop,
	backgroundColorBottom: backgroundColorBottom,
	onReachBottomDistance: onReachBottomDistance,
	pageOrientation: pageOrientation,
	disableScroll: disableScroll,
	disableSwipeBack: disableSwipeBack
};

var pageconfig$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	navigationBarBackgroundColor: navigationBarBackgroundColor,
	navigationBarTextStyle: navigationBarTextStyle,
	navigationBarTitleText: navigationBarTitleText,
	navigationStyle: navigationStyle,
	enablePullDownRefresh: enablePullDownRefresh,
	usingComponents: usingComponents$1,
	backgroundColor: backgroundColor$1,
	backgroundTextStyle: backgroundTextStyle,
	backgroundColorTop: backgroundColorTop,
	backgroundColorBottom: backgroundColorBottom,
	onReachBottomDistance: onReachBottomDistance,
	pageOrientation: pageOrientation,
	disableScroll: disableScroll,
	disableSwipeBack: disableSwipeBack,
	'default': pageconfig$4
});

var globalconfig$3 = getCjsExportFromNamespace(globalconfig$5);

var pageconfig$3 = getCjsExportFromNamespace(pageconfig$5);

/**
 * type
 * 0 - missing - 不支持该属性
 * 1 - diff - 命名及格式不同
 * 3 - diffType - 类型不同
 * 4 - defaultValue - 默认值不同
 * 6 - diff tagName
 * 7 - equal - 完全支持
 *
 * status - 支持程度
 * 0 - 完整支持
 * 1 - 部分支持
 * 2 - 不支持
 */

var config$1 = {
  components: componentsInfo$1,
  apis: apiInfo_1$1,
  globalconfig: globalconfig$3,
  pageconfig: pageconfig$3
};
config$1.components;
config$1.apis;
config$1.globalconfig;
config$1.pageconfig;

const {
  emptyFiles: emptyFiles$1,
  isTypeFile: isTypeFile$1,
  red: red$2,
  magenta: magenta$1
} = utils;
const {
  record: record$2
} = utils;

// PAI等配置文件

const project$1 = {
  name: '',
  path: '',
  distPath: '',
  fileNum: 0,
  pageNum: 0
};
const {
  report: report$2
} = reportMethods;
const statFileNameArr$1 = [];
let readtimes$1 = 0;
let finishFile$1 = 0;
const convertorCount$1 = {
  axmlFailLineCount: 0,
  jsFailLineCount: 0,
  jsonFailLineCount: 0,
  fileTotalLineCount: 0
};
let projectParents$1 = '';
// 输出日志数据
let repData$2 = {};
function isWechatApp(dirname, ifComponent) {
  if (ifComponent) {
    return true;
  }
  const appJs = path__default["default"].join(dirname, './app.js');
  const appCss = path__default["default"].join(dirname, './app.wxss');
  const appJson = path__default["default"].join(dirname, './app.json');
  return fsExtra__default["default"].pathExistsSync(appJs) && fsExtra__default["default"].pathExistsSync(appCss) && fsExtra__default["default"].pathExistsSync(appJson);
}
function compilingJson$1(fileInfo) {
  const {
    getJsonDiff,
    getOthersFile
  } = record$2(config$1);
  let content;
  const pathArr = fileInfo.path.split(projectParents$1);
  const pathInfo = pathArr[pathArr.length - 1].substr(1);
  if (fileInfo.deep === 0 && fileInfo.filename === 'app.json') {
    content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    content = content.replace(/\"subpackages\"\s*:/g, '"subPackages":');
    const app = JSON.parse(content);
    let dirnameArr = fileInfo.dirname.split('/');
    if (dirnameArr.length <= 1) {
      dirnameArr = dirnameArr[0].split(path__default["default"].sep);
    }
    try {
      project$1.name = app.window.navigationBarTitleText || dirnameArr[dirnameArr.length - 1];
    } catch (err) {
      project$1.name = dirnameArr[dirnameArr.length - 1];
    }
    const jsonData = getJsonDiff(pathInfo, content, convertorCount$1);
    repData$2.transforms = Object.assign(repData$2.transforms, jsonData);
    const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
  } else if (fileInfo.extname === '.json') {
    content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    const jsonData = getJsonDiff(pathInfo, content, convertorCount$1);
    repData$2.transforms = Object.assign(repData$2.transforms, jsonData);
    const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
  } else {
    const otherData = getOthersFile(pathInfo);
    repData$2.transforms = Object.assign(repData$2.transforms, otherData);
    content = fsExtra__default["default"].readFileSync(fileInfo.path);
  }
  fsExtra__default["default"].outputFileSync(fileInfo.dist, content);
  const reportData = {
    info: pathInfo,
    type: 'compile',
    length: project$1.fileNum,
    nums: finishFile$1
  };
  report$2(new Date(), reportData);
}
function reportPathInfo(fileInfo, reportData, pathInfo, date) {
  if (!fileInfo.parent) {
    readtimes$1 = 0;
    let pathArrNew = fileInfo.path.split(path__default["default"].sep);
    pathArrNew = [...new Set(pathArrNew)];
    projectParents$1 = pathArrNew[pathArrNew.length - 3] || '';
    reportData.info = pathInfo;
    report$2(date, reportData);
  }
  if (fileInfo.parent && statFileNameArr$1.indexOf(fileInfo.dirname) === -1) {
    reportData.info = fileInfo.dirname.split(projectParents$1)[1].substr(1);
    report$2(date, reportData);
    statFileNameArr$1.push(fileInfo.dirname);
    readtimes$1 = 0;
  }
  readtimes$1++;
}
const exportObj$2 = {
  defaultOptions: {
    exclude: ['node_modules', 'miniprogram_npm'],
    remote: false
  },
  beforeParse(next) {
    if (!isWechatApp(this.$options.entry)) {
      const errStr = `[Ops] ${this.$options.entry} is not a weixin miniproramm directory.`;
      logManager_1.log(red$2(errStr));
      throw new Error(errStr);
    }
    const pathArr = this.$options.entry.split(path__default["default"].sep);
    projectParents$1 = pathArr[pathArr.length - 3];
    project$1.fileNum = 0;
    next();
  },
  onParsing(fileInfo) {
    const {
      resultDataInit
    } = record$2();
    repData$2 = resultDataInit();
    if (fileInfo.type === 'file') {
      project$1.fileNum++;
      if (fileInfo.filename === 'app.json') {
        project$1.path = fileInfo.dirname;
        const distPath = fileInfo.dist.split('app.json')[0];
        project$1.distPath = path__default["default"].join(distPath.substr(0, distPath.length - 1));
      }
    }
    if (isTypeFile$1('.wxml', fileInfo.path)) {
      fileInfo.ast = parse_1$1.parseFile(fileInfo.path);
    }
  },
  onCompiling(fileInfo, ctx) {
    const {
      getTemplateDataDiff,
      getStyleData,
      getScriptData,
      getCustomScript
    } = record$2(config$1);
    const pathArr = fileInfo.path.split(projectParents$1);
    const pathInfo = pathArr[pathArr.length - 1].substr(1);
    if (fileInfo.type !== 'file') {
      fsExtra__default["default"].ensureDirSync(fileInfo.dist);
      return;
    }
    let date = new Date();
    const reportData = {
      info: fileInfo.dirname,
      type: 'parse',
      length: project$1.fileNum,
      nums: finishFile$1
    };
    reportPathInfo(fileInfo, reportData, pathInfo, date);
    if (isTypeFile$1('.wxml', fileInfo.path)) {
      const projectname = fileInfo.entry;
      const reptempData = getTemplateDataDiff(fileInfo, projectname);
      compileWxml(fileInfo, convertorCount$1);
      const _reportData = {
        info: pathInfo,
        type: 'compile',
        length: project$1.fileNum,
        nums: finishFile$1
      };
      date = report$2(date, _reportData);
      repData$2.transforms = Object.assign(repData$2.transforms, reptempData);
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile$1('.wxss', fileInfo.path)) {
      compileWxss(fileInfo);
      const _reportData = {
        info: pathInfo,
        type: 'compile',
        length: project$1.fileNum,
        nums: finishFile$1
      };
      date = report$2(date, _reportData);
      const reptempData = getStyleData(pathInfo);
      repData$2.transforms = Object.assign(repData$2.transforms, reptempData);
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile$1('.js', fileInfo.path)) {
      const pathinfo = pathInfo;
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      const apis = {};
      const apisLine = {};
      compileJs$1(fileInfo, originCode, apis, apisLine);
      const _reportData = {
        info: pathinfo,
        type: 'compile',
        length: project$1.fileNum,
        nums: finishFile$1
      };
      date = report$2(date, _reportData);
      const reptempData = getScriptData(pathinfo, apis, originCode);
      repData$2.transforms = Object.assign(repData$2.transforms, reptempData);
      let count = 0;
      Object.keys(apisLine).forEach(apiName => {
        const api = apisLine[apiName];
        if (api.start && api.end) {
          count += originCode.substring(api.start, api.end).split(/\n/).length;
        }
      });
      convertorCount$1.jsFailLineCount += count;
      convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile$1('.wxs', fileInfo.path)) {
      const pathinfo = pathInfo;
      const reptempData = getCustomScript(pathinfo);
      repData$2.transforms = Object.assign(repData$2.transforms, reptempData);
      const _reportData = {
        info: pathinfo,
        type: 'compile',
        length: project$1.fileNum,
        nums: finishFile$1
      };
      date = report$2(date, _reportData);
      const content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8') || '';
      fsExtra__default["default"].outputFileSync(fileInfo.dist.replace(/\.wxs$/, '.sjs'), content);
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      convertorCount$1.fileTotalLineCount += originCode.split(/\n/).length;
    } else {
      compilingJson$1(fileInfo);
    }
    finishFile$1++;
    const generateData = {
      info: pathInfo,
      type: 'generate',
      length: project$1.fileNum,
      nums: finishFile$1
    };
    if (!fileInfo.parent) {
      report$2(date, generateData);
      return;
    }
    if (readtimes$1 === fileInfo.parent ? fileInfo.parent.children.length : undefined) {
      generateData.info = pathInfo;
      report$2(date, generateData);
    }
  },
  compiled(ctx) {
    projectConfigJson(ctx);
    const {
      statisticsAndReport
    } = record$2();
    statisticsAndReport(project$1, repData$2, ctx.output, convertorCount$1, this.$options.isAutoOpenReport, this.$options.extensionPath, this.$options.lan);
    logManager_1.log(`js文件转换失败行数：    ${magenta$1(convertorCount$1.jsFailLineCount)}`);
    logManager_1.log(`wxml文件转换失败行数：  ${magenta$1(convertorCount$1.axmlFailLineCount)}`);
    logManager_1.log(`wxss文件转换失败行数：  ${magenta$1(0)}`);
    logManager_1.log(`json文件转换失败行数：  ${magenta$1(convertorCount$1.jsonFailLineCount)}`);
    logManager_1.log(`转换文件总行数：        ${magenta$1(convertorCount$1.fileTotalLineCount)}`);
  }
};
var lifecycle$2 = exportObj$2;

var wxMaclePlugin = {
  name: 'wx-macle',
  lifeCycles: lifecycle$2
};
wxMaclePlugin.name;
wxMaclePlugin.lifeCycles;

var wxMacle = function (sourceDir, targetDir, isAutoOpenReport = true, extensionPath = '', lan = 'zh') {
  const App = convertor$1();
  App.use(wxMaclePlugin, {
    entry: sourceDir,
    dist: targetDir,
    type: 'wx-macle',
    isAutoOpenReport,
    extensionPath,
    lan
  }).start();
};

const {
  parseString
} = parseml();
function parseFile(filename) {
  return parseString(fs__default["default"].readFileSync(filename, 'utf8'));
}
var parse_1 = {
  parseFile,
  parseString
};

var view$2 = {
	name: "视图容器",
	url: {
		original: "https://docs.alipay.com/mini/component/view",
		target: ""
	},
	desc: "视图容器",
	props: {
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		"hover-class": {
			type: 7,
			status: 0,
			desc: "点击时添加的样式类"
		},
		"disable-scroll": {
			type: 0,
			status: 2,
			desc: "是否阻止区域内滚动页面"
		},
		"hover-stay-time": {
			type: 7,
			status: 0,
			desc: "手指松开后点击态保留时间，单位毫秒"
		},
		"hover-start-time": {
			type: 7,
			status: 0,
			desc: "按住后多久出现点击态，单位毫秒"
		},
		"class": {
			type: 7,
			status: 0,
			desc: "自定义样式名"
		},
		hidden: {
			type: 0,
			status: 2,
			desc: "是否隐藏"
		},
		"hover-stop-propagation": {
			type: 7,
			status: 0,
			desc: "是否阻止当前元素的祖先元素出现点击态"
		},
		style: {
			type: 7,
			status: 0,
			desc: "内联样式"
		},
		onDisappear: {
			type: 0,
			status: 2,
			desc: "当前元素从可见变为不可见时触发"
		},
		onAppear: {
			type: 0,
			status: 2,
			desc: "当前元素可见时触发"
		},
		"onFirstAppear ": {
			type: 0,
			status: 2,
			desc: "当前元素首次可见时触发"
		}
	}
};
var swiper = {
	name: "滑块视图容器",
	url: {
		original: "https://docs.alipay.com/mini/component/swiper",
		target: ""
	},
	desc: "其中只可放置swiper-item组件，否则会导致未定义的行为。",
	props: {
		"indicator-dots": {
			type: 7,
			status: 0,
			desc: "是否显示面板指示点"
		},
		"indicator-active-color": {
			type: 7,
			status: 0,
			desc: "当前选中的指示点颜色"
		},
		"indicator-color": {
			type: 7,
			status: 0,
			desc: "指示点颜色"
		},
		current: {
			type: 7,
			status: 0,
			desc: "当前所在滑块的index"
		},
		autoplay: {
			type: 7,
			status: 0,
			desc: "是否自动切换"
		},
		interval: {
			type: 7,
			status: 0,
			desc: "自动切换时间间隔"
		},
		duration: {
			type: 7,
			status: 0,
			desc: "滑动动画时长"
		},
		vertical: {
			type: 7,
			status: 0,
			desc: "滑动方向是否为纵向"
		},
		circular: {
			type: 7,
			status: 0,
			desc: "是否启用无限滑动"
		},
		"next-margin": {
			type: 7,
			status: 0,
			desc: "后边距，单位px，1.9.0暂时只支持水平方向"
		},
		"previous-margin": {
			type: 7,
			status: 0,
			desc: "前边距，单位px，1.9.0暂时只支持水平方向"
		},
		"disable-programmatic-animation": {
			type: 0,
			status: 2,
			desc: "是否禁用代码变动触发 swiper 切换时使用动画"
		},
		acceleration: {
			type: 0,
			status: 2,
			desc: "当开启时，会根据滑动速度，连续滑动多屏"
		},
		onTransition: {
			type: 1,
			status: 1,
			desc: "swiper 中 swiper-item 的位置发生改变时会触发 transition 事件",
			key: "bindtransition"
		},
		onChange: {
			type: 1,
			status: 1,
			desc: "current 改变时会触发 change 事件，event.detail = {current, isChanging}",
			key: "bindchange"
		},
		onAnimationEnd: {
			type: 1,
			status: 1,
			desc: "动画结束时会触发 animationEnd 事件",
			key: "bindanimationfinish"
		},
		"disable-touch": {
			type: 0,
			status: 2,
			desc: "是否禁止用户 touch 操作"
		}
	}
};
var view$3 = {
	view: view$2,
	swiper: swiper,
	"scroll-view": {
	name: "可滚动视图区域",
	url: {
		original: "https://docs.alipay.com/mini/component/swiper",
		target: ""
	},
	desc: "使用竖向滚动时，需要给scroll-view一个固定高度，通过 WXSS 设置 height。组件属性的长度单位默认为px，2.4.0起支持传入单位(rpx/px)。",
	props: {
		style: {
			type: 7,
			status: 0,
			desc: "内联样式名"
		},
		"class": {
			type: 7,
			status: 0,
			desc: "外部样式名"
		},
		"upper-threshold": {
			type: 7,
			status: 0,
			desc: "距顶部/左边多远时（单位px），触发 scrolltoupper 事件"
		},
		"scroll-x": {
			type: 7,
			status: 0,
			desc: "允许横向滚动"
		},
		"scroll-y": {
			type: 7,
			status: 0,
			desc: "允许纵向滚动"
		},
		"lower-threshold": {
			type: 7,
			status: 0,
			desc: "距底部/右边多远时（单位px），触发 scrolltolower 事件"
		},
		"scroll-top": {
			type: 7,
			status: 0,
			desc: "设置竖向滚动条位置"
		},
		"scroll-left": {
			type: 7,
			status: 0,
			desc: "设置横向滚动条位置"
		},
		"scroll-into-view": {
			type: 7,
			status: 0,
			desc: "设置哪个方向可滚动，则在哪个方向滚动到该元素"
		},
		"scroll-with-animation": {
			type: 7,
			status: 0,
			desc: "在设置滚动条位置时使用动画过渡"
		},
		"scroll-animation-duration": {
			type: 0,
			status: 2,
			desc: "当 scroll-with-animation 设置为 true 时，可以设置 scroll-animation-duration 来控制动画的执行时间，单位ms"
		},
		"enable-back-to-top": {
			type: 7,
			status: 0,
			desc: "当点击 iOS 顶部状态栏或者双击安卓标题栏时，滚动条返回顶部，只支持竖向"
		},
		"trap-scroll": {
			type: 0,
			state: 2,
			desc: "纵向滚动时，当滚动到顶部或底部时，强制禁止触发页面滚动，仍然只触发 scroll-view 自身的滚动"
		},
		onScrollToUpper: {
			type: 1,
			status: 0,
			desc: "滚动到顶部/左边时触发",
			key: "bindscrolltoupper"
		},
		onScrollToLower: {
			type: 1,
			status: 0,
			desc: "滚动到底部/右边时触发",
			key: "bindscrolltolower"
		},
		onScroll: {
			type: 1,
			status: 0,
			desc: "滚动时触发，event.detail = {scrollLeft, scrollTop, scrollHeight, scrollWidth}",
			key: "bindscroll"
		},
		onTouchStart: {
			type: 0,
			status: 2,
			desc: "触摸动作开始"
		},
		onTouchMove: {
			type: 0,
			status: 2,
			desc: "触摸动作移动"
		},
		onTouchEnd: {
			type: 0,
			status: 2,
			desc: "触摸动作结束"
		},
		onTouchCancel: {
			type: 0,
			status: 2,
			desc: "触摸动作被打断，如来电提醒，弹窗"
		}
	}
},
	"cover-view": {
	type: 0,
	status: 2,
	name: "覆盖在原生组件之上的文本视图。",
	url: {
		original: "https://docs.alipay.com/mini/component/cover-view",
		target: ""
	},
	desc: "可覆盖的原生组件包括 map、canvas"
},
	"cover-image": {
	type: 0,
	status: 2,
	name: "覆盖在原生组件之上的图片视图",
	url: {
		original: "https://docs.alipay.com/mini/component/cover-image",
		target: ""
	},
	desc: "可覆盖的原生组件同cover-view，支持嵌套在cover-view里。"
},
	"movable-view": {
	type: 0,
	status: 2,
	name: "可移动的视图容器",
	url: {
		original: "https://docs.alipay.com/mini/component/movable-view",
		target: ""
	},
	desc: "在页面中可以拖拽滑动。movable-view必须在 movable-area 组件中，并且必须是直接子节点，否则不能移动。"
},
	"movable-area": {
	type: 0,
	status: 2,
	name: "movable-view的可移动区域",
	url: {
		original: "https://docs.alipay.com/mini/component/movable-area",
		target: ""
	},
	desc: "movable-area 必须设置 width 和 height 属性，不设置默认为 10px。"
}
};

var view$4 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	view: view$2,
	swiper: swiper,
	'default': view$3
});

var text = {
	name: "文本",
	url: {
		original: "https://docs.alipay.com/mini/component/text",
		target: ""
	},
	desc: "文本",
	props: {
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		"aria-label": {
			type: 7,
			status: 0,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		selectable: {
			type: 1,
			status: 0,
			desc: "无障碍访问，（角色）标识元素的作用",
			key: "user-select"
		},
		space: {
			type: 7,
			status: 0,
			desc: "以何种方式显示连续空格"
		},
		decode: {
			type: 7,
			status: 0,
			desc: "是否解码"
		},
		"number-of-lines": {
			type: 0,
			status: 2,
			desc: "多行省略，值须大于等于1"
		}
	}
};
var icon = {
	name: "图标",
	url: {
		original: "https://docs.alipay.com/mini/component/icon",
		target: ""
	},
	desc: "图标",
	props: {
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		type: {
			type: 7,
			status: 0,
			desc: "icon 类型"
		},
		size: {
			type: 7,
			status: 0,
			desc: "icon 大小，单位 px"
		},
		color: {
			type: 7,
			status: 0,
			desc: "icon的颜色，同css的color"
		}
	}
};
var progress = {
	name: "进度条",
	url: {
		original: "https://docs.alipay.com/mini/component/progress",
		target: ""
	},
	desc: "进度条",
	props: {
		percent: {
			type: 7,
			status: 0,
			desc: "百分比0~100"
		},
		"show-info": {
			type: 7,
			status: 0,
			desc: "在右侧显示百分比值"
		},
		"stroke-width": {
			type: 7,
			status: 0,
			desc: "进度条线的宽度"
		},
		"active-color": {
			type: 1,
			status: 0,
			desc: "已选择的进度条的颜色",
			key: "activeColor"
		},
		"background-color": {
			type: 1,
			status: 0,
			desc: "未选择的进度条的颜色",
			key: "backgroundColor"
		},
		active: {
			type: 7,
			status: 0,
			desc: "从左往右是否进行加载动画"
		}
	}
};
var basic$2 = {
	text: text,
	icon: icon,
	progress: progress,
	"rich-text": {
	type: 7,
	status: 0,
	name: "富文本",
	url: {
		original: "https://docs.alipay.com/mini/component/rich-text",
		target: ""
	},
	desc: "富文本"
}
};

var basic$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	text: text,
	icon: icon,
	progress: progress,
	'default': basic$2
});

var button = {
	name: "按钮",
	url: {
		original: "https: //docs.alipay.com/mini/component/button",
		target: ""
	},
	desc: "按钮",
	props: {
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		plain: {
			type: 7,
			status: 0,
			desc: "按钮是否镂空"
		},
		type: {
			type: 7,
			status: 0,
			desc: "按钮的样式类型，有效值 primary, default, warn"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		},
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		loading: {
			type: 7,
			status: 0,
			desc: "名称前是否带 loading 图标"
		},
		size: {
			type: 7,
			status: 0,
			desc: "按钮的大小,有效值 default, mini"
		},
		"hover-class": {
			type: 7,
			status: 0,
			desc: "指定按钮按下去的样式类。当hover-class=none时，没有点击态效果"
		},
		"hover-start-time": {
			type: 7,
			status: 0,
			desc: "按住后多少事件后出现点击状态，单位毫秒"
		},
		"hover-stay-time": {
			type: 7,
			status: 0,
			desc: "手指松开后点击状态保留时间，单位毫秒"
		},
		"hover-stop-propagation": {
			type: 7,
			status: 0,
			desc: "是否阻止当前元素的祖先元素出现点击态"
		},
		"form-type": {
			type: 7,
			status: 0,
			desc: "有效值：submit, reset，用于 form 组件，点击分别会触发 submit/reset 事件"
		},
		"open-type": {
			type: 0,
			status: 2,
			desc: "开放能力"
		},
		scope: {
			type: 0,
			status: 2,
			desc: "当 open-type 为 getAuthorize 时有效"
		},
		onTap: {
			type: 1,
			status: 0,
			desc: "点击",
			key: "bindtap"
		},
		"app-parameter": {
			type: 0,
			status: 2,
			desc: "打开 APP 时，向 APP 传递的参数，open-type=launchApp时有效"
		},
		"public-id": {
			type: 0,
			status: 2,
			desc: "生活号 id, 必须是当前小程序同主体且已关联的生活号，open-type=lifestyle 时有效"
		}
	}
};
var form = {
	name: "表单",
	url: {
		original: "https: //docs.alipay.com/mini/component/form",
		target: ""
	},
	desc: "用于将组件内的用户输入的 textarea、 switch、 input 、checkbox、slider、radio、picke 等组件提交",
	props: {
		"report-submit": {
			type: 7,
			status: 0,
			desc: "onSubmit 回调是否返回 formId，用于发送 模板消息"
		},
		onSubmit: {
			type: 1,
			status: 0,
			desc: "携带 form 中的数据触发 submit 事件",
			key: "bindsubmit"
		},
		onReset: {
			type: 1,
			status: 0,
			desc: "表单重置时会触发 reset 事件",
			key: "bindreset"
		}
	}
};
var label = {
	name: "用于改进表单组件的可用性",
	url: {
		original: "https: //docs.alipay.com/mini/component/label",
		target: ""
	},
	desc: "使用 for 属性找到对应组件的 id，或者将组件放在该标签下。当点击时，就会聚焦对应的组件",
	props: {
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		"for": {
			type: 7,
			status: 0,
			desc: "绑定组件的 id"
		},
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		}
	}
};
var input = {
	name: "输入框",
	url: {
		original: "https: //docs.alipay.com/mini/component/input",
		target: ""
	},
	desc: "输入框",
	props: {
		value: {
			type: 7,
			status: 0,
			desc: "初始内容"
		},
		name: {
			type: 7,
			status: 0,
			desc: "组件名字，用于表单提交获取数据"
		},
		type: {
			name: "input 的类型",
			type: 1,
			status: 1,
			desc: "input 的类型",
			props: {
				text: {
					type: 7,
					status: 0,
					desc: "文本输入键盘"
				},
				number: {
					type: 7,
					status: 0,
					desc: "数字输入键盘"
				},
				idcard: {
					type: 7,
					status: 0,
					desc: "身份证输入键盘"
				},
				digit: {
					type: 7,
					status: 0,
					desc: "带小数点的数字键盘"
				},
				numberpad: {
					type: 0,
					status: 2
				},
				digitpad: {
					type: 0,
					status: 2
				},
				idcardpad: {
					type: 0,
					status: 2
				}
			}
		},
		password: {
			type: 7,
			status: 0,
			desc: "是否是密码类型"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		},
		placeholder: {
			type: 7,
			status: 0,
			desc: "占位符"
		},
		"placeholder-class": {
			type: 7,
			status: 0,
			desc: "指定 placeholder 的样式类"
		},
		"placeholder-style": {
			type: 7,
			status: 0,
			desc: "指定 placeholder 的样式"
		},
		maxlength: {
			type: 7,
			status: 0,
			desc: "最大输入长度"
		},
		cursor: {
			type: 7,
			status: 0,
			desc: "指定focus时的光标位置"
		},
		focus: {
			type: 7,
			status: 0,
			desc: "获取焦点"
		},
		"confirm-hold": {
			type: 7,
			status: 0,
			desc: "点击键盘右下角按钮时是否保持键盘不收起状态"
		},
		"confirm-type": {
			type: 7,
			status: 0,
			desc: "设置键盘右下角按钮的文字，仅在type=text时生效"
		},
		randomNumber: {
			type: 0,
			status: 2,
			desc: "当type为 number, digit, idcard 数字键盘是否随机排列"
		},
		"selection-start": {
			type: 7,
			status: 0,
			desc: "光标起始位置，自动聚集时有效，需与selection-end搭配使用"
		},
		"selection-end": {
			type: 7,
			status: 0,
			desc: "光标结束位置，自动聚集时有效，需与selection-start搭配使用"
		},
		controlled: {
			type: 0,
			status: 2,
			desc: "是否为受控组件。为 true 时，value 内容会完全受 setData 控制"
		},
		onInput: {
			type: 1,
			status: 0,
			desc: "键盘输入时触发 input 事件，event.detail = {value: value}",
			key: "bindinput"
		},
		onConfirm: {
			type: 1,
			status: 0,
			desc: "点击键盘完成时触发，event.detail = {value: value}",
			key: "bindconfirm"
		},
		onFocus: {
			type: 1,
			status: 0,
			desc: "聚焦时触发，event.detail = {value: value}",
			key: "bindfocus"
		},
		onBlur: {
			type: 1,
			status: 0,
			desc: "失去焦点时触发，event.detail = {value: value}",
			key: "bindblur"
		}
	}
};
var textarea = {
	type: 7,
	status: 0,
	name: "多行输入框",
	url: {
		original: "https: //docs.alipay.com/mini/component/textarea",
		target: ""
	},
	desc: "多行输入框"
};
var radio = {
	name: "单选项目",
	url: {
		original: "https: //docs.alipay.com/mini/component/radio",
		target: ""
	},
	desc: "单选项目。",
	props: {
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		checked: {
			type: 7,
			status: 0,
			desc: "当前是否选中"
		},
		value: {
			type: 7,
			status: 0,
			desc: "组件值，选中时 change 事件会携带的 value"
		},
		color: {
			type: 7,
			status: 0,
			desc: "radio 的颜色，同 CSS 色值"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		}
	}
};
var checkbox = {
	name: "多选项目",
	url: {
		original: "https: //docs.alipay.com/mini/component/checkbox",
		target: ""
	},
	desc: "多选项目",
	props: {
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		checked: {
			type: 7,
			status: 0,
			desc: "当前是否选中，可用来设置默认选中"
		},
		value: {
			type: 7,
			status: 0,
			desc: "组件值，选中时 change 事件会携带的 value"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "组件发生改变时触发，detail = {value: 该 checkbox 是否 checked}"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		},
		color: {
			type: 7,
			status: 0,
			desc: "checkbox 的颜色，同 CSS 色值"
		}
	}
};
var slider = {
	name: "滑动选择器",
	url: {
		original: "https: //docs.alipay.com/mini/component/slider",
		target: ""
	},
	desc: "滑动选择器",
	props: {
		name: {
			type: 7,
			status: 0,
			desc: "组件名字，用于表单提交获取数据"
		},
		step: {
			type: 7,
			status: 0,
			desc: "步长，值必须大于 0，并可被(max - min)整除"
		},
		min: {
			type: 7,
			status: 0,
			desc: "最小值"
		},
		max: {
			type: 7,
			status: 0,
			desc: "最大值"
		},
		value: {
			type: 7,
			status: 0,
			desc: "当前取值"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		},
		"active-color": {
			type: 1,
			status: 0,
			desc: "已选择的颜色",
			key: "activeColor"
		},
		"show-value": {
			type: 7,
			status: 0,
			desc: "是否显示当前 value"
		},
		"background-color": {
			type: 1,
			status: 0,
			desc: "背景条的颜色",
			key: "backgroundColor"
		},
		"track-size": {
			type: 0,
			status: 2,
			desc: "轨道线条高度"
		},
		"handle-size": {
			type: 1,
			status: 0,
			desc: "滑块大小,默认22",
			key: "block-size"
		},
		"handle-color": {
			type: 1,
			status: 0,
			desc: "滑块填充色，同 CSS 色值",
			key: "block-color"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "完成一次拖动后触发，event.detail = {value: value}",
			key: "bindchange"
		},
		onChanging: {
			type: 1,
			status: 0,
			desc: "拖动过程中触发的事件，event.detail = {value: value}",
			key: "bindchanging"
		}
	}
};
var picker = {
	name: "从底部弹起的滚动选择器",
	url: {
		original: "https: //docs.alipay.com/mini/component/picker",
		target: ""
	},
	desc: "从底部弹起的滚动选择器",
	props: {
		range: {
			type: 7,
			status: 0,
			desc: "String[] 时表示可选择的字符串列表；Object[] 时需指定 range-key表示可选择的字段"
		},
		"range-key": {
			type: 7,
			status: 0,
			desc: "当 range 是一个 Object[] 时，通过 range-key来指定Object中key的值作为选择器显示内容"
		},
		value: {
			type: 7,
			status: 0,
			desc: "表示选择了 range 中的第几个（下标从 0 开始）"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "发生改变时触发",
			key: "bindchange"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		}
	}
};
var form$1 = {
	button: button,
	form: form,
	label: label,
	input: input,
	textarea: textarea,
	radio: radio,
	"radio-group": {
	name: "单项选择器组",
	url: {
		original: "https: //docs.alipay.com/mini/component/radio-group",
		target: ""
	},
	desc: "单项选择器组，内部由多个 radio  组成",
	props: {
		name: {
			type: 7,
			status: 0,
			desc: "组件名字，用于表单提交获取数据"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "选中项发生变化时触发，event.detail = {value: 选中项radio的value}",
			key: "bindchange"
		}
	}
},
	checkbox: checkbox,
	"checkbox-group": {
	name: "多项选择器组",
	url: {
		original: "https: //docs.alipay.com/mini/component/checkbox-group",
		target: ""
	},
	desc: "多项选择器，内部由多个checkbox组成",
	props: {
		name: {
			type: 7,
			status: 0,
			desc: "组件名字，用于表单提交获取数据"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "checkbox-group中选中选中项发生改变时触发",
			key: "bindchange"
		}
	}
},
	"switch": {
	name: "单选项目",
	url: {
		original: "https: //docs.alipay.com/mini/component/switch",
		target: ""
	},
	desc: "单选项目",
	props: {
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		checked: {
			type: 7,
			status: 0,
			desc: "是否选中"
		},
		name: {
			type: 7,
			status: 0,
			desc: "组件名字，用于表单提交获取数据"
		},
		color: {
			type: 7,
			status: 0,
			desc: "组件颜色，同 CSS 色值"
		},
		disabled: {
			type: 7,
			status: 0,
			desc: "是否禁用"
		},
		controlled: {
			type: 0,
			status: 2,
			desc: "是否为受控组件，为 true 时，checked 会完全受 setData 控制"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "checked 改变时触发，event.detail={ value:checked}",
			key: "bindchange"
		}
	}
},
	slider: slider,
	"picker-view": {
	name: "嵌入页面的滚动选择器",
	url: {
		original: "https: //docs.alipay.com/mini/component/picker-view",
		target: ""
	},
	desc: "其中只可放置 picker-view-column组件，其它节点不会显示。",
	props: {
		"indicator-style": {
			type: 7,
			status: 0,
			desc: "选中框样式"
		},
		value: {
			type: 7,
			status: 0,
			desc: "数字表示 picker-view-column 中对应的 index （从 0 开始）"
		},
		"indicator-class": {
			type: 7,
			status: 0,
			desc: "选中框的类名"
		},
		"mask-class": {
			type: 7,
			status: 0,
			desc: "蒙层的类名"
		},
		"mask-style": {
			type: 7,
			status: 0,
			desc: "蒙层的样式"
		},
		onChange: {
			type: 1,
			status: 0,
			desc: "滚动选择 value 改变时触发，event.detail = {value: value} value为数组",
			key: "bindchange"
		}
	}
},
	"picker-view-column": {
	name: "滚动选择器子项",
	url: {
		original: "https: //docs.alipay.com/mini/component/picker-view-column",
		target: ""
	},
	desc: "仅可放置于 picker-view 中，其孩子节点的高度会自动设置成与 picker-view 的选中框的高度一致"
},
	picker: picker
};

var form$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	button: button,
	form: form,
	label: label,
	input: input,
	textarea: textarea,
	radio: radio,
	checkbox: checkbox,
	slider: slider,
	picker: picker,
	'default': form$1
});

var navigator = {
	name: "页面链接",
	url: {
		original: "https://docs.alipay.com/mini/component/navigator",
		target: ""
	},
	desc: "页面链接",
	props: {
		"open-type": {
			type: 7,
			status: 0,
			desc: "跳转方式"
		},
		"hover-class": {
			type: 7,
			status: 0,
			desc: "点击后的样式类"
		},
		"hover-start-time": {
			type: 7,
			status: 0,
			desc: "按住后多久出现点击态，单位毫秒"
		},
		"hover-stay-time": {
			type: 7,
			status: 0,
			desc: "手指松开后点击态保留时间，单位毫秒"
		},
		url: {
			type: 7,
			status: 0,
			desc: "当前小程序内的跳转链接"
		}
	}
};
var navigator$1 = {
	navigator: navigator
};

var navigator$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	navigator: navigator,
	'default': navigator$1
});

var image = {
	name: "图片",
	url: {
		target: "https://docs.alipay.com/mini/component/image",
		original: ""
	},
	desc: "图片",
	props: {
		"aria-label": {
			type: 0,
			status: 2,
			desc: "无障碍访问，（属性）元素的额外描述"
		},
		role: {
			type: 0,
			status: 2,
			desc: "无障碍访问，（角色）标识元素的作用"
		},
		mode: {
			type: 7,
			status: 0,
			desc: "图片裁剪、缩放的模式"
		},
		src: {
			type: 7,
			status: 0,
			desc: "图片资源地址"
		},
		"class": {
			type: 7,
			status: 0,
			desc: "外部样式"
		},
		style: {
			type: 7,
			status: 0,
			desc: "内联样式"
		},
		"lazy-load": {
			type: 0,
			status: 2,
			desc: "支持图片懒加载，不支持通过 css 来控制 image 展示隐藏的场景"
		},
		onLoad: {
			type: 1,
			status: 0,
			desc: "图片载入完毕时触发",
			key: "bindload"
		},
		onError: {
			type: 1,
			status: 0,
			desc: "当图片加载错误时触发",
			key: "binderror"
		},
		onTap: {
			type: 1,
			status: 0,
			desc: "点击图片时触发",
			key: "bindtap"
		},
		catchTap: {
			type: 1,
			status: 0,
			desc: "点击图片时触发，阻止事件冒泡",
			key: "catchtap"
		}
	}
};
var audio = {
	name: "音频",
	url: {
		original: "",
		target: ""
	},
	desc: "音频",
	props: {
		id: {
			type: 7,
			status: 0,
			desc: "audio 组件的唯一标识符"
		},
		loop: {
			type: 7,
			status: 0,
			desc: "是否循环播放"
		},
		src: {
			type: 7,
			status: 0,
			desc: "要播放音频的资源地址"
		},
		poster: {
			type: 7,
			status: 0,
			desc: "默认控件上的音频封面的图片资源地址"
		},
		controls: {
			type: 7,
			status: 0,
			desc: "是否显示默认控件"
		},
		author: {
			type: 7,
			status: 0,
			desc: "默认控件上的作者名字"
		},
		name: {
			type: 7,
			status: 0,
			desc: "默认控件上的音频名字"
		},
		onPlay: {
			type: 1,
			status: 0,
			desc: "当开始/继续播放时触发play事件",
			key: "bindplay"
		},
		onError: {
			type: 1,
			status: 0,
			desc: "当发生错误时触发 error 事件",
			key: "binderror"
		},
		onTimeUpdate: {
			type: 1,
			status: 0,
			desc: "当播放进度改变时触发",
			key: "bindtimeupdate"
		},
		onPause: {
			type: 1,
			status: 0,
			desc: "当暂停播放时触发 pause 事件",
			key: "bindpause"
		},
		onEnded: {
			type: 1,
			status: 0,
			desc: "当播放到末尾时触发 ended 事件",
			key: "bindended"
		}
	}
};
var camera = {
	type: 0,
	status: 2,
	name: "相机组件",
	url: {
		original: "",
		target: ""
	},
	desc: "相机组件"
};
var video = {
	name: "视频",
	url: {
		original: "",
		target: ""
	},
	desc: "",
	props: {
		src: {
			type: 7,
			status: 0,
			desc: "要播放视频的资源地址，支持优酷视频编码"
		},
		poster: {
			type: 7,
			status: 0,
			desc: "视频封面图（如果不传的话，默认取首帧图）"
		},
		objectFit: {
			type: 1,
			status: 0,
			desc: "当视频大小与 video 容器大小不一致时，视频的表现形式。contain：包含，fill：填充",
			key: "object-fit"
		},
		"initial-time": {
			type: 7,
			status: 0,
			desc: "指定视频初始播放位置，单位s"
		},
		duration: {
			type: 7,
			status: 0,
			desc: "指定视频时长，单位s，默认读取视频本身时长信息"
		},
		controls: {
			type: 7,
			status: 0,
			desc: "是否显示默认播放控件（底部工具条，包括播放/暂停按钮、播放进度、时间）"
		},
		autoplay: {
			type: 7,
			status: 0,
			desc: "是否自动播放"
		},
		loop: {
			type: 7,
			status: 0,
			desc: "是否循环播放"
		},
		direction: {
			type: 7,
			status: 0,
			desc: "设置全屏时视频的方向"
		},
		muted: {
			type: 7,
			status: 0,
			desc: "是否静音播放"
		},
		"show-fullscreen-btn": {
			type: 0,
			status: 2,
			desc: "是否显示全屏按钮"
		},
		"show-play-btn": {
			type: 0,
			status: 2,
			desc: "是否显示视频底部控制栏的播放按钮"
		},
		"show-center-play-btn": {
			type: 0,
			status: 2,
			desc: "是否显示视频中间的播放按钮"
		},
		"show-mute-btn": {
			type: 0,
			status: 2,
			desc: "是否显示静音按钮"
		},
		"show-thin-progress-bar": {
			type: 0,
			status: 2,
			desc: "当底部工具条隐藏时，是否显示细进度条（controls=false时设置无效）"
		},
		enableProgressGesture: {
			type: 0,
			status: 2,
			desc: "是否开启控制进度的手势"
		},
		mobilenetHintType: {
			type: 0,
			status: 2,
			desc: "移动网络提醒样式：0-不提醒；1-tip提醒；2-阻塞提醒(无消耗流量大小)；3-阻塞提醒(有消耗流量大小，只有优酷vid才能取到流量大小)"
		},
		onPlay: {
			type: 1,
			status: 0,
			desc: "当开始/继续播放时触发play事件",
			key: "bindplay"
		},
		onPause: {
			type: 1,
			status: 0,
			desc: "当暂停播放时触发 pause 事件",
			key: "bindpause"
		},
		onEnded: {
			type: 1,
			status: 0,
			desc: "当播放到末尾时触发 ended 事件",
			key: "bindended"
		},
		onTimeUpdate: {
			type: 1,
			status: 0,
			desc: "播放进度变化时触发",
			key: "bindtimeupdate"
		},
		onLoading: {
			type: 0,
			status: 2,
			desc: "视频出现缓冲时触发"
		},
		onError: {
			type: 1,
			status: 0,
			desc: "视频播放出错时触发",
			key: "binderror"
		},
		onFullScreenChange: {
			type: 1,
			status: 0,
			desc: "视频进入和退出全屏时触发，event.detail = {fullScreen, direction}，direction取为 vertical 或 horizontal",
			key: "bindfullscreenchange"
		},
		onTap: {
			type: 7,
			status: 0,
			desc: "点击视频view时触发"
		},
		onUserAction: {
			type: 0,
			status: 2,
			desc: "用户操作事件"
		}
	}
};
var media$2 = {
	image: image,
	audio: audio,
	camera: camera,
	video: video
};

var media$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	image: image,
	audio: audio,
	camera: camera,
	video: video,
	'default': media$2
});

var canvas = {
	type: 0,
	status: 2,
	name: "画布",
	url: {
		original: "https://docs.alipay.com/mini/component/canvas",
		target: ""
	},
	desc: "相关 API：my.createCanvasContext"
};
var canvas$1 = {
	canvas: canvas
};

var canvas$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	canvas: canvas,
	'default': canvas$1
});

var map = {
	name: "地图",
	url: {
		original: "https://docs.alipay.com/mini/component/map",
		target: ""
	},
	type: 0
};
var map$1 = {
	map: map
};

var map$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	map: map,
	'default': map$1
});

var lifestyle = {
	name: "关注生活号",
	url: {
		original: "https://docs.alipay.com/mini/component/lifestyle",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "关注生活号"
};
var openAbility$2 = {
	"web-view": {
	name: "组件用于承载 H5 网页，自动铺满整个小程序页面",
	url: {
		original: "https://docs.alipay.com/mini/component/web-view",
		target: ""
	},
	desc: "此组件目前仅支持企业小程序,每个页面只能有一个 web-view，请不要渲染多个 web-view，会自动铺满整个页面，并覆盖其它组件",
	props: {
		src: {
			type: 7,
			status: 0,
			desc: "web-view 要渲染的 H5 网页 URL"
		},
		onMessage: {
			type: 0,
			status: 2,
			desc: "网页向小程序 postMessage 消息。e.detail = { data }"
		}
	}
},
	lifestyle: lifestyle,
	"contact-button": {
	name: "智能客服能力由蚂蚁金服零号云客服提供",
	url: {
		original: "https://docs.alipay.com/mini/component/contact-button",
		target: ""
	},
	type: 0,
	status: 2,
	desc: "唤起智能客服组件，开通智能客服"
}
};

var openAbility$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	lifestyle: lifestyle,
	'default': openAbility$2
});

var accessibility = {
	"aria-component": {
	type: 0,
	status: 2,
	name: "无障碍访问",
	url: {
		original: "https://docs.alipay.com/mini/component/accessibility",
		target: ""
	},
	desc: "aria 属性是 WAI-ARIA 标准提供无障碍访问动态、可交互 Web 内容的技术规范。从 基础库 1.18.0 版本开始，小程序架的部分基础组件支持 aria 属性，可满足视障人士对于小程序的无障碍访问需求"
}
};

var accessibility$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': accessibility
});

var require$$0$1 = getCjsExportFromNamespace(view$4);

var require$$1$1 = getCjsExportFromNamespace(basic$3);

var require$$2$1 = getCjsExportFromNamespace(form$2);

var require$$3$1 = getCjsExportFromNamespace(navigator$2);

var require$$4$1 = getCjsExportFromNamespace(media$3);

var require$$5$1 = getCjsExportFromNamespace(canvas$2);

var require$$6$1 = getCjsExportFromNamespace(map$2);

var require$$7$1 = getCjsExportFromNamespace(openAbility$3);

var require$$8$1 = getCjsExportFromNamespace(accessibility$1);

const ComponentsInfo = [{
  name: '视图容器',
  type: 'view',
  body: require$$0$1
}, {
  name: '基础内容',
  type: 'basic',
  body: require$$1$1
}, {
  name: '表单组件',
  type: 'form',
  body: require$$2$1
}, {
  name: '导航',
  type: 'navigator',
  body: require$$3$1
}, {
  name: '媒体组件',
  type: 'media',
  body: require$$4$1
}, {
  name: '画布',
  type: 'canvas',
  body: require$$5$1
}, {
  name: '地图',
  type: 'map',
  body: require$$6$1
}, {
  name: '开放组件',
  type: 'openAbility',
  body: require$$7$1
}, {
  name: '无障碍访问',
  type: 'accessibility',
  body: require$$8$1
}];
let descObject$1 = {};
ComponentsInfo.forEach(component => {
  descObject$1 = Object.assign(descObject$1, component.body);
});
var componentsInfo = {
  ComponentsInfo,
  descObject: descObject$1
};
componentsInfo.ComponentsInfo;
componentsInfo.descObject;

const eventObj = {
  onTap: 'bindtap',
  onTouchStart: 'bindtouchstart',
  onTouchMove: 'bindtouchmove',
  onTouchEnd: 'bindtouchend',
  onTimeUpdate: 'bindtimeupdate',
  onLineChange: 'bindlinechange',
  onTouchCancel: 'bindtouchcancel',
  onLongTap: 'bindlongtap',
  onScrollToUpper: 'bindscrolltoupper',
  onScrollToLower: 'bindscrolltolower'
};
function processEvent(info = {}) {
  const temp = {};
  Object.keys(info).forEach(key => {
    const eventName = key.substring(2);
    temp[key] = info[key].toLowerCase();
    temp[`catch${eventName}`] = info[key].replace(/^bind/, 'catch').toLowerCase();
  });
  return temp;
}
var eventsMap = processEvent(eventObj);

const componentMap = componentsInfo.descObject;
const {
  getLineCount
} = getLineCount_1;

// onTap替换成bindtap之类
function processEvents(obj = {}) {
  for (const key in obj) {
    if (eventsMap[key]) {
      obj[eventsMap[key]] = obj[key];
      delete obj[key];
    }
    if (!eventsMap[key] && /^on(.+)/.test(key)) {
      const newEvent = RegExp.$1;
      const eventKey = `bind${newEvent.toLowerCase()}`;
      obj[eventKey] = obj[key];
      delete obj[key];
    }
  }
  return obj;
}
function transformProps(obj = {}) {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    Object.values(obj).forEach(ele => {
      let str = '';
      if (ele) {
        const itemArr = ele.value[0].split(' ');
        itemArr.forEach(i => {
          const j = i.trim();
          str += `${j} `;
        });
        str = str.replace(/\s+/g, ' ').trim();
        ele.value[0] = str;
      }
    });
  }
  return obj;
}
var props = function (ast, fileInfo, convertorCount) {
  let {
    type
  } = ast;
  const {
    props
  } = ast;
  const _componentMap = componentMap;
  const tagInfo = _componentMap[type];
  if (tagInfo && tagInfo.type === 6) {
    ast.type = tagInfo.tagName || ast.type;
    type = ast.type;
  }

  // onTap替换成bindtap之类
  processEvents(props);
  // 将类似于 class='a b' a,b两个prop合并
  transformProps(props);
  if (tagInfo) {
    getLineCount(fileInfo, ast, tagInfo, convertorCount);
  }
};

var convertPropMap = {
  translationMap: {
    'a:for-items': 'a:for'
  }
};

const translationMap = convertPropMap.translationMap;
const {
  render
} = generatemaml;
function addMyKey(propsRaw) {
  let props = propsRaw;
  if (props['a:for']) {
    if (!props['a:key']) {
      props = Object.assign(props, {
        'a:key': {
          type: 'unknown',
          value: ['{{index}}']
        }
      });
    }
  }
  return props;
}
function transformSjs(ast) {
  ast.type = 'sjs';
  ast.props.module = ast.props.name;
  ast.props.src = ast.props.from;
  delete ast.props.name;
  delete ast.props.from;
  return ast;
}
function transformInput(ast) {
  if (ast.props[undefined]) {
    ast.props.type = {
      type: 'unknown',
      value: ast.props[undefined].value
    };
    delete ast.props[undefined];
  }
}
function processTag(_ast) {
  // sjs标签和name from 属性转换
  if (_ast.type === 'import-sjs') {
    transformSjs(_ast);
  }
  // input的type属性转换
  if (_ast.type === 'input') {
    transformInput(_ast);
  }
}
var generateMaml = function axmlRender(fileInfo, convertorCount, ast = []) {
  if (typeof ast === 'string') {
    return ast;
  }
  let _code = '';
  const indentWidth = '';
  const pluginPara = {
    convertorCount,
    translationMap,
    fileExt: 'axml',
    callReg: /a:/
  };
  ast.forEach(tagAst => {
    _code += render(tagAst, fileInfo, indentWidth, pluginPara, (_tagAst, _fileInfo, _convertorCount, props$1) => {
      let propsNew = props$1;
      propsNew = addMyKey(propsNew);
      props(_tagAst, _fileInfo, _convertorCount);
      processTag(_tagAst);
    });
  });
  return _code;
};

var compileAxml = function (fileInfo, convertorCount) {
  fileInfo.dist = fileInfo.dist.replace(/\.axml/, '.maml');
  const originCode = generateMaml(fileInfo, convertorCount, fileInfo.ast);
  fsExtra__default["default"].outputFileSync(fileInfo.dist, originCode);
};

const {
  prettierCode: prettierCode$2
} = utils;
const Base64 = jsBase64__default["default"].Base64;
function processUrl(ctx, filePath) {
  const entry = ctx.entry;
  const filecont = fsExtra__default["default"].readFileSync(path__default["default"].resolve(filePath), 'utf8');
  const cssCode = postcss__default["default"].parse(filecont);
  const nodes = cssCode.nodes;
  nodes.forEach(el => {
    if (el.type === 'rule') {
      el.nodes.map(dec => {
        if (dec.prop === 'background-image') {
          const reg = dec.value.match(/url\(['|"]*(\/.+)\)/);
          if (reg) {
            let image = path__default["default"].join(entry, reg[1]);
            image = image.replace(/['|"]/, '');
            try {
              const str = fsExtra__default["default"].readFileSync(image, 'utf8');
              const base64 = Base64.encode(str);
              dec.value = dec.value.replace(/url\(['|"]*(\/.+)\)/, (...$) => {
                let imageType = $[1].split('.');
                imageType = imageType.pop();
                imageType = imageType.replace(/['|"]/, '');
                return `url(data:image/${imageType};base64,${base64})`;
              });
            } catch (err) {
              logManager_1.error(`[Error]: no such file, open ${image}`);
            }
          }
        }
        return dec;
      });
    }
  });
  return cssCode.toString();
}
var compileAcss = function (fileInfo, ctx) {
  // url() 转换
  try {
    cssContent = processUrl(ctx, fileInfo.path);
  } catch (error) {
    logManager_1.error(`Invalid Acss file: ${fileInfo.dist}`);
  }
  fileInfo.dist = fileInfo.dist.replace(/\.acss/, '.mass');
  let cssContent = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8') || '';
  cssContent = cssContent.replace(/\.acss("|')/g, (match, $1) => {
    return `.mass${$1}`;
  });
  // 格式化代码
  cssContent = prettierCode$2(cssContent, 'scss');
  fsExtra__default["default"].outputFileSync(fileInfo.dist, cssContent);
};

var arrayBufferToBase64 = {
	status: 0,
	desc: "将 ArrayBuffer 对象转成 Base64 字符串。",
	url: {
		original: "https://opendocs.alipay.com/mini/api/021zmz?pathHash=6b9bbf69",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var base64ToArrayBuffer = {
	status: 0,
	desc: "将 Base64 字符串转成 ArrayBuffer 对象。",
	url: {
		original: "https://opendocs.alipay.com/mini/api/021zmy?pathHash=4dec350a",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getLaunchOptionsSync = {
	status: 1,
	desc: "获取小程序启动时的参数",
	url: {
		original: "https://opendocs.alipay.com/mini/api/getLaunchOptionsSync",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "返回值缺失",
		returnValue: {
			props: {
				path: {
					type: 0,
					desc: "启动小程序的路径"
				},
				scene: {
					type: 0,
					desc: "启动小程序的场景值"
				},
				query: {
					type: 0,
					desc: "启动小程序的 query 参数"
				},
				referrerInfo: {
					type: 0,
					desc: "来源信息"
				},
				apiCategory: {
					type: 0,
					desc: "API 类别"
				}
			}
		}
	}
};
var getSystemSetting = {
	status: 0,
	desc: "获取设备设置",
	url: {
		original: "https://opendocs.alipay.com/mini/071crr?pathHash=5da23380",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onAppShow = {
	status: 0,
	desc: "监听小程序切前台事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/nn7do1?pathHash=7735013d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_onappshow"
	},
	body: {
	}
};
var onAppHide = {
	status: 0,
	desc: "监听小程序切后台事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/tv6qvi?pathHash=561fc24e",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_onapphide"
	},
	body: {
	}
};
var onError = {
	status: 0,
	desc: "监听小程序错误事件。如脚本错误或 API 调用报错等。",
	url: {
		original: "https://opendocs.alipay.com/mini/00nnsx?pathHash=cbd81486",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_onerror"
	},
	body: {
	}
};
var offAppShow = {
	status: 0,
	desc: "取消监听小程序切前台事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/tkohmw?pathHash=e8045f71",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_offappshow"
	},
	body: {
	}
};
var offAppHide = {
	status: 0,
	desc: "取消监听小程序切后台事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/dldh0a?pathHash=563c2d8a",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_offapphide"
	},
	body: {
	}
};
var offError = {
	status: 0,
	desc: "监听小程序切前台事件",
	url: {
		original: "https://opendocs.alipay.com/mini/00njqm?pathHash=85648e80",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_event_offerror"
	},
	body: {
	}
};
var basic = {
	arrayBufferToBase64: arrayBufferToBase64,
	base64ToArrayBuffer: base64ToArrayBuffer,
	getLaunchOptionsSync: getLaunchOptionsSync,
	getSystemSetting: getSystemSetting,
	onAppShow: onAppShow,
	onAppHide: onAppHide,
	onError: onError,
	offAppShow: offAppShow,
	offAppHide: offAppHide,
	offError: offError
};

var basic$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	arrayBufferToBase64: arrayBufferToBase64,
	base64ToArrayBuffer: base64ToArrayBuffer,
	getLaunchOptionsSync: getLaunchOptionsSync,
	getSystemSetting: getSystemSetting,
	onAppShow: onAppShow,
	onAppHide: onAppHide,
	onError: onError,
	offAppShow: offAppShow,
	offAppHide: offAppHide,
	offError: offError,
	'default': basic
});

var showModal = {
	status: 1,
	desc: "显示模态对话框",
	url: {
		original: "https://opendocs.alipay.com/mini/0adjf7?pathHash=c7637002",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				placeholderText: {
					type: 0,
					desc: "显示输入框时的提示文本"
				}
			}
		}
	}
};
var setNavigationBarTitle = {
	status: 1,
	desc: "动态设置当前页面的标题",
	url: {
		original: "https://opendocs.alipay.com/mini/09bwnv?pathHash=6181553e",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				image: {
					type: 0,
					desc: "导航栏图片标题。（必须是 HTTPS），支持 GIF 格式"
				}
			}
		}
	}
};
var setNavigationBarColor = {
	status: 0,
	desc: "设置页面导航条颜色",
	url: {
		original: "https://opendocs.alipay.com/mini/09bn1n?pathHash=9b6a383a",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getTitleColor = {
	status: 2,
	desc: "获取导航栏背景色",
	url: {
		original: "https://docs.alipay.com/mini/api/dplf2s",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var hideBackHome = {
	status: 2,
	desc: "隐藏标题栏上的返回首页图标和右上角通用菜单中的返回首页功能",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-navigate",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_navigationbar_hidebackhome"
	},
	body: {
	}
};
var hideNavigationBarLoading = {
	status: 2,
	desc: "在当前页面隐藏导航条的加载动画",
	url: {
		original: "https://docs.alipay.com/mini/api/kc5zbx",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_navigationbar_hidenavigationbarloading"
	},
	body: {
	}
};
var navigateBack = {
	status: 0,
	desc: "关闭当前页面，返回上一级或多级页面",
	url: {
		original: "https://opendocs.alipay.com/mini/api/kc5zbx?pathHash=8aa20ed0",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_route_navigateback"
	},
	body: {
	}
};
var navigateTo = {
	status: 0,
	desc: "从当前页面，跳转到应用内的某个指定页面",
	url: {
		original: "https://opendocs.alipay.com/mini/api/zwi8gx?pathHash=a4881d61",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_route_navigateto"
	},
	body: {
	}
};
var redirectTo = {
	status: 0,
	desc: "关闭当前页面，跳转到应用内的某个指定页面",
	url: {
		original: "https://opendocs.alipay.com/mini/api/fh18ky?pathHash=0fd731cc",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_route_redirectto"
	},
	body: {
	}
};
var exitMiniProgram = {
	status: 0,
	desc: "退出当前小程序",
	url: {
		original: "https://opendocs.alipay.com/mini/api/my.exitMiniProgram?pathHash=56620371",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var reLaunch = {
	status: 0,
	desc: "关闭当前所有页面，跳转到应用内的某个指定页面",
	url: {
		original: "https://opendocs.alipay.com/mini/api/hmn54z?pathHash=3c72668d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_route_relaunch"
	},
	body: {
	}
};
var setNavigationBar = {
	status: 1,
	desc: "设置导航栏文字及样式",
	url: {
		original: "https://docs.alipay.com/mini/api/xwq8e6",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_navigationbar_setnavigationbar"
	},
	body: {
		msg: "入参参数缺失",
		type: 1,
		value: "setNavigationBarTitle",
		params: {
			props: {
				image: {
					type: 0,
					desc: "图片连接地址，必须是https，请使用 iOS @3x 分辨率标准的高清图片。若设置了 image 则 title 参数失效"
				},
				borderBottomColor: {
					type: 0,
					desc: "导航栏底部边框颜色，支持十六进制颜色值"
				},
				reset: {
					type: 0,
					desc: "是否重置导航栏为支付宝默认配色，默认为 false"
				}
			}
		}
	}
};
var showNavigationBarLoading = {
	status: 2,
	desc: "显示导航栏加载栏",
	url: {
		original: "https://docs.alipay.com/mini/api/lydg2a",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_navigationbar_shownavigationbarloading"
	},
	body: {
	}
};
var hideTabBar = {
	status: 0,
	desc: "隐藏标签页（tabBar）",
	url: {
		original: "https://opendocs.alipay.com/mini/api/at18z8?pathHash=b15c5223",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_tabbar_hidetabbar"
	},
	body: {
	}
};
var hideTabBarRedDot = {
	status: 0,
	desc: "隐藏标签页（tabBar）某一项右上角的红点",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mg428a?pathHash=88e0acd2",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var removeTabBarBadge = {
	status: 0,
	desc: "移除标签页（tabBar） 某一项右上角的文本",
	url: {
		original: "https://docs.alipay.com/mini/api/lpbp5g",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var setTabBarBadge = {
	status: 0,
	desc: "为标签页（tabBar）某一项的右上角添加文本",
	url: {
		original: "https://docs.alipay.com/mini/api/qm7t3v",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var setTabBarItem = {
	status: 0,
	desc: "动态设置标签页（tabBar）某一项的内容",
	url: {
		original: "https://opendocs.alipay.com/mini/api/zu37bk?pathHash=9f140895",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var setTabBarStyle = {
	status: 0,
	desc: "动态设置标签页（tabbar）的整体样式，如文字颜色、标签背景色、标签边框颜色等",
	url: {
		original: "https://opendocs.alipay.com/mini/api/wcf0sv?pathHash=5947789c",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_tabbar_settabbarstyle"
	},
	body: {
	}
};
var showTabBar = {
	status: 0,
	desc: "显示标签页（tabbar）",
	url: {
		original: "https://opendocs.alipay.com/mini/api/dpq5dh?pathHash=d0bf300c",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var showTabBarRedDot = {
	status: 0,
	desc: "显示标签页（tabbar）某一项的右上角的红点",
	url: {
		original: "https://opendocs.alipay.com/mini/api/dquxiq?pathHash=f328793b",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var switchTab = {
	status: 0,
	desc: "跳转到指定标签页（tabbar）页面，并关闭其他所有非标签页页面",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ui-tabbar?pathHash=1528d1d1",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_route_switchtab"
	},
	body: {
	}
};
var onTabItemTap = {
	status: 2,
	desc: "点击标签（tab）时触发",
	url: {
		original: "https://docs.alipay.com/mini/api/navg36",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var alert = {
	status: 2,
	desc: "警告框，可以配置警告框的标题、内容、按钮文字等",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-feedback",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var confirm = {
	status: 2,
	desc: "用于提示的确认框，可以配置确认框标题、内容、确认或取消按钮的文字等",
	url: {
		original: "https://docs.alipay.com/mini/api/lt3uqc",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_confirm"
	},
	body: {
	}
};
var hideLoading = {
	status: 1,
	desc: "隐藏加载提示的过渡效果",
	url: {
		original: "https://opendocs.alipay.com/mini/api/nzf540?pathHash=3953ffc5",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_hideloading"
	},
	body: {
		msg: "入参参数缺失",
		params: {
			props: {
				page: {
					type: 0,
					desc: "具体指当前 page 实例，某些场景下，需要指明在哪个 page 执行hideLoading"
				}
			}
		}
	}
};
var hideToast = {
	status: 0,
	desc: "隐藏弱提示",
	url: {
		original: "https://opendocs.alipay.com/mini/api/iygd4e?pathHash=a0297426",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_hidetoast"
	},
	body: {
	}
};
var prompt = {
	status: 2,
	desc: "弹出一个对话框，让用户在对话框内输入文本",
	url: {
		original: "https://docs.alipay.com/mini/api/vqpy01",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_prompt"
	},
	body: {
	}
};
var showActionSheet = {
	status: 1,
	desc: "显示操作菜单",
	url: {
		original: "https://opendocs.alipay.com/mini/api/hr092g?pathHash=0aea00a2",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_showactionsheet"
	},
	body: {
		msg: "入参参数名称差异/缺失",
		params: {
			props: {
				title: {
					type: 0,
					desc: "菜单标题"
				},
				cancelButtonText: {
					type: 0,
					desc: "取消按钮文案"
				},
				destructiveBtnIndex: {
					type: 0,
					desc: "（iOS特殊处理）指定按钮的索引号，从0开始，使用场景：需要删除或清除数据等类似场景，默认红色"
				},
				badges: {
					type: 0,
					desc: "需飘红选项的数组，数组内部对象字段见下表"
				},
				items: {
					type: 0,
					desc: "提示的内容, alipay: items, macle: itemList, 最大数组长度为6",
					msg: "itemList"
				}
			}
		}
	}
};
var showLoading = {
	status: 1,
	desc: "显示加载提示的过渡效果",
	url: {
		original: "https://opendocs.alipay.com/mini/api/bm69kb?pathHash=4e0b185c",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_showloading"
	},
	body: {
		msg: "入参参数名称差异/缺失",
		params: {
			props: {
				delay: {
					type: 0,
					desc: "延迟显示，单位 ms，默认 0"
				},
				content: {
					type: 0,
					desc: "提示的内容, alipay: content, macle: title",
					msg: "title"
				}
			}
		}
	}
};
var showToast = {
	status: 1,
	desc: "显示一个弱提示，在到达设定的显示时间后，自动消失",
	url: {
		original: "https://opendocs.alipay.com/mini/api/fhur8f?pathHash=8710cb95",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_feedback_showtoast"
	},
	body: {
		msg: "入参参数名称差异",
		params: {
			props: {
				content: {
					type: 0,
					desc: "提示的内容, alipay: content, macle: title",
					msg: "title"
				},
				type: {
					type: 0,
					desc: "支付宝type,默认none,支持success/fail/exception/none;macle是icon,默认success,支持success/loading/none",
					msg: "icon"
				}
			}
		}
	}
};
var startPullDownRefresh = {
	status: 0,
	desc: "开始下拉刷新",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ui-pulldown?pathHash=b479a687",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_pulldown_startpulldownrefresh"
	},
	body: {
	}
};
var stopPullDownRefresh = {
	status: 0,
	desc: "停止当前页面的下拉刷新",
	url: {
		original: "https://opendocs.alipay.com/mini/api/pmhkbb?pathHash=6ae94b4e",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_pulldown_stoppulldownrefresh"
	},
	body: {
	}
};
var onPullDownRefresh = {
	status: 0,
	desc: "监听该页面用户的下拉刷新事件",
	url: {
		original: "https://docs.alipay.com/mini/api/wo21qk",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_pulldown_onpulldownrefresh"
	},
	body: {
	}
};
var chooseAlipayContact = {
	status: 2,
	desc: "唤起支付宝通讯录，选择一个或者多个支付宝联系人",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-contact",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var chooseContact = {
	status: 1,
	desc: "唤起选择人，默认只包含支付宝联系人，可通过修改参数选择手机通讯录联系人或者双向通讯录联系人",
	url: {
		original: "https://opendocs.alipay.com/mini/api/eqx2u5?pathHash=15ed6460",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				chooseType: {
					type: 0,
					desc: "选择类型"
				},
				includeMobileContactMode: {
					type: 0,
					desc: "选择手机通讯录联系人的模式"
				},
				includeMe: {
					type: 0,
					desc: "是否包含自己"
				},
				multiChooseMax: {
					type: 0,
					desc: "最大选择人数，"
				},
				multiChooseMaxTips: {
					type: 0,
					desc: "多选达到上限时的文案"
				}
			}
		}
	}
};
var choosePhoneContact = {
	status: 2,
	desc: "选择本地系统通信录中某个联系人的电话",
	url: {
		original: "https://docs.alipay.com/mini/api/blghgl",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_contact_choosephonecontact"
	},
	body: {
	}
};
var chooseCity = {
	status: 2,
	desc: "打开城市选择列表",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-city",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var datePicker = {
	status: 2,
	desc: "打开日期选择列表",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-date",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_choose-date_datepicker"
	},
	body: {
	}
};
var createAnimation = {
	status: 2,
	desc: "创建动画实例 animation",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-animation",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_animation_createanimation"
	},
	body: {
	}
};
var createCanvasContext = {
	status: 2,
	desc: "创建 canvas 绘图上下文",
	url: {
		original: "https://docs.alipay.com/mini/api/ui-canvas",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_canvas_createcanvascontext"
	},
	body: {
	}
};
var createMapContext = {
	status: 0,
	desc: "创建并返回一个地图下文对象 mapContext",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ui-map?pathHash=799124a3",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_map_createmapcontext"
	},
	body: {
	}
};
var hideKeyboard = {
	status: 0,
	desc: "隐藏键盘",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ui-hidekeyboard?pathHash=375ef3c5",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_keyboard_hidekeyboard"
	},
	body: {
	}
};
var pageScrollTo = {
	status: 1,
	desc: "滚动到页面的目标位置",
	url: {
		original: "https://opendocs.alipay.com/mini/api/scroll?pathHash=a38f7791",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_scroll_pagescrollto"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				selector: {
					type: 0,
					desc: "选择器"
				},
				offsetTop: {
					type: 0,
					desc: "偏移距离，需要和 selector 参数搭配使用，可以滚动到 selector 加偏移距离的位置，单位 px"
				}
			}
		}
	}
};
var createIntersectionObserver = {
	status: 2,
	desc: "创建并返回一个 IntersectionObserver 对象实例",
	url: {
		original: "https://docs.alipay.com/mini/api/intersectionobserver",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var createSelectorQuery = {
	status: 0,
	desc: "创建并返回一个 SelectorQuery 对象实例",
	url: {
		original: "https://opendocs.alipay.com/mini/api/selector-query?pathHash=6b19152d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_selector-query_createselectorquery"
	},
	body: {
	}
};
var optionSelect = {
	status: 2,
	desc: "类似于 safari 原生 select 的组件，但是功能更加强大，一般用来替代 select，或者 2 级数据的选择",
	url: {
		original: "https://docs.alipay.com/mini/api/options-select",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var multiLevelSelect = {
	status: 2,
	desc: "级联选择功能主要使用在于多级关联数据选择，比如说省市区的信息选择",
	url: {
		original: "https://docs.alipay.com/mini/api/multi-level-select",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_multi-level-select_multilevelselect"
	},
	body: {
	}
};
var setBackgroundColor = {
	status: 0,
	desc: "动态设置窗口的背景色",
	url: {
		original: "https://opendocs.alipay.com/mini/api/set-background?pathHash=b0dc51aa",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_set-background_setbackgroundcolor"
	},
	body: {
	}
};
var setBackgroundTextStyle = {
	status: 0,
	desc: "动态设置下拉背景字体、loading 图的样式",
	url: {
		original: "https://opendocs.alipay.com/mini/api/aamqae?pathHash=77628770",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var setCanPullDown = {
	status: 2,
	desc: "设置页面是否支持下拉（小程序内页面默认支持下拉）",
	url: {
		original: "https://docs.alipay.com/mini/api/set-can-pull-down",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_set-pulldown_setcanpulldown"
	},
	body: {
	}
};
var getMenuButtonBoundingClientRect = {
	status: 1,
	desc: "获取菜单按钮（右上角胶囊按钮）的布局位置信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/menu?pathHash=13bb2dec",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_navigationbar_getmenubuttonboundingclientrect"
	},
	body: {
		msg: "返回值不同",
		returnValue: {
			props: {
				success: {
					type: 0,
					desc: "支付宝直接返回const res = my.getMenuButtonBoundingClientRect()，华为macle用函数ma.getMenuButtonBoundingClientRect({success(res) {console.log(res.width);}})"
				}
			}
		}
	}
};
var setOptionMenu = {
	status: 2,
	desc: "配置 optionMenu 导航栏额外图标，点击后触发 onOptionMenuClick",
	url: {
		original: "https://docs.alipay.com/mini/api/optionmenu",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var loadFontFace = {
	status: 1,
	desc: "动态加载网络字体，文件地址需为下载类型",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ggawf0?pathHash=e93bb181",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				nativeCanvas: {
					type: 0,
					desc: "加载的字体是否在 native canvas"
				}
			}
		}
	}
};
var view = {
	showModal: showModal,
	setNavigationBarTitle: setNavigationBarTitle,
	setNavigationBarColor: setNavigationBarColor,
	getTitleColor: getTitleColor,
	hideBackHome: hideBackHome,
	hideNavigationBarLoading: hideNavigationBarLoading,
	navigateBack: navigateBack,
	navigateTo: navigateTo,
	redirectTo: redirectTo,
	exitMiniProgram: exitMiniProgram,
	reLaunch: reLaunch,
	setNavigationBar: setNavigationBar,
	showNavigationBarLoading: showNavigationBarLoading,
	hideTabBar: hideTabBar,
	hideTabBarRedDot: hideTabBarRedDot,
	removeTabBarBadge: removeTabBarBadge,
	setTabBarBadge: setTabBarBadge,
	setTabBarItem: setTabBarItem,
	setTabBarStyle: setTabBarStyle,
	showTabBar: showTabBar,
	showTabBarRedDot: showTabBarRedDot,
	switchTab: switchTab,
	onTabItemTap: onTabItemTap,
	alert: alert,
	confirm: confirm,
	hideLoading: hideLoading,
	hideToast: hideToast,
	prompt: prompt,
	showActionSheet: showActionSheet,
	showLoading: showLoading,
	showToast: showToast,
	startPullDownRefresh: startPullDownRefresh,
	stopPullDownRefresh: stopPullDownRefresh,
	onPullDownRefresh: onPullDownRefresh,
	chooseAlipayContact: chooseAlipayContact,
	chooseContact: chooseContact,
	choosePhoneContact: choosePhoneContact,
	chooseCity: chooseCity,
	datePicker: datePicker,
	createAnimation: createAnimation,
	createCanvasContext: createCanvasContext,
	createMapContext: createMapContext,
	"MapContext.moveToLocation": {
	status: 0,
	desc: "移动地图中心位置。",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ans8wt?pathHash=38ca4cf3",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_map_movetolocation"
	},
	body: {
	}
},
	hideKeyboard: hideKeyboard,
	pageScrollTo: pageScrollTo,
	createIntersectionObserver: createIntersectionObserver,
	createSelectorQuery: createSelectorQuery,
	"SelectorQuery.exec": {
	status: 0,
	desc: "执行所有的请求",
	url: {
		original: "https://opendocs.alipay.com/mini/api/baz2hg?pathHash=10ae1171",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_selector-query_query_selectorquery-exec"
	},
	body: {
	}
},
	"SelectorQuery.select": {
	status: 0,
	desc: "在当前页面下选择匹配选择器（selector）的第一个节点",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mwo97h?pathHash=a3f8e14b",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_selector-query_query_selectorquery-select"
	},
	body: {
	}
},
	"SelectorQuery.selectAll": {
	status: 0,
	desc: "在当前页面下选择匹配选择器（selector）的所有节点",
	url: {
		original: "https://opendocs.alipay.com/mini/api/aygfvh?pathHash=17e2f68b",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_selector-query_query_selectorquery-selectall"
	},
	body: {
	}
},
	"SelectorQuery.selectViewport": {
	status: 0,
	desc: "选择显示区域。可用于获取显示区域的尺寸、滚动位置等信息。",
	url: {
		original: "https://opendocs.alipay.com/mini/api/kwbegi?pathHash=c8efdd9a",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_ui_selector-query_query_selectorquery-selectviewport"
	},
	body: {
	}
},
	optionSelect: optionSelect,
	multiLevelSelect: multiLevelSelect,
	setBackgroundColor: setBackgroundColor,
	setBackgroundTextStyle: setBackgroundTextStyle,
	setCanPullDown: setCanPullDown,
	getMenuButtonBoundingClientRect: getMenuButtonBoundingClientRect,
	setOptionMenu: setOptionMenu,
	loadFontFace: loadFontFace
};

var view$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	showModal: showModal,
	setNavigationBarTitle: setNavigationBarTitle,
	setNavigationBarColor: setNavigationBarColor,
	getTitleColor: getTitleColor,
	hideBackHome: hideBackHome,
	hideNavigationBarLoading: hideNavigationBarLoading,
	navigateBack: navigateBack,
	navigateTo: navigateTo,
	redirectTo: redirectTo,
	exitMiniProgram: exitMiniProgram,
	reLaunch: reLaunch,
	setNavigationBar: setNavigationBar,
	showNavigationBarLoading: showNavigationBarLoading,
	hideTabBar: hideTabBar,
	hideTabBarRedDot: hideTabBarRedDot,
	removeTabBarBadge: removeTabBarBadge,
	setTabBarBadge: setTabBarBadge,
	setTabBarItem: setTabBarItem,
	setTabBarStyle: setTabBarStyle,
	showTabBar: showTabBar,
	showTabBarRedDot: showTabBarRedDot,
	switchTab: switchTab,
	onTabItemTap: onTabItemTap,
	alert: alert,
	confirm: confirm,
	hideLoading: hideLoading,
	hideToast: hideToast,
	prompt: prompt,
	showActionSheet: showActionSheet,
	showLoading: showLoading,
	showToast: showToast,
	startPullDownRefresh: startPullDownRefresh,
	stopPullDownRefresh: stopPullDownRefresh,
	onPullDownRefresh: onPullDownRefresh,
	chooseAlipayContact: chooseAlipayContact,
	chooseContact: chooseContact,
	choosePhoneContact: choosePhoneContact,
	chooseCity: chooseCity,
	datePicker: datePicker,
	createAnimation: createAnimation,
	createCanvasContext: createCanvasContext,
	createMapContext: createMapContext,
	hideKeyboard: hideKeyboard,
	pageScrollTo: pageScrollTo,
	createIntersectionObserver: createIntersectionObserver,
	createSelectorQuery: createSelectorQuery,
	optionSelect: optionSelect,
	multiLevelSelect: multiLevelSelect,
	setBackgroundColor: setBackgroundColor,
	setBackgroundTextStyle: setBackgroundTextStyle,
	setCanPullDown: setCanPullDown,
	getMenuButtonBoundingClientRect: getMenuButtonBoundingClientRect,
	setOptionMenu: setOptionMenu,
	loadFontFace: loadFontFace,
	'default': view
});

var chooseImage = {
	status: 1,
	desc: "拍照或从本地相册中选择图片",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/image/my.chooseimage?pathHash=3770863e",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_image_chooseimage"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				useFrontCamera: {
					type: 0,
					desc: "是否默认使用前置摄像头"
				},
				highQuality: {
					type: 0,
					desc: "是否启用高画质模式"
				}
			}
		}
	}
};
var chooseVideo = {
	status: 1,
	desc: "拍摄视频或从手机相册中选视频",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/video/my.choosevideo?pathHash=c48ac323",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_video_choosevideo"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				compressed: {
					type: 0,
					desc: "是否压缩所选择的视频文件。在 iOS 端即使 compressed 为 false，视频实际也是有压缩的，compressed 仅指定更大压缩级别"
				},
				maxDuration: {
					type: 0,
					desc: "拍摄视频最长拍摄时间，单位：秒"
				}
			}
		}
	}
};
var compressImage = {
	status: 1,
	desc: "压缩图片",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/image/my.compressimage?pathHash=bfac9f2f",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_image_compressimage"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePaths: {
					type: 0,
					desc: "图片路径数组"
				},
				compressLevel: {
					type: 0,
					desc: "压缩等级"
				},
				compressedWidth: {
					type: 0,
					desc: "压缩后图片的宽度"
				},
				compressedHeight: {
					type: 0,
					desc: "压缩后图片的高度"
				}
			}
		}
	}
};
var getImageInfo = {
	status: 0,
	desc: "获取图片信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/image/my.getimageinfo?pathHash=c4829791",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_image_getimageinfo"
	},
	body: {
	}
};
var createVideoContext = {
	status: 0,
	desc: "创建 video 上下文 VideoContext 对象",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/video/my.createvideocontext?pathHash=d2b08ecd",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_video_createvideocontext"
	},
	body: {
	}
};
var previewImage = {
	status: 1,
	desc: "预览图片",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/image/my.previewimage?pathHash=ccbf3c42",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_image_previewimage"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				enablesavephoto: {
					type: 0,
					desc: "是否支持长按下载图片"
				},
				enableShowPhotoDownload: {
					type: 0,
					desc: "是否在右下角显示下载入口"
				}
			}
		}
	}
};
var saveImage = {
	status: 2,
	desc: "将在线图片保存至本地相册",
	url: {
		original: "https://docs.alipay.com/mini/api/izfoiz",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_media_image_saveimage"
	},
	body: {
	}
};
var saveImageToPhotosAlbum = {
	status: 1,
	desc: "保存图片到系统相册不支持网络图片路径",
	url: {
		original: "https://opendocs.alipay.com/mini/api/media/image/my.saveImagetophotosalbum?pathHash=221aa5cb",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				hideToast: {
					type: 0,
					desc: "保存成功时是否展示 toast 提示"
				}
			}
		}
	}
};
var createCameraContext = {
	status: 0,
	desc: "创建 camera 上下文 CameraContext 对象",
	url: {
		original: "https://opendocs.alipay.com/mini/0762mk?pathHash=8ebc5df8",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getRecorderManager = {
	status: 0,
	desc: "获取全局唯一的录音管理器 RecorderManager",
	url: {
		original: "https://opendocs.alipay.com/mini/api/getrecordermanager?pathHash=2a3a6509",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var media = {
	chooseImage: chooseImage,
	chooseVideo: chooseVideo,
	compressImage: compressImage,
	getImageInfo: getImageInfo,
	createVideoContext: createVideoContext,
	"VideoContext.stop": {
	status: 0,
	desc: "停止播放视频",
	url: {
		original: "https://opendocs.alipay.com/mini/08ie0w?pathHash=5c780d87",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"VideoContext.play": {
	status: 0,
	desc: "播放视频",
	url: {
		original: "https://opendocs.alipay.com/mini/08ib0p?pathHash=8c8d68b1",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"VideoContext.pause": {
	status: 0,
	desc: "暂停播放视频",
	url: {
		original: "https://opendocs.alipay.com/mini/08is4y?pathHash=8f051566",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"VideoContext.seek": {
	status: 0,
	desc: "跳转到指定位置播放视频",
	url: {
		original: "https://opendocs.alipay.com/mini/08iqsk?pathHash=22988bd4",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	previewImage: previewImage,
	saveImage: saveImage,
	saveImageToPhotosAlbum: saveImageToPhotosAlbum,
	createCameraContext: createCameraContext,
	"CameraContext.setZoom": {
	status: 0,
	desc: "设置缩放级别",
	url: {
		original: "https://opendocs.alipay.com/mini/03qde9?pathHash=25b491fd",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"CameraContext.startRecord": {
	status: 0,
	desc: "开始录像",
	url: {
		original: "https://opendocs.alipay.com/mini/03qits?pathHash=af7fc811",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"CameraContext.stopRecord": {
	status: 0,
	desc: "结束录像",
	url: {
		original: "https://opendocs.alipay.com/mini/03qfj8?pathHash=6f2080a6",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"CameraContext.onCameraFrame": {
	status: 2,
	desc: "获取 Camera 实时帧数据",
	url: {
		original: "https://opendocs.alipay.com/mini/03qitt?pathHash=4913e344",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	getRecorderManager: getRecorderManager,
	"RecorderManager.start": {
	status: 1,
	desc: "开始录音",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/start?pathHash=4ebf0019",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				format: {
					type: 0,
					desc: "音频格式"
				},
				hideTips: {
					type: 0,
					desc: "隐藏录音图标"
				},
				frameSize: {
					type: 0,
					desc: "指定帧大小，单位 KB"
				},
				audioSource: {
					type: 0,
					desc: "指定录音的音频输入源"
				},
				detectDecibel: {
					type: 0,
					desc: "检测声音分贝数"
				}
			}
		}
	}
},
	"RecorderManager.pause": {
	status: 0,
	desc: "暂停录音",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/pause?pathHash=d41128bc",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.resume": {
	status: 0,
	desc: "继续录音",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/resume?pathHash=3f534086",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.stop": {
	status: 0,
	desc: "停止录音",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/stop?pathHash=e007be35",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onStart": {
	status: 0,
	desc: "监听录音开始事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/onstart?pathHash=027e5d34",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offStart": {
	status: 0,
	desc: "移除录音开始事件监听函数",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/stop?pathHash=e007be35",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onPause": {
	status: 0,
	desc: "监听录音暂停事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/onpause?pathHash=854198db",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offPause": {
	status: 0,
	desc: "移除监听录音暂停事件监听函数",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/offpause?pathHash=6a0a958b",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onResume": {
	status: 0,
	desc: "监听录音继续事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/onresume?pathHash=bc03a7f2",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offResume": {
	status: 0,
	desc: "取消监听录音继续事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/offresume?pathHash=9faf4fb3",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onStop": {
	status: 0,
	desc: "监听录音停止事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/onstop?pathHash=fb4f1327",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offStop": {
	status: 0,
	desc: "取消监听录音停止事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/offstop?pathHash=a873ad6f",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onError": {
	status: 0,
	desc: "监听录音错误事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/onerror?pathHash=1ec85ed7",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offError": {
	status: 0,
	desc: "取消监听录音错误事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/recordermanager/offerror?pathHash=c96e0a3b",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onFrameRecorded": {
	status: 2,
	desc: "监听已录制完指定帧大小的文件事件",
	url: {
		original: "https://opendocs.alipay.com/mini/0769wz?pathHash=deb6c70e",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offFrameRecorded": {
	status: 2,
	desc: "取消已录制完指定帧大小的文件事件",
	url: {
		original: "https://opendocs.alipay.com/mini/0769wz?pathHash=deb6c70e",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.onDecibelChange": {
	status: 2,
	desc: "是监听声音分贝变化事件的 API",
	url: {
		original: "https://opendocs.alipay.com/mini/0769wz?pathHash=deb6c70e",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"RecorderManager.offDecibelChange": {
	status: 2,
	desc: "取消监听声音分贝变化事件的 API",
	url: {
		original: "https://opendocs.alipay.com/mini/0769wz?pathHash=deb6c70e",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
}
};

var media$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	chooseImage: chooseImage,
	chooseVideo: chooseVideo,
	compressImage: compressImage,
	getImageInfo: getImageInfo,
	createVideoContext: createVideoContext,
	previewImage: previewImage,
	saveImage: saveImage,
	saveImageToPhotosAlbum: saveImageToPhotosAlbum,
	createCameraContext: createCameraContext,
	getRecorderManager: getRecorderManager,
	'default': media
});

var clearStorage = {
	status: 2,
	desc: "清理本地数据缓存",
	url: {
		original: "https://docs.alipay.com/mini/api/storage",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_clearstorage"
	},
	body: {
	}
};
var clearStorageSync = {
	status: 2,
	desc: "同步清理本地数据缓存",
	url: {
		original: "https://docs.alipay.com/mini/api/ulv85u",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_clearstoragesync"
	},
	body: {
	}
};
var getStorage = {
	status: 0,
	desc: "从本地缓存中异步获取指定 key 的内容",
	url: {
		original: "https://opendocs.alipay.com/mini/api/azfobl?pathHash=1f206486",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_getstorage"
	},
	body: {
	}
};
var getStorageInfo = {
	status: 0,
	desc: "异步获取当前storage的相关信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/zvmanq?pathHash=1fdc3049",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getStorageInfoSync = {
	status: 2,
	desc: "获取当前storage的相关信息",
	url: {
		original: "https://docs.alipay.com/mini/api/uw5rdl",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getStorageSync = {
	status: 0,
	desc: "获取缓存数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ox0wna?pathHash=77549707",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_getstoragesync"
	},
	body: {
	}
};
var getBackgroundFetchData = {
	status: 0,
	desc: "拉取 backgroundFetch 客户端缓存数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/getBackgroundFetchData?pathHash=aee9ff99",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var removeStorage = {
	status: 0,
	desc: "从本地缓存中移除指定 key",
	url: {
		original: "https://opendocs.alipay.com/mini/api/of9hze?pathHash=2f4a0ec6",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_removestorage"
	},
	body: {
	}
};
var removeStorageSync = {
	status: 2,
	desc: "从本地缓存中同步移除指定 key",
	url: {
		original: "https://docs.alipay.com/mini/api/ytfrk4",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_removestoragesync"
	},
	body: {
	}
};
var setStorage = {
	status: 0,
	desc: "将数据存储在本地缓存中指定的 key 中异步接口",
	url: {
		original: "https://opendocs.alipay.com/mini/api/eocm6v?pathHash=0c219376",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_setstorage"
	},
	body: {
	}
};
var setStorageSync = {
	status: 1,
	desc: "将数据存储在本地缓存中指定的 key 中",
	url: {
		original: "https://opendocs.alipay.com/mini/api/cog0du?pathHash=c263bbda",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_storage_setstoragesync"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				key: {
					type: 0,
					desc: "支付宝入参需要将key与data包裹一层对象",
					msg: "入参"
				},
				data: {
					type: 0,
					desc: "支付宝入参需要将key与data包裹一层对象",
					msg: "入参"
				}
			}
		}
	}
};
var storage = {
	clearStorage: clearStorage,
	clearStorageSync: clearStorageSync,
	getStorage: getStorage,
	getStorageInfo: getStorageInfo,
	getStorageInfoSync: getStorageInfoSync,
	getStorageSync: getStorageSync,
	getBackgroundFetchData: getBackgroundFetchData,
	removeStorage: removeStorage,
	removeStorageSync: removeStorageSync,
	setStorage: setStorage,
	setStorageSync: setStorageSync
};

var storage$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	clearStorage: clearStorage,
	clearStorageSync: clearStorageSync,
	getStorage: getStorage,
	getStorageInfo: getStorageInfo,
	getStorageInfoSync: getStorageInfoSync,
	getStorageSync: getStorageSync,
	getBackgroundFetchData: getBackgroundFetchData,
	removeStorage: removeStorage,
	removeStorageSync: removeStorageSync,
	setStorage: setStorage,
	setStorageSync: setStorageSync,
	'default': storage
});

var getFileInfo = {
	status: 1,
	desc: "获取文件信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/file?pathHash=51d0ebd0",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_getfileinfo"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePath: {
					type: 0,
					desc: "要保存的 本地临时文件 路径"
				}
			}
		}
	}
};
var getSavedFileInfo = {
	status: 1,
	desc: "获取保存的文件信息",
	url: {
		original: "https://docs.alipay.com/mini/api/qrx6ze",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_getsavedfileinfo"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePath: {
					type: 0,
					desc: "要保存的 本地临时文件 路径"
				}
			}
		}
	}
};
var getSavedFileList = {
	status: 0,
	desc: "获取保存的所有文件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/cgohg1?pathHash=4566b55a",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_getsavedfilelist"
	},
	body: {
	}
};
var openDocument = {
	status: 1,
	desc: "新开页面打开文档",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mwpprc?pathHash=bb13cfbd",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_myopendocument"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				showMenu: {
					type: 0,
					desc: "是否显示右上角菜单"
				}
			}
		}
	}
};
var removeSavedFile = {
	status: 1,
	desc: "删除本地缓存文件",
	url: {
		original: "https://docs.alipay.com/mini/api/dgi1fr",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_removesavedfile"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePath: {
					type: 0,
					desc: "本地文件缓存路径"
				}
			}
		}
	}
};
var saveFile = {
	status: 1,
	desc: "保存文件到本地",
	url: {
		original: "https://opendocs.alipay.com/mini/api/xbll1q?pathHash=90100f23",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_file_savefile"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePath: {
					type: 0,
					desc: "要保存的 本地临时文件 路径"
				}
			}
		}
	}
};
var getFileSystemManager = {
	status: 0,
	desc: "获取全局唯一的文件管理器",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var file = {
	getFileInfo: getFileInfo,
	"FileSystemManager.getFileInfo": {
	status: 1,
	desc: "获取文件信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/file?pathHash=51d0ebd0",
		target: "",
		overseasUrl: ""
	},
	body: {
		params: {
			props: {
				digestAlgorithm: {
					type: 4,
					desc: "alipay: md5, macle: sha256"
				}
			}
		}
	}
},
	getSavedFileInfo: getSavedFileInfo,
	"FileSystemManager.getSavedFileInfo": {
	status: 1,
	desc: "获取保存的文件信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/qrx6ze?pathHash=551d2f2f",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				apFilePath: {
					type: 0,
					desc: "本地文件缓存路径"
				}
			}
		}
	}
},
	getSavedFileList: getSavedFileList,
	openDocument: openDocument,
	"FileSystemManager.getSavedFileList": {
	status: 0,
	desc: "获取保存的所有文件",
	url: {
		original: "https://docs.alipay.com/mini/api/cgohg1",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	removeSavedFile: removeSavedFile,
	"FileSystemManager.removeSavedFile": {
	status: 0,
	desc: "删除本地缓存文件",
	url: {
		original: "https://docs.alipay.com/mini/api/dgi1fr",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	saveFile: saveFile,
	getFileSystemManager: getFileSystemManager,
	"FileSystemManager.access": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.accessSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.appendFile": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.moveFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.appendFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.close": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.closeSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.copyFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.copyFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.fstat": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.fstatSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.ftruncate": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.ftruncateSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.mkdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.mkdir": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.open": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.openSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readCompressedFile": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readCompressedFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readdir": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.readZipEntry": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.rename": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.renameSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.rmdir": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.rmdirSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.saveFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.saveFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.stat": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.statSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.truncate": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.truncateSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.unlinkSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.unlink": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.unzip": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.writeFile": {
	status: 0,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.writeFileSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"FileSystemManager.writeSync": {
	status: 2,
	desc: "fileSystemManager Operate",
	url: {
		original: "https://opendocs.alipay.com/mini/api/0226od?pathHash=5b08c545",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
}
};

var file$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	getFileInfo: getFileInfo,
	getSavedFileInfo: getSavedFileInfo,
	getSavedFileList: getSavedFileList,
	openDocument: openDocument,
	removeSavedFile: removeSavedFile,
	saveFile: saveFile,
	getFileSystemManager: getFileSystemManager,
	'default': file
});

var chooseLocation = {
	status: 2,
	desc: "打开地图选择位置",
	url: {
		original: "https://docs.alipay.com/mini/api/location",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_location_chooselocation"
	},
	body: {
	}
};
var getLocation = {
	status: 1,
	desc: "获取位置",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mkxuqd?pathHash=d0e13e67",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_location_getlocation"
	},
	body: {
		msg: "参数缺失, 参数type的取值/默认值差异, 返回值缺失/差异",
		params: {
			props: {
				cacheTimeout: {
					type: 0,
					desc: "支付宝客户端经纬度定位缓存过期时间，单位秒"
				},
				type: {
					type: 0,
					desc: "获取经纬度数据的类型"
				}
			}
		},
		returnValue: {
			props: {
				country: {
					type: 0,
					desc: "国家（type>0生效）"
				},
				countryCode: {
					type: 0,
					desc: "国家编号 （type>0生效）"
				},
				province: {
					type: 0,
					desc: "省份（type>0生效）"
				},
				city: {
					type: 0,
					desc: "城市（type>0生效）"
				},
				cityAdcode: {
					type: 0,
					desc: "城市级别的地区代码（type>0生效）"
				},
				district: {
					type: 0,
					desc: "区县（type>0生效）"
				},
				districtAdcode: {
					type: 0,
					desc: "区县级别的地区代码（type>0生效）"
				},
				streetNumber: {
					type: 0,
					desc: "需要街道级别逆地理的才会有的字段,街道门牌信息（type>1生效）"
				},
				pois: {
					type: 0,
					desc: "需要 POI 级别的地理位置才会有的字段，定位点附近的 POI 信息（type>2生效）"
				},
				"error返回值差异": {
					type: 3,
					desc: "app未授权定位：alipay返回错误码11, macle返回errMsg：getLocation:fail 1"
				}
			}
		}
	}
};
var openLocation = {
	status: 2,
	desc: "打开位置",
	url: {
		original: "https://docs.alipay.com/mini/api/as9kin",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_location_openlocation"
	},
	body: {
	}
};
var location = {
	chooseLocation: chooseLocation,
	getLocation: getLocation,
	openLocation: openLocation
};

var location$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	chooseLocation: chooseLocation,
	getLocation: getLocation,
	openLocation: openLocation,
	'default': location
});

var closeSocket = {
	status: 0,
	desc: "关闭 WebSocket 连接",
	url: {
		original: "https://opendocs.alipay.com/mini/api/network?pathHash=2cde4583",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_closesocket"
	},
	body: {
	}
};
var connectSocket = {
	status: 1,
	desc: "创建一个 WebSocket 的连接",
	url: {
		original: "https://opendocs.alipay.com/mini/api/vx19c3?pathHash=d797450d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_connectsocket"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				data: {
					type: 0,
					desc: "请求的参数"
				},
				multiple: {
					type: 0,
					desc: "是否多实例。传入 true 时，将返回一个包含 SocketTask 实例。"
				}
			}
		}
	}
};
var downloadFile = {
	status: 1,
	desc: "下载文件资源到本地",
	url: {
		original: "https://opendocs.alipay.com/mini/api/xr054r?pathHash=43c2e22f",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_downloadfile"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				filePath: {
					type: 0,
					desc: "指定文件下载后存储的路径 (本地路径)"
				}
			}
		},
		returnValue: {
			props: {
				filePath: {
					type: 0,
					desc: "用户文件路径 (本地路径)。传入 filePath 时会返回，跟传入的 filePath 一致"
				}
			}
		}
	}
};
var offSocketClose = {
	status: 2,
	desc: "取消监听 WebSocket 关闭事件",
	url: {
		original: "https://docs.alipay.com/mini/api/qc4q3t",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_offsocketclose"
	},
	body: {
	}
};
var offSocketMessage = {
	status: 2,
	desc: "取消监听 WebSocket 接受到服务器的消息事件",
	url: {
		original: "https://docs.alipay.com/mini/api/qc4q3t",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_offsocketmessage"
	},
	body: {
	}
};
var offSocketOpen = {
	status: 2,
	desc: "取消监听 WebSocket 连接打开事件",
	url: {
		original: "https://docs.alipay.com/mini/api/qc4q3t",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_offsocketopen"
	},
	body: {
	}
};
var offSocketError = {
	status: 2,
	desc: "取消监听 WebSocket 错误",
	url: {
		original: "https://docs.alipay.com/mini/api/qc4q3t",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_offsocketerror"
	},
	body: {
	}
};
var onSocketClose = {
	status: 0,
	desc: "监听WebSocket关闭",
	url: {
		original: "https://docs.alipay.com/mini/api/foqk6g",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_onsocketclose"
	},
	body: {
	}
};
var onSocketError = {
	status: 0,
	desc: "监听WebSocket错误",
	url: {
		original: "https://opendocs.alipay.com/mini/api/giu3c2?pathHash=5a8153dd",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_onsocketerror"
	},
	body: {
	}
};
var onSocketMessage = {
	status: 1,
	desc: "监听WebSocket接受到服务器的消息事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/gecnap?pathHash=f739d5da",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_onsocketmessage"
	},
	body: {
		msg: "返回值属性缺失",
		returnValue: {
			props: {
				isBuffer: {
					type: 0,
					desc: "如果此字段值为true，data字段表示接收到的经过了 base64 编码后的 String，否则 data 字段表示接收到的普通 String 文本"
				}
			}
		}
	}
};
var onSocketOpen = {
	status: 0,
	desc: "监听WebSocket连接打开事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/itm5og?pathHash=6e7bb32d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_onsocketopen"
	},
	body: {
	}
};
var request = {
	status: 1,
	desc: "发起 HTTPS 网络请求",
	url: {
		original: "https://opendocs.alipay.com/mini/api/owycmh?pathHash=c91640f8",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_request"
	},
	body: {
		msg: "入参参数名称差异/参数缺失/返回值名称差异",
		params: {
			props: {
				headers: {
					type: 0,
					desc: "alipay: headers, macle: header",
					msg: "header"
				},
				referrerStyle: {
					type: 0,
					desc: "referer 样式，用于控制当前请求 header 对象中 referer 字段格式。"
				},
				enableCookie: {
					type: 0,
					desc: "是否手工设置 cookie。"
				},
				enableHttp2: {
					type: 0,
					desc: "开启 HTTP/2"
				}
			}
		},
		returnValue: {
			props: {
				status: {
					type: 1,
					desc: "alipay: status, macle: statusCode"
				},
				headers: {
					type: 1,
					desc: "alipay: headers, macle: header"
				}
			}
		}
	}
};
var sendSocketMessage = {
	status: 1,
	desc: "通过 WebSocket 连接发送数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mr91d1?pathHash=7260c692",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_sendsocketmessage"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				isBuffer: {
					type: 0,
					desc: "如果发送二进制数据,需要将入参数据经 Base64 编码成 String 后赋值 data,同时将此字段设置为 true。如果是普通的文本内容 String,则不需要设置此字段。"
				}
			}
		}
	}
};
var uploadFile = {
	status: 1,
	desc: "上传本地资源到开发者服务器",
	url: {
		original: "https://opendocs.alipay.com/mini/api/kmq4hc?pathHash=d7112e87",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_network_uploadfile"
	},
	body: {
		msg: "参数名称差异/缺失",
		params: {
			props: {
				fileName: {
					type: 1,
					desc: "文件对应的key，开发者在服务端可以通过这个key获取文件的二进制内容, alipay:fileName, macle: name",
					msg: "name"
				},
				fileType: {
					type: 0,
					desc: "文件类型支持图片、视频、音频"
				},
				hideLoading: {
					type: 0,
					desc: "是否隐藏 loading 动画"
				}
			}
		}
	}
};
var network = {
	closeSocket: closeSocket,
	connectSocket: connectSocket,
	downloadFile: downloadFile,
	"DownloadTask.abort": {
	status: 0,
	desc: "中断下载任务",
	url: {
		original: "https://opendocs.alipay.com/mini/075mtz?pathHash=07d28db0",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"DownloadTask.onProgressUpdate": {
	status: 0,
	desc: "监听下载进度变化事件",
	url: {
		original: "https://opendocs.alipay.com/mini/075pjl?pathHash=b52433b8",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"DownloadTask.offProgressUpdate": {
	status: 0,
	desc: "移除下载进度变化事件的监听函数",
	url: {
		original: "https://opendocs.alipay.com/mini/075s7g?pathHash=dbdc1e46",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"DownloadTask.onHeadersReceived": {
	status: 2,
	desc: "监听 HTTP Response Header 事件",
	url: {
		original: "https://opendocs.alipay.com/mini/07f9ms",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"DownloadTask.offHeadersReceived": {
	status: 2,
	desc: "移除 HTTP Response Header 事件的监听函数",
	url: {
		original: "https://opendocs.alipay.com/mini/07f9ms",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	offSocketClose: offSocketClose,
	offSocketMessage: offSocketMessage,
	offSocketOpen: offSocketOpen,
	offSocketError: offSocketError,
	onSocketClose: onSocketClose,
	onSocketError: onSocketError,
	onSocketMessage: onSocketMessage,
	onSocketOpen: onSocketOpen,
	request: request,
	sendSocketMessage: sendSocketMessage,
	uploadFile: uploadFile
};

var network$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	closeSocket: closeSocket,
	connectSocket: connectSocket,
	downloadFile: downloadFile,
	offSocketClose: offSocketClose,
	offSocketMessage: offSocketMessage,
	offSocketOpen: offSocketOpen,
	offSocketError: offSocketError,
	onSocketClose: onSocketClose,
	onSocketError: onSocketError,
	onSocketMessage: onSocketMessage,
	onSocketOpen: onSocketOpen,
	request: request,
	sendSocketMessage: sendSocketMessage,
	uploadFile: uploadFile,
	'default': network
});

var canIUse = {
	status: 0,
	desc: "判断当前小程序的 API、入参或返回值、组件、属性等在当前版本是否支持",
	url: {
		original: "https://docs.alipay.com/mini/api/can-i-use",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_basic_caniuse"
	},
	body: {
	}
};
var SDKVersion = {
	status: 2,
	desc: "获取基础库版本号",
	url: {
		original: "https://docs.alipay.com/mini/api/sdk-version",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_basic_sdkversion"
	},
	body: {
	}
};
var getSystemInfo = {
	status: 1,
	desc: "获取手机系统信息",
	url: {
		original: "https://docs.alipay.com/mini/api/system-info",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_system_getsysteminfo"
	},
	body: {
		msg: "返回值参数缺失",
		returnValue: {
			props: {
				storage: {
					type: 0,
					desc: "设备磁盘容量"
				},
				currentBattery: {
					type: 0,
					desc: "当前电量百分比"
				},
				version: {
					type: 0,
					desc: "支付宝版本号。"
				},
				platform: {
					type: 0,
					desc: "系统名：Android，iOS / iPhone OS"
				},
				titleBarHeight: {
					type: 0,
					desc: "标题栏高度。"
				},
				screen: {
					type: 0,
					desc: "屏幕宽度和高度。结构为： { width: Number, height: Number } 单位：px。"
				},
				fontSizeSetting: {
					type: 0,
					desc: "用户设置字体大小。单位：px"
				},
				app: {
					type: 0,
					desc: "当前运行的客户端。若当前为支付宝，则有效值为 alipay。不同的客户端，对应的有效值类似如下：alipay：支付宝。UC：UC浏览器。。"
				}
			}
		}
	}
};
var getSystemInfoSync = {
	status: 1,
	desc: "获取手机系统信息的同步接口",
	url: {
		original: "https://docs.alipay.com/mini/api/gawhvz",
		target: "",
		overseasUrl: ""
	},
	body: {
		msg: "返回值参数缺失",
		returnValue: {
			props: {
				storage: {
					type: 0,
					desc: "设备磁盘容量"
				},
				currentBattery: {
					type: 0,
					desc: "当前电量百分比"
				},
				version: {
					type: 0,
					desc: "支付宝版本号。"
				},
				platform: {
					type: 0,
					desc: "系统名：Android，iOS / iPhone OS"
				},
				titleBarHeight: {
					type: 0,
					desc: "标题栏高度。"
				},
				screen: {
					type: 0,
					desc: "屏幕宽度和高度。结构为： { width: Number, height: Number } 单位：px。"
				},
				fontSizeSetting: {
					type: 0,
					desc: "用户设置字体大小。单位：px"
				},
				app: {
					type: 0,
					desc: "当前运行的客户端。若当前为支付宝，则有效值为 alipay。不同的客户端，对应的有效值类似如下：alipay：支付宝。UC：UC浏览器。。"
				}
			}
		}
	}
};
var getNetworkType = {
	status: 1,
	desc: "获取当前网络状态",
	url: {
		original: "https://opendocs.alipay.com/mini/api/network-status?pathHash=b4ec188d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_network_getnetworktype"
	},
	body: {
		msg: "返回值属性缺失/属性取值不同",
		returnValue: {
			props: {
				networkAvailable: {
					type: 0,
					desc: "网络是否可用"
				},
				networkType: {
					type: 1,
					desc: "alipay: WIFI/2G/3G/4G/UNKNOWN/NOTREACHABLE, macle: wifi/2g/3g/4g/unknown/none"
				}
			}
		}
	}
};
var offNetworkStatusChange = {
	status: 0,
	desc: "取消监听网络状态变化",
	url: {
		original: "https://opendocs.alipay.com/mini/api/gxpg1w?pathHash=3989bb98",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onNetworkStatusChange = {
	status: 0,
	desc: "开始监听网络状态变化",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ympi0l?pathHash=df0ed184",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getClipboard = {
	status: 1,
	desc: "获取剪贴板数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/clipboard?pathHash=6dbfcfb3",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_clipboard_getclipboard"
	},
	body: {
		type: 1,
		value: "getClipboardData",
		msg: "命名不同/参数缺失",
		returnValue: {
			props: {
				text: {
					type: 1,
					desc: "剪贴板数据"
				}
			}
		}
	}
};
var setClipboard = {
	status: 1,
	desc: "设置剪贴板数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/klbkbp?pathHash=7437d5b0",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_clipboard_setclipboard"
	},
	body: {
		type: 1,
		value: "setClipboardData",
		msg: "命名不同/参数缺失",
		params: {
			text: {
				type: 1,
				desc: "剪贴板数据"
			}
		}
	}
};
var watchShake = {
	status: 2,
	desc: "摇一摇功能",
	url: {
		original: "https://docs.alipay.com/mini/api/shake",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_watch-shake_watchshake"
	},
	body: {
	}
};
var vibrate = {
	status: 2,
	desc: "调用振动功能",
	url: {
		original: "https://docs.alipay.com/mini/api/vibrate",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_vibrate_vibrate"
	},
	body: {
	}
};
var vibrateLong = {
	status: 0,
	desc: "较长时间的振动 (400ms)",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ucm2he?pathHash=90fbfa94",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var vibrateShort = {
	status: 0,
	desc: "较短时间的振动",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ad6c10?pathHash=3d79c3f1",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onAccelerometerChange = {
	status: 2,
	desc: "监听加速度数据，回调间隔为 500ms，接口调用后会自动开始监听",
	url: {
		original: "https://docs.alipay.com/mini/api/accelerometer",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_accelerometer_onaccelerometerchange"
	},
	body: {
	}
};
var offAccelerometerChange = {
	status: 2,
	desc: "停止监听加速度数据",
	url: {
		original: "https://docs.alipay.com/mini/api/kape7p",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_accelerometer_offaccelerometerchange"
	},
	body: {
	}
};
var onGyroscopeChange = {
	status: 0,
	desc: "监听陀螺仪数据变化事件，接口调用后会自动开始监听，回调间隔为500ms",
	url: {
		original: "https://opendocs.alipay.com/mini/api/gyroscope?pathHash=037e68f0",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var offGyroscopeChange = {
	status: 0,
	desc: "停止监听陀螺仪数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/cpt55i?pathHash=8c754de5",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onCompassChange = {
	status: 2,
	desc: "监听罗盘数据变化事件",
	url: {
		original: "https://docs.alipay.com/mini/api/compass",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_compass_oncompasschange"
	},
	body: {
	}
};
var offCompassChange = {
	status: 2,
	desc: "停止监听罗盘数据",
	url: {
		original: "https://docs.alipay.com/mini/api/xf671t",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_compass_offcompasschange"
	},
	body: {
	}
};
var makePhoneCall = {
	status: 1,
	desc: "拨打电话",
	url: {
		original: "https://opendocs.alipay.com/mini/api/make-call?pathHash=6ead5d68",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_call_makephonecall"
	},
	body: {
		msg: "入参参数名称差异",
		params: {
			props: {
				number: {
					type: 0,
					desc: "提示的内容, alipay: number, macle: phoneNumber",
					msg: "phoneNumber"
				}
			}
		}
	}
};
var getServerTime = {
	status: 2,
	desc: "获取当前服务器时间的毫秒数",
	url: {
		original: "https://docs.alipay.com/mini/api/get-server-time",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_server_getservertime"
	},
	body: {
	}
};
var onUserCaptureScreen = {
	status: 2,
	desc: "用于监听用户发起的主动截屏事件，可以接收到系统以及第三方截屏工具的截屏事件通知",
	url: {
		original: "https://docs.alipay.com/mini/api/user-capture-screen",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_capture_onusercapturescreen"
	},
	body: {
	}
};
var offUserCaotureScreen = {
	status: 2,
	desc: "取消监听截屏事件",
	url: {
		original: "https://docs.alipay.com/mini/api/umdxbg",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_capture_offusercapturescreen"
	},
	body: {
	}
};
var getScreenBrightness = {
	status: 0,
	desc: "获取屏幕亮度",
	url: {
		original: "https://opendocs.alipay.com/mini/api/screen-brightness?pathHash=9cd1e748",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_screen_getscreenbrightness"
	},
	body: {
	}
};
var setScreenBrightness = {
	status: 1,
	desc: "设置屏幕亮度",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ccf32t?pathHash=931f5006",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_screen_setscreenbrightness"
	},
	body: {
		msg: "参数差异",
		params: {
			props: {
				brightness: {
					type: 0,
					desc: "需要设置的屏幕亮度，取值范围 0-1。"
				}
			}
		}
	}
};
var setKeepScreenOn = {
	status: 0,
	desc: "设置是否保持屏幕长亮状态",
	url: {
		original: "https://opendocs.alipay.com/mini/api/qx0sap?pathHash=2cb38ae2",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_screen_setkeepscreenon"
	},
	body: {
	}
};
var getSetting = {
	status: 1,
	desc: "获取用户的当前设置，返回值中只会出现小程序已经向用户请求过的权限",
	url: {
		original: "https://opendocs.alipay.com/mini/api/xmk3ml?pathHash=2fa68375",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_setting_getsetting"
	},
	body: {
		params: {
			props: {
				withSubscriptions: {
					type: 0,
					desc: "是否同时获取用户订阅消息的订阅状态"
				}
			}
		}
	}
};
var openSetting = {
	status: 1,
	desc: "打开小程序设置界面，返回用户权限设置的结果",
	url: {
		original: "https://opendocs.alipay.com/mini/api/qflu8f?pathHash=72b90b6d",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_setting_opensetting"
	},
	body: {
		params: {
			props: {
				withSubscriptions: {
					type: 0,
					desc: "是否同时获取用户订阅消息的订阅状态"
				}
			}
		}
	}
};
var addPhoneContact = {
	status: 2,
	desc: "用户可以选择将该表单以“创建新联系人”或“添加到现有联系人”的方式，写入到手机系统的通讯录",
	url: {
		original: "https://docs.alipay.com/mini/api/contact",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_add-contact_addphonecontact"
	},
	body: {
	}
};
var getBatteryInfo = {
	status: 0,
	desc: "获取设备电量。",
	url: {
		original: "https://opendocs.alipay.com/mini/api/nrnziy?pathHash=148d90e6",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_battery_getbatteryinfo"
	},
	body: {
	}
};
var showAuthGuide = {
	status: 2,
	desc: "通过权限引导模块以图文等形式向用户弹出 Dialog，引导用户打开相应的权限",
	url: {
		original: "https://docs.alipay.com/mini/api/show-auth-guide",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_permission_showauthguide"
	},
	body: {
	}
};
var scan = {
	status: 1,
	desc: "调用扫一扫功能",
	url: {
		original: "https://opendocs.alipay.com/mini/api/scan?pathHash=38ef54f5",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_scan_scan"
	},
	body: {
		type: 1,
		value: "scanCode",
		msg: "命名不同/参数差异/返回值差异",
		params: {
			props: {
				type: {
					type: 3,
					desc: "扫码样式, alipay: 可选值[qrCode,barCode,dmCode,pdf417Code,narrowCode,hmCode], macle: 可选值[barCode,qrCode,datamatrix,pdf417]"
				}
			}
		},
		returnValue: {
			props: {
				code: {
					type: 1,
					desc: "扫码所得数据, alipay: code, macle: result"
				},
				qrCOde: {
					type: 0,
					desc: "扫描二维码时返回二维码数据"
				},
				barCode: {
					type: 0,
					desc: "扫描条形码时返回条形码数据"
				}
			}
		}
	}
};
var startGyroscope = {
	status: 0,
	desc: "开始监听陀螺仪数据",
	url: {
		original: "https://opendocs.alipay.com/mini/022kkm?pathHash=dc630fce",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var stopGyroscope = {
	status: 0,
	desc: "停止监听陀螺仪数据。",
	url: {
		original: "https://opendocs.alipay.com/mini/022hgn?pathHash=40ad5b1e",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onMemoryWarning = {
	status: 0,
	desc: "开始监听内存不足的告警事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/rb9o8p?pathHash=c7a55420",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_memory-warning_onmemorywarning"
	},
	body: {
	}
};
var offMemoryWarning = {
	status: 0,
	desc: "停止监听内存不足的告警事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/hszexr?pathHash=cea1fded",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_memory-warning_offmemorywarning"
	},
	body: {
	}
};
var getBatterytInfo = {
	status: 2,
	desc: "获取电量的异步接口",
	url: {
		original: "https://docs.alipay.com/mini/api/nrnziy",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_battery_getbatteryinfo"
	},
	body: {
	}
};
var getBatteryInfoSync = {
	status: 2,
	desc: "获取电量的同步接口",
	url: {
		original: "https://docs.alipay.com/mini/api/vf7vn3",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_battery_getbatteryinfosync"
	},
	body: {
	}
};
var connectBLEDevice = {
	status: 2,
	desc: "连接低功耗蓝牙设备",
	url: {
		original: "https://docs.alipay.com/mini/api/tmew6e",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_connectbledevice"
	},
	body: {
	}
};
var disconnectBLEDevice = {
	status: 2,
	desc: "断开与低功耗蓝牙设备的连接",
	url: {
		original: "https://docs.alipay.com/mini/api/yqrmmk",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_disconnectbledevice"
	},
	body: {
	}
};
var getBLEDeviceCharacteristics = {
	status: 0,
	desc: "获取蓝牙设备所有 characteristic（特征值）",
	url: {
		original: "https://opendocs.alipay.com/mini/api/fmg9gg?pathHash=cb9309e9",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_getbledevicecharacteristics"
	},
	body: {
	}
};
var getBLEDeviceServices = {
	status: 0,
	desc: "获取蓝牙设备所有 service（服务）",
	url: {
		original: "https://opendocs.alipay.com/mini/api/uzsg75?pathHash=546301c1",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_getbledeviceservices"
	},
	body: {
	}
};
var notifyBLECharacteristicValueChange = {
	status: 2,
	desc: "启用低功耗蓝牙设备特征值变化时的 notify 功能",
	url: {
		original: "https://docs.alipay.com/mini/api/pdzk44",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_notifyblecharacteristicvaluechange"
	},
	body: {
	}
};
var offBLECharacteristicValueChange = {
	status: 2,
	desc: "监听低功耗蓝牙设备的特征值变化的事件",
	url: {
		original: "https://docs.alipay.com/mini/api/dlxobk",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_notifyblecharacteristicvaluechange"
	},
	body: {
	}
};
var offBLEConnectionStateChanged = {
	status: 2,
	desc: "取消低功耗蓝牙连接状态变化事件的监听",
	url: {
		original: "https://docs.alipay.com/mini/api/xfuy7k",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_offbleconnectionstatechanged"
	},
	body: {
	}
};
var onBLECharacteristicValueChange = {
	status: 2,
	desc: "监听低功耗蓝牙设备的特征值变化的事件",
	url: {
		original: "https://docs.alipay.com/mini/api/cdu501",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_onblecharacteristicvaluechange"
	},
	body: {
	}
};
var onBLEConnectionStateChanged = {
	status: 2,
	desc: "监听低功耗蓝牙连接的错误事件，包括设备丢失，连接异常断开等",
	url: {
		original: "https://docs.alipay.com/mini/api/utgyiu",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_onbleconnectionstatechanged"
	},
	body: {
	}
};
var readBLECharacteristicValue = {
	status: 2,
	desc: "读取低功耗蓝牙设备特征值中的数据",
	url: {
		original: "https://docs.alipay.com/mini/api/zro0ka",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_readblecharacteristicvalue"
	},
	body: {
	}
};
var writeBLECharacteristicValue = {
	status: 0,
	desc: "向低功耗蓝牙设备特征值中写入数据",
	url: {
		original: "https://opendocs.alipay.com/mini/api/vmp2r4?pathHash=182c39a8",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_ble_writeblecharacteristicvalue"
	},
	body: {
	}
};
var closeBluetoothAdapter = {
	status: 0,
	desc: "关闭本机蓝牙模块",
	url: {
		original: "https://docs.alipay.com/mini/api/wvko0w",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_closebluetoothadapter"
	},
	body: {
	}
};
var getBluetoothAdapterState = {
	status: 2,
	desc: "获取本机蓝牙模块状态",
	url: {
		original: "https://docs.alipay.com/mini/api/eid4o6",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_getbluetoothadapterstate"
	},
	body: {
	}
};
var getBluetoothDevices = {
	status: 2,
	desc: "获取所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备",
	url: {
		original: "https://docs.alipay.com/mini/api/pelizr",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getConnectedBluetoothDevices = {
	status: 2,
	desc: "获取处于已连接状态的设备",
	url: {
		original: "https://docs.alipay.com/mini/api/ge8nue",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_getconnectedbluetoothdevices"
	},
	body: {
	}
};
var offBluetoothAdapterStateChange = {
	status: 2,
	desc: "移除本机蓝牙状态变化的事件的监听",
	url: {
		original: "https://docs.alipay.com/mini/api/ocgwfe",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_offbluetoothadapterstatechange"
	},
	body: {
	}
};
var offBluetoothDeviceFound = {
	status: 0,
	desc: "移除寻找到新的蓝牙设备事件的监听",
	url: {
		original: "https://opendocs.alipay.com/mini/api/snw2t7?pathHash=9cb47ff3",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_offbluetoothdevicefound"
	},
	body: {
	}
};
var onBluetoothDeviceFound = {
	status: 0,
	desc: "搜索到新的蓝牙设备时触发此事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/mhzls9?pathHash=6413bfc6",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_onbluetoothdevicefound"
	},
	body: {
	}
};
var onBluetoothAdapterStateChange = {
	status: 2,
	desc: "监听本机蓝牙状态变化的事件",
	url: {
		original: "https://docs.alipay.com/mini/api/eegfbk",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_onbluetoothadapterstatechange"
	},
	body: {
	}
};
var openBluetoothAdapter = {
	status: 1,
	desc: "初始化小程序蓝牙模块",
	url: {
		original: "https://opendocs.alipay.com/mini/api/kunuy4?pathHash=3e9844f8",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_openbluetoothadapter"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				autoClose: {
					type: 0,
					desc: "表示是否在离开当前页面时自动断开蓝牙.注意：仅支持 Android 系统。"
				}
			}
		}
	}
};
var startBluetoothDevicesDiscovery = {
	status: 1,
	desc: "开始搜寻附近的蓝牙外围设备",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ksew43?pathHash=e52c7470",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_startbluetoothdevicesdiscovery"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				allowDuplicatesKey: {
					type: 0,
					desc: "是否允许重复上报同一设备。"
				},
				interval: {
					type: 0,
					desc: "上报设备的间隔"
				}
			}
		}
	}
};
var stopBluetoothDevicesDiscovery = {
	status: 0,
	desc: "停止搜寻附近的蓝牙外围设备",
	url: {
		original: "https://opendocs.alipay.com/mini/api/syb4mi?pathHash=eac2156a",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_device_bluetooth_bluetooth_stopbluetoothdevicesdiscovery"
	},
	body: {
	}
};
var getBeacons = {
	status: 2,
	desc: "获取已经搜索到的 iBeacon 设备",
	url: {
		original: "https://docs.alipay.com/mini/api/yqleyc",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onBeaconServiceChange = {
	status: 2,
	desc: "监听 iBeacon 服务的状态变化",
	url: {
		original: "https://docs.alipay.com/mini/api/rq1dl7",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var onBeaconUpdate = {
	status: 2,
	desc: "监听 iBeacon 设备的更新事件",
	url: {
		original: "https://docs.alipay.com/mini/api/kvdg9y",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var startBeaconDiscovery = {
	status: 2,
	desc: "开始搜索附近的 iBeacon 设备",
	url: {
		original: "https://docs.alipay.com/mini/api/cy1g7k",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var stopBeaconDiscovery = {
	status: 2,
	desc: "停止搜索附近的 iBeacon 设备",
	url: {
		original: "https://docs.alipay.com/mini/api/yp5owa",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var equipment = {
	canIUse: canIUse,
	SDKVersion: SDKVersion,
	getSystemInfo: getSystemInfo,
	getSystemInfoSync: getSystemInfoSync,
	getNetworkType: getNetworkType,
	offNetworkStatusChange: offNetworkStatusChange,
	onNetworkStatusChange: onNetworkStatusChange,
	getClipboard: getClipboard,
	setClipboard: setClipboard,
	watchShake: watchShake,
	vibrate: vibrate,
	vibrateLong: vibrateLong,
	vibrateShort: vibrateShort,
	onAccelerometerChange: onAccelerometerChange,
	offAccelerometerChange: offAccelerometerChange,
	onGyroscopeChange: onGyroscopeChange,
	offGyroscopeChange: offGyroscopeChange,
	onCompassChange: onCompassChange,
	offCompassChange: offCompassChange,
	makePhoneCall: makePhoneCall,
	getServerTime: getServerTime,
	onUserCaptureScreen: onUserCaptureScreen,
	offUserCaotureScreen: offUserCaotureScreen,
	getScreenBrightness: getScreenBrightness,
	setScreenBrightness: setScreenBrightness,
	setKeepScreenOn: setKeepScreenOn,
	getSetting: getSetting,
	openSetting: openSetting,
	addPhoneContact: addPhoneContact,
	getBatteryInfo: getBatteryInfo,
	showAuthGuide: showAuthGuide,
	scan: scan,
	startGyroscope: startGyroscope,
	stopGyroscope: stopGyroscope,
	onMemoryWarning: onMemoryWarning,
	offMemoryWarning: offMemoryWarning,
	getBatterytInfo: getBatterytInfo,
	getBatteryInfoSync: getBatteryInfoSync,
	connectBLEDevice: connectBLEDevice,
	disconnectBLEDevice: disconnectBLEDevice,
	getBLEDeviceCharacteristics: getBLEDeviceCharacteristics,
	getBLEDeviceServices: getBLEDeviceServices,
	notifyBLECharacteristicValueChange: notifyBLECharacteristicValueChange,
	offBLECharacteristicValueChange: offBLECharacteristicValueChange,
	offBLEConnectionStateChanged: offBLEConnectionStateChanged,
	onBLECharacteristicValueChange: onBLECharacteristicValueChange,
	onBLEConnectionStateChanged: onBLEConnectionStateChanged,
	readBLECharacteristicValue: readBLECharacteristicValue,
	writeBLECharacteristicValue: writeBLECharacteristicValue,
	closeBluetoothAdapter: closeBluetoothAdapter,
	getBluetoothAdapterState: getBluetoothAdapterState,
	getBluetoothDevices: getBluetoothDevices,
	getConnectedBluetoothDevices: getConnectedBluetoothDevices,
	offBluetoothAdapterStateChange: offBluetoothAdapterStateChange,
	offBluetoothDeviceFound: offBluetoothDeviceFound,
	onBluetoothDeviceFound: onBluetoothDeviceFound,
	onBluetoothAdapterStateChange: onBluetoothAdapterStateChange,
	openBluetoothAdapter: openBluetoothAdapter,
	startBluetoothDevicesDiscovery: startBluetoothDevicesDiscovery,
	stopBluetoothDevicesDiscovery: stopBluetoothDevicesDiscovery,
	getBeacons: getBeacons,
	onBeaconServiceChange: onBeaconServiceChange,
	onBeaconUpdate: onBeaconUpdate,
	startBeaconDiscovery: startBeaconDiscovery,
	stopBeaconDiscovery: stopBeaconDiscovery
};

var equipment$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	canIUse: canIUse,
	SDKVersion: SDKVersion,
	getSystemInfo: getSystemInfo,
	getSystemInfoSync: getSystemInfoSync,
	getNetworkType: getNetworkType,
	offNetworkStatusChange: offNetworkStatusChange,
	onNetworkStatusChange: onNetworkStatusChange,
	getClipboard: getClipboard,
	setClipboard: setClipboard,
	watchShake: watchShake,
	vibrate: vibrate,
	vibrateLong: vibrateLong,
	vibrateShort: vibrateShort,
	onAccelerometerChange: onAccelerometerChange,
	offAccelerometerChange: offAccelerometerChange,
	onGyroscopeChange: onGyroscopeChange,
	offGyroscopeChange: offGyroscopeChange,
	onCompassChange: onCompassChange,
	offCompassChange: offCompassChange,
	makePhoneCall: makePhoneCall,
	getServerTime: getServerTime,
	onUserCaptureScreen: onUserCaptureScreen,
	offUserCaotureScreen: offUserCaotureScreen,
	getScreenBrightness: getScreenBrightness,
	setScreenBrightness: setScreenBrightness,
	setKeepScreenOn: setKeepScreenOn,
	getSetting: getSetting,
	openSetting: openSetting,
	addPhoneContact: addPhoneContact,
	getBatteryInfo: getBatteryInfo,
	showAuthGuide: showAuthGuide,
	scan: scan,
	startGyroscope: startGyroscope,
	stopGyroscope: stopGyroscope,
	onMemoryWarning: onMemoryWarning,
	offMemoryWarning: offMemoryWarning,
	getBatterytInfo: getBatterytInfo,
	getBatteryInfoSync: getBatteryInfoSync,
	connectBLEDevice: connectBLEDevice,
	disconnectBLEDevice: disconnectBLEDevice,
	getBLEDeviceCharacteristics: getBLEDeviceCharacteristics,
	getBLEDeviceServices: getBLEDeviceServices,
	notifyBLECharacteristicValueChange: notifyBLECharacteristicValueChange,
	offBLECharacteristicValueChange: offBLECharacteristicValueChange,
	offBLEConnectionStateChanged: offBLEConnectionStateChanged,
	onBLECharacteristicValueChange: onBLECharacteristicValueChange,
	onBLEConnectionStateChanged: onBLEConnectionStateChanged,
	readBLECharacteristicValue: readBLECharacteristicValue,
	writeBLECharacteristicValue: writeBLECharacteristicValue,
	closeBluetoothAdapter: closeBluetoothAdapter,
	getBluetoothAdapterState: getBluetoothAdapterState,
	getBluetoothDevices: getBluetoothDevices,
	getConnectedBluetoothDevices: getConnectedBluetoothDevices,
	offBluetoothAdapterStateChange: offBluetoothAdapterStateChange,
	offBluetoothDeviceFound: offBluetoothDeviceFound,
	onBluetoothDeviceFound: onBluetoothDeviceFound,
	onBluetoothAdapterStateChange: onBluetoothAdapterStateChange,
	openBluetoothAdapter: openBluetoothAdapter,
	startBluetoothDevicesDiscovery: startBluetoothDevicesDiscovery,
	stopBluetoothDevicesDiscovery: stopBluetoothDevicesDiscovery,
	getBeacons: getBeacons,
	onBeaconServiceChange: onBeaconServiceChange,
	onBeaconUpdate: onBeaconUpdate,
	startBeaconDiscovery: startBeaconDiscovery,
	stopBeaconDiscovery: stopBeaconDiscovery,
	'default': equipment
});

var rsa = {
	status: 2,
	desc: "非对称加密",
	url: {
		original: "https://docs.alipay.com/mini/api/data-safe",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var data = {
	rsa: rsa
};

var data$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	rsa: rsa,
	'default': data
});

var hideShareMenu$1 = {
	status: 2,
	desc: "隐藏分享按钮",
	url: {
		original: "https://docs.alipay.com/mini/api/share_app",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var showSharePanel = {
	status: 2,
	desc: "唤起分享面板",
	url: {
		original: "https://docs.alipay.com/mini/api/omg2ye",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_share_showsharepanel"
	},
	body: {
	}
};
var onShareAppMessage = {
	status: 2,
	desc: "在 Page 中定义 onShareAppMessage 函数，设置该页面的分享信息",
	url: {
		original: "https://docs.alipay.com/mini/api/vn576p",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var share = {
	hideShareMenu: hideShareMenu$1,
	showSharePanel: showSharePanel,
	onShareAppMessage: onShareAppMessage
};

var share$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	hideShareMenu: hideShareMenu$1,
	showSharePanel: showSharePanel,
	onShareAppMessage: onShareAppMessage,
	'default': share
});

var hideAddToDesktopMenu = {
	status: 2,
	desc: "隐藏当前页面通用菜单中的添加到桌面功能",
	url: {
		original: "https://docs.alipay.com/mini/api/optionmenuitem",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var hideAllAddToDesktopMenu = {
	status: 2,
	desc: "隐藏所有页面的通用菜单中的 添加到桌面 功能",
	url: {
		original: "https://docs.alipay.com/mini/api/fdaplu",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var hideAllFavoriteMenu = {
	status: 2,
	desc: "隐藏所有页面的通用菜单中的 收藏 功能",
	url: {
		original: "https://docs.alipay.com/mini/api/glp0w0",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var hideFavoriteMenu = {
	status: 2,
	desc: "隐藏当前页面的通用菜单中的 收藏 按钮",
	url: {
		original: "https://docs.alipay.com/mini/api/avtg7h",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var hideShareMenu = {
	status: 2,
	desc: "隐藏当前页面右上角通用菜单中的 分享 功能",
	url: {
		original: "https://docs.alipay.com/mini/api/aimaqk",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var menu = {
	hideAddToDesktopMenu: hideAddToDesktopMenu,
	hideAllAddToDesktopMenu: hideAllAddToDesktopMenu,
	hideAllFavoriteMenu: hideAllFavoriteMenu,
	hideFavoriteMenu: hideFavoriteMenu,
	hideShareMenu: hideShareMenu
};

var menu$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	hideAddToDesktopMenu: hideAddToDesktopMenu,
	hideAllAddToDesktopMenu: hideAllAddToDesktopMenu,
	hideAllFavoriteMenu: hideAllFavoriteMenu,
	hideFavoriteMenu: hideFavoriteMenu,
	hideShareMenu: hideShareMenu,
	'default': menu
});

var getRunScene = {
	status: 2,
	desc: "用于获取当前小程序的运行版本",
	url: {
		original: "https://docs.alipay.com/mini/api/runscene",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_basic_getrunscene"
	},
	body: {
	}
};
var edition = {
	getRunScene: getRunScene
};

var edition$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	getRunScene: getRunScene,
	'default': edition
});

var reportAnalytics = {
	status: 2,
	desc: "自定义分析数据的上报接口",
	url: {
		original: "https://docs.alipay.com/mini/api/report",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var analysis = {
	reportAnalytics: reportAnalytics
};

var analysis$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	reportAnalytics: reportAnalytics,
	'default': analysis
});

var getUpdateManager = {
	status: 0,
	desc: "创建一个 UpdateManager 对象，获取全局唯一的版本更新管理器，用于管理小程序更新",
	url: {
		original: "https://opendocs.alipay.com/mini/api/zdblqg?pathHash=c9b8da23",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_update_getupdatemanager"
	},
	body: {
	}
};
var update = {
	getUpdateManager: getUpdateManager,
	"UpdateManager.applyUpdate": {
	status: 0,
	desc: "强制小程序重启并使用新版本",
	url: {
		original: "https://opendocs.alipay.com/mini/api/neau2a?pathHash=c60ef579",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_update_updatemanager_applyupdate"
	},
	body: {
	}
},
	"UpdateManager.onCheckForUpdate": {
	status: 0,
	desc: "监听后台请求检查更新结果事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/nm7dtb?pathHash=74b8b5f5",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_update_updatemanager_checkupdate"
	},
	body: {
	}
},
	"UpdateManager.onUpdateReady": {
	status: 0,
	desc: "监听小程序有版本更新事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/gfz316?pathHash=033a1006",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_update_updatemanager_updateready"
	},
	body: {
	}
},
	"UpdateManager.onUpdateFailed": {
	status: 0,
	desc: "监听小程序更新失败事件",
	url: {
		original: "https://opendocs.alipay.com/mini/api/sy1k0e?pathHash=a66a7cf4",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_update_updatemanager_updatefail"
	},
	body: {
	}
}
};

var update$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	getUpdateManager: getUpdateManager,
	'default': update
});

var getAuthCode = {
	status: 1,
	desc: "获取授权码",
	url: {
		original: "https://opendocs.alipay.com/mini-game/08v96k?pathHash=75b68418",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_openapi_getauthcode"
	},
	body: {
		msg: "参数差异/返回值属性缺失",
		params: {
			props: {
				scopes: {
					type: 3,
					desc: "alipay: 类型为Array/string,枚举值全小写; macle: Array,枚举值全大写"
				}
			}
		},
		returnValue: {
			props: {
				authCode: {
					type: 1,
					desc: "授权码",
					msg: "Code"
				},
				authErrorScopes: {
					type: 0,
					desc: "失败的授权类型，key 是授权失败的 scope，value 是对应的错误码。"
				},
				authSuccessScopes: {
					type: 0,
					desc: "成功的授权 scope。"
				}
			}
		}
	}
};
var getOpenUserInfo = {
	status: 1,
	desc: "获取支付宝会员的基础信息",
	url: {
		original: "https://opendocs.alipay.com/mini/api/ch8chh?pathHash=fc7858b8",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_openapi_getopenuserinfo"
	},
	body: {
		msg: "返回值差异",
		returnValue: {
			props: {
				nickName: {
					type: 1,
					desc: "用户昵称，以res作为返回值为例: alipay: res.nickName, macle: res.userInfo.nickName"
				},
				avatar: {
					type: 1,
					desc: "用户头像url，以res作为返回值为例: alipay: res.avatar, macle: res.userInfo.avatar"
				}
			}
		}
	}
};
var getAddress = {
	status: 2,
	desc: "获取用户收货地址",
	url: {
		original: "https://opendocs.alipay.com/mini/api/lymgfk",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var getPhoneNumber = {
	status: 2,
	desc: "获取支付宝用户绑定的手机号",
	url: {
		original: "https://docs.alipay.com/mini/api/getphonenumber",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var tradePay = {
	status: 0,
	desc: "发起支付",
	url: {
		original: "https://docs.alipay.com/mini/api/openapi-pay",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_openapi_tradepay"
	},
	body: {
	}
};
var openCardDetail = {
	status: 2,
	desc: "打开当前用户的某张卡的详情页",
	url: {
		original: "https://docs.alipay.com/mini/api/card-voucher-ticket",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openCardList = {
	status: 0,
	desc: "打开支付宝卡列表",
	url: {
		original: "https://docs.alipay.com/mini/api/qxxpsh",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openKBVoucherDetail = {
	status: 2,
	desc: "打开当前用户的某张券的（口碑）详情页",
	url: {
		original: "https://docs.alipay.com/mini/api/tfa5s0",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openMerchantCardList = {
	status: 2,
	desc: "打开当前用户的某个商户的卡列表",
	url: {
		original: "https://docs.alipay.com/mini/api/axfplw",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openMerchantVoucherList = {
	status: 2,
	desc: "打开当前用户的某个商户的券列表",
	url: {
		original: "https://docs.alipay.com/mini/api/sgvgu6",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openTicketDetail = {
	status: 2,
	desc: "打开当前用户的某张票的详情页",
	url: {
		original: "https://docs.alipay.com/mini/api/ry7ftz",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openTicketList = {
	status: 2,
	desc: "打开支付宝票列表",
	url: {
		original: "https://docs.alipay.com/mini/api/ezt6u3",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openMerchantTicketList = {
	status: 2,
	desc: "打开某个商户的票列表",
	url: {
		original: "https://docs.alipay.com/mini/api/yee76y",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openVoucherDetail = {
	status: 2,
	desc: "打开当前用户的某张券的（口碑）详情页",
	url: {
		original: "https://docs.alipay.com/mini/api/ga4obi",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openVoucherList = {
	status: 2,
	desc: "打开支付宝券列表",
	url: {
		original: "https://docs.alipay.com/mini/api/vq3mgn",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var addCardAuth = {
	status: 2,
	desc: "小程序唤起会员开卡授权页面",
	url: {
		original: "https://docs.alipay.com/mini/api/add-card-auth",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var startZMVerify = {
	status: 2,
	desc: "芝麻认证接口，调用此接口可以唤起芝麻认证页面并进行人脸身份验证",
	url: {
		original: "https://docs.alipay.com/mini/api/zm-service",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var textRiskIdentification = {
	status: 2,
	desc: "对用户在使用小程序过程产生用户原创内容（UGC）进行风险识别",
	url: {
		original: "https://docs.alipay.com/mini/api/text-identification",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var navigateBackMiniProgram = {
	status: 2,
	desc: "跳转回上一个小程序，只有当另一个小程序跳转到当前小程序时才会能调用成功",
	url: {
		original: "https://docs.alipay.com/mini/api/open-miniprogram",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_openapi_navigatebackminiprogram"
	},
	body: {
	}
};
var navigateToMiniProgram = {
	status: 1,
	desc: "跳转到其他小程序",
	url: {
		original: "https://opendocs.alipay.com/mini/api/yz6gnx?pathHash=36bd7c7c",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_openapi_navigatetominiprogram"
	},
	body: {
		msg: "参数缺失",
		params: {
			props: {
				extraData: {
					type: 0,
					desc: "传递给目标小程序的额外数据"
				},
				query: {
					type: 0,
					desc: "传给目标小程序启动参数的query字段"
				}
			}
		}
	}
};
var createWebViewContext = {
	status: 2,
	desc: "通过创建 webviewContext 提供从小程序向 web-view 发送消息的能力",
	url: {
		original: "https://docs.alipay.com/mini/api/webview-context",
		target: "",
		overseasUrl: "https://miniprogram.alipay.com/docs/miniprogram/mpdev/api_web-view_createwebviewcontext"
	},
	body: {
	}
};
var getRunData = {
	status: 2,
	desc: "获取用户一天内支付宝运动的步数信息",
	url: {
		original: "https://docs.alipay.com/mini/api/gxuu7v",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
};
var openAbility = {
	getAuthCode: getAuthCode,
	getOpenUserInfo: getOpenUserInfo,
	getAddress: getAddress,
	getPhoneNumber: getPhoneNumber,
	tradePay: tradePay,
	"alipay.open.app.qrcode.create": {
	status: 2,
	desc: "生成小程序推广二维码",
	url: {
		original: "https://docs.alipay.com/mini/api/openapi-qrcode",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	openCardDetail: openCardDetail,
	openCardList: openCardList,
	openKBVoucherDetail: openKBVoucherDetail,
	openMerchantCardList: openMerchantCardList,
	openMerchantVoucherList: openMerchantVoucherList,
	openTicketDetail: openTicketDetail,
	openTicketList: openTicketList,
	openMerchantTicketList: openMerchantTicketList,
	openVoucherDetail: openVoucherDetail,
	openVoucherList: openVoucherList,
	addCardAuth: addCardAuth,
	startZMVerify: startZMVerify,
	"alipay.open.app.mini.templatemessage.send": {
	status: 2,
	desc: "小程序通过openapi给用户触达消息",
	url: {
		original: "https://docs.alipay.com/mini/api/templatemessage",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	textRiskIdentification: textRiskIdentification,
	navigateBackMiniProgram: navigateBackMiniProgram,
	navigateToMiniProgram: navigateToMiniProgram,
	createWebViewContext: createWebViewContext,
	"ap.navigateToAlipayPage": {
	status: 2,
	desc: "小程序中跳转到支付宝官方业务或运营活动页面，例如共享单车、城市服务",
	url: {
		original: "https://docs.alipay.com/mini/api/navigatetoalipaypage",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	"ap.updateAlipayClient": {
	status: 2,
	desc: "打开支付宝客户端升级界面，用户可主动选择升级支付宝客户端",
	url: {
		original: "https://docs.alipay.com/mini/api/updatealipayclient",
		target: "",
		overseasUrl: ""
	},
	body: {
	}
},
	getRunData: getRunData
};

var openAbility$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	getAuthCode: getAuthCode,
	getOpenUserInfo: getOpenUserInfo,
	getAddress: getAddress,
	getPhoneNumber: getPhoneNumber,
	tradePay: tradePay,
	openCardDetail: openCardDetail,
	openCardList: openCardList,
	openKBVoucherDetail: openKBVoucherDetail,
	openMerchantCardList: openMerchantCardList,
	openMerchantVoucherList: openMerchantVoucherList,
	openTicketDetail: openTicketDetail,
	openTicketList: openTicketList,
	openMerchantTicketList: openMerchantTicketList,
	openVoucherDetail: openVoucherDetail,
	openVoucherList: openVoucherList,
	addCardAuth: addCardAuth,
	startZMVerify: startZMVerify,
	textRiskIdentification: textRiskIdentification,
	navigateBackMiniProgram: navigateBackMiniProgram,
	navigateToMiniProgram: navigateToMiniProgram,
	createWebViewContext: createWebViewContext,
	getRunData: getRunData,
	'default': openAbility
});

var require$$0 = getCjsExportFromNamespace(basic$1);

var require$$1 = getCjsExportFromNamespace(view$1);

var require$$2 = getCjsExportFromNamespace(media$1);

var require$$3 = getCjsExportFromNamespace(storage$1);

var require$$4 = getCjsExportFromNamespace(file$1);

var require$$5 = getCjsExportFromNamespace(location$1);

var require$$6 = getCjsExportFromNamespace(network$1);

var require$$7 = getCjsExportFromNamespace(equipment$1);

var require$$8 = getCjsExportFromNamespace(data$1);

var require$$9 = getCjsExportFromNamespace(share$1);

var require$$10 = getCjsExportFromNamespace(menu$1);

var require$$11 = getCjsExportFromNamespace(edition$1);

var require$$12 = getCjsExportFromNamespace(analysis$1);

var require$$13 = getCjsExportFromNamespace(update$1);

var require$$14 = getCjsExportFromNamespace(openAbility$1);

const apiInfo$1 = [{
  name: '基础',
  type: 'basic',
  body: require$$0
}, {
  name: '界面',
  type: 'view',
  body: require$$1
}, {
  name: '媒体',
  type: 'media',
  body: require$$2
}, {
  name: '缓存',
  type: 'storage',
  body: require$$3
}, {
  name: '文件',
  type: 'file',
  body: require$$4
}, {
  name: '位置',
  type: 'location',
  body: require$$5
}, {
  name: '网络',
  type: 'network',
  body: require$$6
}, {
  name: '设备',
  type: 'equipment',
  body: require$$7
}, {
  name: '数据相关',
  type: 'data',
  body: require$$8
}, {
  name: '分享',
  type: 'share',
  body: require$$9
}, {
  name: '自定义通用菜单',
  type: 'menu',
  body: require$$10
}, {
  name: '小程序当前运行版本类型',
  type: 'edition',
  body: require$$11
}, {
  name: '自定义分析',
  type: 'analysis',
  body: require$$12
}, {
  name: '更新管理',
  type: 'update',
  body: require$$13
}, {
  name: '开放能力API',
  type: 'openAbility',
  body: require$$14
}];
let descObject = {};
apiInfo$1.forEach(apiItem => {
  descObject = Object.assign(descObject, apiItem.body);
});
var apiInfo_1 = {
  apiInfo: apiInfo$1,
  descObject
};
apiInfo_1.apiInfo;
apiInfo_1.descObject;

const {
  parseAppJs
} = compilejs;
const apiInfo = apiInfo_1.descObject;
const {
  getNonsupportApiConfigMap,
  mkParamsConfigMap
} = makeConfig;
const apiConfigMap = {};
const nonsupportApiConfigMap = {};
const diffApiMap = {};
mkParamsConfigMap(apiInfo, apiConfigMap);
getNonsupportApiConfigMap(apiInfo, nonsupportApiConfigMap, diffApiMap);
commonjsGlobal.aliNonsupportApiConfigMap = nonsupportApiConfigMap;
commonjsGlobal.aliDiffApiMap = diffApiMap;
commonjsGlobal.aliApiConfigMap = apiConfigMap;
commonjsGlobal.aliWholeApi = apiInfo;
var compileJs = function (fileInfo, originCode, apis, apisLine) {
  const parseCode = parseAppJs(originCode, apis, apisLine);
  fsExtra__default["default"].outputFileSync(fileInfo.dist, parseCode);
};

var pages = {
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	type: 7,
	status: 0,
	desc: "设置页面路径"
};
var window$1 = {
	name: "用于对小程序进行全局配置，设置页面文件的路径、窗口表现、网络超时时间、多 tab 等",
	url: {
		original: "https://docs.alipay.com/mini/framework/app-json",
		target: ""
	},
	desc: "window 用于设置小程序的状态栏、导航条、标题、窗口背景色等。",
	status: 1,
	props: {
		defaultTitle: {
			type: 1,
			status: 0,
			desc: "页面默认标题",
			msg: "navigationBarTitleText"
		},
		pullRefresh: {
			type: 1,
			status: 0,
			desc: "是否允许下拉刷新。默认NO",
			msg: "enablePullDownRefresh"
		},
		allowsBounceVertical: {
			type: 0,
			status: 2,
			desc: "是否允许向下拉拽。默认 YES",
			msg: "暂不支持"
		},
		transparentTitle: {
			type: 0,
			status: 2,
			desc: "导航栏透明设置。默认 none",
			msg: "暂不支持"
		},
		titlePenetrate: {
			type: 0,
			status: 2,
			desc: "是否允许导航栏点击穿透。默认 NO",
			msg: "暂不支持"
		},
		showTitleLoading: {
			type: 0,
			status: 2,
			desc: "是否进入时显示导航栏的 loading。默认 NO",
			msg: "暂不支持"
		},
		titleImage: {
			type: 0,
			status: 2,
			desc: "导航栏图片地址",
			msg: "暂不支持"
		},
		titleBarColor: {
			type: 1,
			status: 0,
			desc: "页面的背景色",
			msg: "navigationBarBackgroundColor"
		},
		backgroundColor: {
			type: 7,
			status: 0,
			desc: "窗口的背景色"
		},
		backgroundImageColor: {
			type: 0,
			status: 2,
			desc: "下拉露出显示的背景图底色",
			msg: "暂不支持"
		},
		backgroundImageUrl: {
			type: 0,
			status: 2,
			desc: "下拉露出显示的背景图链接",
			msg: "暂不支持"
		},
		gestureBack: {
			type: 0,
			status: 2,
			desc: "iOS 用，是否支持手势返回。默认 NO，支持 YES / NO",
			msg: "暂不支持"
		},
		enableScrollBar: {
			type: 0,
			status: 2,
			desc: "Android 用，是否显示 WebView 滚动条",
			msg: "暂不支持"
		}
	}
};
var tabBar = {
	status: 1,
	name: "底部 tab 栏的表现",
	url: {
		original: "https://docs.alipay.com/mini/framework/app-json",
		target: ""
	},
	desc: "如果小程序是一个多 tab 应用（客户端窗口的底部或顶部有 tab 栏可以切换页面），可以通过 tabBar 配置项指定 tab 栏的表现，以及 tab 切换时显示的对应页面。",
	props: {
		textColor: {
			type: 1,
			status: 0,
			desc: "tab 上的文字默认颜色，仅支持十六进制颜色",
			msg: "color"
		},
		selectedColor: {
			type: 7,
			status: 0,
			desc: "选中文字颜色"
		},
		backgroundColor: {
			type: 7,
			status: 0,
			desc: "tab 的背景色，仅支持十六进制颜色"
		},
		items: {
			name: "每个 tab 配置",
			type: 1,
			status: 0,
			desc: "tab 的列表",
			msg: "list",
			props: {
				pagePath: {
					type: 7,
					status: 0,
					desc: "设置页面路径"
				},
				name: {
					type: 1,
					status: 0,
					desc: "tab 名称",
					msg: "text"
				},
				icon: {
					type: 1,
					status: 0,
					desc: "平常图标路径",
					msg: "iconPath"
				},
				activeIcon: {
					type: 1,
					status: 0,
					desc: "高亮图标路径",
					msg: "selectedIconPath"
				}
			}
		}
	}
};
var globalconfig$1 = {
	pages: pages,
	window: window$1,
	tabBar: tabBar
};

var globalconfig$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	pages: pages,
	window: window$1,
	tabBar: tabBar,
	'default': globalconfig$1
});

var globalconfig = getCjsExportFromNamespace(globalconfig$2);

const tabbarConfigMap = {};
const windowConfigMap$1 = {};
const windowProps = globalconfig.window.props;
const tabBarProps = globalconfig.tabBar.props;
function mkJsonMap$1(props, targetJson) {
  Object.keys(props).forEach(prop => {
    const value = props[prop];
    if (value.type === 1) {
      targetJson[prop] = value.msg;
    }
  });
}
mkJsonMap$1(windowProps, windowConfigMap$1);
mkJsonMap$1(tabBarProps, tabbarConfigMap);
mkJsonMap$1(tabBarProps.items.props, tabbarConfigMap);
function replaceTheKey$1(obj, configMap) {
  if (!obj) {
    return false;
  }
  Object.keys(obj).forEach(key => {
    const _key = configMap[key];
    if (_key) {
      obj[_key] = obj[key];
      delete obj[key];
    }
  });
  return obj;
}
var appJson_1 = function (str) {
  const json = JSON.parse(str);
  const tabBar = json.tabBar;
  if (tabBar) {
    replaceTheKey$1(tabBar, tabbarConfigMap);
    const list = tabBar.list || [];
    list.forEach(item => {
      for (const key in item) {
        if (tabbarConfigMap[key]) {
          item[tabbarConfigMap[key]] = item[key];
          delete item[key];
        }
      }
    });
  }
  replaceTheKey$1(json.window, windowConfigMap$1);
  return JSON.stringify(json);
};

var optionMenu = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "设置导航栏额外图标，目前支持设置属性 icon，值为图标 url（以 https/http 开头）或 base64 字符串，大小建议 30*30 px",
	msg: "暂不支持"
};
var defaultTitle = {
	type: 1,
	status: 0,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "页面默认标题",
	msg: "navigationBarTitleText"
};
var pullRefresh = {
	type: 1,
	status: 0,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "是否允许下拉刷新。默认NO",
	msg: "enablePullDownRefresh"
};
var allowsBounceVertical = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "是否允许向下拉拽。默认 YES",
	msg: "暂不支持"
};
var titlePenetrate = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "是否允许导航栏点击穿透。默认 NO",
	msg: "暂不支持"
};
var showTitleLoading = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "是否进入时显示导航栏的 loading。默认 NO",
	msg: "暂不支持"
};
var titleImage = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "导航栏图片地址",
	msg: "暂不支持"
};
var titleBarColor = {
	type: 1,
	status: 0,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "页面的背景色",
	msg: "navigationBarBackgroundColor"
};
var backgroundColor = {
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	type: 7,
	status: 0,
	desc: "窗口的背景色"
};
var backgroundImageColor = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "下拉露出显示的背景图底色",
	msg: "暂不支持"
};
var backgroundImageUrl = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "下拉露出显示的背景图链接",
	msg: "暂不支持"
};
var gestureBack = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "iOS 用，是否支持手势返回。默认 NO，支持 YES / NO",
	msg: "暂不支持"
};
var enableScrollBar = {
	type: 0,
	status: 2,
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	desc: "Android 用，是否显示 WebView 滚动条",
	msg: "暂不支持"
};
var usingComponents = {
	url: {
		original: "https://docs.alipay.com/mini/framework/page-json",
		target: ""
	},
	type: 7,
	status: 0,
	desc: "页面自定义组件配置"
};
var pageconfig$1 = {
	optionMenu: optionMenu,
	defaultTitle: defaultTitle,
	pullRefresh: pullRefresh,
	allowsBounceVertical: allowsBounceVertical,
	titlePenetrate: titlePenetrate,
	showTitleLoading: showTitleLoading,
	titleImage: titleImage,
	titleBarColor: titleBarColor,
	backgroundColor: backgroundColor,
	backgroundImageColor: backgroundImageColor,
	backgroundImageUrl: backgroundImageUrl,
	gestureBack: gestureBack,
	enableScrollBar: enableScrollBar,
	usingComponents: usingComponents
};

var pageconfig$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	optionMenu: optionMenu,
	defaultTitle: defaultTitle,
	pullRefresh: pullRefresh,
	allowsBounceVertical: allowsBounceVertical,
	titlePenetrate: titlePenetrate,
	showTitleLoading: showTitleLoading,
	titleImage: titleImage,
	titleBarColor: titleBarColor,
	backgroundColor: backgroundColor,
	backgroundImageColor: backgroundImageColor,
	backgroundImageUrl: backgroundImageUrl,
	gestureBack: gestureBack,
	enableScrollBar: enableScrollBar,
	usingComponents: usingComponents,
	'default': pageconfig$1
});

var pageconfig = getCjsExportFromNamespace(pageconfig$2);

const windowConfigMap = {};
function mkJsonMap(props, targetJson) {
  Object.keys(props).forEach(prop => {
    const value = props[prop];
    if (value.type === 1) {
      targetJson[prop] = value.msg;
    }
  });
}
mkJsonMap(globalconfig.window.props, windowConfigMap);
mkJsonMap(pageconfig, windowConfigMap);
function replaceTheKey(obj, configMap) {
  if (!obj) {
    return false;
  }
  Object.keys(obj).forEach(key => {
    const _key = configMap[key];
    if (_key) {
      obj[_key] = obj[key];
      delete obj[key];
    }
  });
  return obj;
}
var pageJson_1 = function (jsonStr, fileInfo) {
  if (!jsonStr) {
    return '';
  }
  const json = JSON.parse(jsonStr);
  replaceTheKey(json, windowConfigMap);
  return JSON.stringify(json);
};

/**
 * type
 * 0 - missing - 不支持该属性
 * 1 - diff - 命名及格式不同
 * 3 - diffType - 类型不同
 * 4 - defaultValue - 默认值不同
 * 6 - diff tagName
 * 7 - equal - 完全支持
 *
 * status - 支持程度
 * 0 - 完整支持
 * 1 - 部分支持
 * 2 - 不支持
 */

var config = {
  globalconfig,
  pageconfig,
  components: componentsInfo,
  apis: apiInfo_1
};
config.globalconfig;
config.pageconfig;
config.components;
config.apis;

const {
  emptyFiles,
  prettierCode: prettierCode$1,
  isTypeFile,
  record: record$1,
  red: red$1,
  magenta
} = utils;
const {
  transformEs5
} = babel_1;
const project = {
  name: '',
  path: '',
  distPath: '',
  fileNum: 0,
  pageNum: 0
};
const {
  report: report$1
} = reportMethods;
const statFileNameArr = [];
let readtimes = 0;
const convertorCount = {
  axmlFailLineCount: 0,
  jsFailLineCount: 0,
  jsonFailLineCount: 0,
  fileTotalLineCount: 0
};
let finishFile = 0;
let projectParents = '';
// 输出日志数据
let repData$1 = {};
function isAlipayApp(dirname) {
  const appJs = path__default["default"].join(dirname, './app.js');
  const appCss = path__default["default"].join(dirname, './app.acss');
  const appJson = path__default["default"].join(dirname, './app.json');
  return fsExtra__default["default"].pathExistsSync(appJs) && fsExtra__default["default"].pathExistsSync(appCss) && fsExtra__default["default"].pathExistsSync(appJson);
}
function compilingJson(fileInfo, pathinfo, reportData) {
  const {
    getJsonDiff,
    getOthersFile
  } = record$1(config);
  let content;
  if (fileInfo.deep === 0 && fileInfo.filename === 'app.json') {
    content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    const jsonData = getJsonDiff(pathinfo, content, convertorCount);
    repData$1.transforms = Object.assign(repData$1.transforms, jsonData);
    content = appJson_1(content);
    const app = JSON.parse(content);
    let dirnameArr = fileInfo.dirname.split('/');
    if (dirnameArr.length <= 1) {
      dirnameArr = dirnameArr[0].split(path__default["default"].sep);
    }
    try {
      project.name = app.window.navigationBarTitleText || dirnameArr[dirnameArr.length - 1];
    } catch (error) {
      project.name = dirnameArr[dirnameArr.length - 1];
    }
    const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    convertorCount.fileTotalLineCount += originCode.split(/\n/).length;
  } else if (fileInfo.deep > 0 && fileInfo.extname === '.json') {
    content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    const jsonData = getJsonDiff(pathinfo, content, convertorCount);
    content = pageJson_1(content);
    repData$1.transforms = Object.assign(repData$1.transforms, jsonData);
    const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
    convertorCount.fileTotalLineCount += originCode.split(/\n/).length;
  } else {
    const otherData = getOthersFile(pathinfo);
    repData$1.transforms = Object.assign(repData$1.transforms, otherData);
    content = fsExtra__default["default"].readFileSync(fileInfo.path);
  }
  content = prettierCode$1(content, 'json', {
    useTabs: true,
    tabWidth: 4
  });
  fsExtra__default["default"].outputFileSync(fileInfo.dist, content);
  report$1(new Date(), reportData);
}
const exportObj$1 = {
  defaultOptions: {
    exclude: ['node_modules', 'miniprogram_npm', '.mini-ide', '.tea']
  },
  beforeParse(next) {
    if (!isAlipayApp(this.$options.entry)) {
      const errStr = `[Ops] ${this.$options.entry} is not a alipay miniproramm directory.`;
      logManager_1.log(red$1(errStr));
      throw new Error(errStr);
    }
    project.fileNum = 0;
    next();
  },
  onParsing(fileInfo) {
    const {
      resultDataInit
    } = record$1(config);
    repData$1 = resultDataInit();
    if (fileInfo.type === 'file') {
      project.fileNum++;
      if (fileInfo.filename === 'app.json') {
        project.path = fileInfo.dirname;
        const distPath = fileInfo.dist.split('app.json')[0];
        project.distPath = distPath.substr(0, distPath.length - 1);
      }
    }
    if (isTypeFile('.axml', fileInfo.path)) {
      const ast = parse_1.parseFile(fileInfo.path);
      fileInfo.ast = ast;
    }
  },
  onCompiling(fileInfo, ctx) {
    if (fileInfo.type !== 'file') {
      fsExtra__default["default"].ensureDirSync(fileInfo.dist);
      return;
    }
    let date = new Date();
    let reportData = {
      info: fileInfo.dirname,
      type: 'parse',
      length: project.fileNum,
      nums: finishFile
    };
    if (!fileInfo.parent) {
      readtimes = 0;
      let pathArr = fileInfo.path.split(path__default["default"].sep);
      if (pathArr.length < 3) {
        pathArr = pathArr[0].split('/');
      }
      pathArr = [...new Set(pathArr)];
      projectParents = pathArr[pathArr.length - 3];
      let pathParentArr = fileInfo.path.split(projectParents);
      reportData.info = pathParentArr[pathParentArr.length - 1].substr(1);
      report$1(date, reportData);
    }
    if (statFileNameArr.indexOf(fileInfo.dirname) === -1) {
      reportData.info = fileInfo.dirname.split(projectParents)[1].substr(1);
      report$1(date, reportData);
      statFileNameArr.push(fileInfo.dirname);
      readtimes = 0;
    }
    readtimes++;
    const {
      getTemplateDataDiff,
      getStyleData,
      getCustomScript,
      getScriptData
    } = record$1(config);
    let pathParentArr = fileInfo.path.split(projectParents);
    const pathinfo = pathParentArr[pathParentArr.length - 1].substr(1);
    reportData = {
      info: pathinfo,
      type: 'compile',
      length: project.fileNum,
      nums: finishFile
    };
    if (isTypeFile('.axml', fileInfo.path)) {
      const projectname = fileInfo.entry;
      const reptempData = getTemplateDataDiff(fileInfo, projectname);
      compileAxml(fileInfo, convertorCount);
      repData$1.transforms = Object.assign(repData$1.transforms, reptempData);
      date = report$1(date, reportData);
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      convertorCount.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile('.acss', fileInfo.path)) {
      compileAcss(fileInfo, ctx);
      const reptempData = getStyleData(pathinfo);
      date = report$1(date, reportData);
      repData$1.transforms = Object.assign(repData$1.transforms, reptempData);
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      convertorCount.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile('.js', fileInfo.path)) {
      const originCode = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8');
      const alipayOriginCode = originCode;
      const apis = {};
      const apisLine = {};
      compileJs(fileInfo, originCode, apis, apisLine);
      date = report$1(date, reportData);
      const reptempData = getScriptData(pathinfo, apis, alipayOriginCode, 'my');
      repData$1.transforms = Object.assign(repData$1.transforms, reptempData);
      let lineCount = 0;
      Object.keys(apisLine).forEach(apiName => {
        const api = apisLine[apiName];
        if (api.start && api.end) {
          lineCount += originCode.substring(api.start, api.end).split(/\n/).length;
        }
      });
      convertorCount.jsFailLineCount += lineCount;
      convertorCount.fileTotalLineCount += originCode.split(/\n/).length;
    } else if (isTypeFile('.sjs', fileInfo.path)) {
      let content = fsExtra__default["default"].readFileSync(fileInfo.path, 'utf8') || '';
      const reptempData = getCustomScript(pathinfo);
      repData$1.transforms = Object.assign(repData$1.transforms, reptempData);
      date = report$1(date, reportData);
      content = transformEs5(content);
      fsExtra__default["default"].outputFileSync(fileInfo.dist, content);
    } else {
      compilingJson(fileInfo, pathinfo, reportData);
    }
    // 记录当前处理完成的文件数目
    finishFile++;
    const generateData = {
      info: pathinfo,
      type: 'generate',
      length: project.fileNum,
      nums: finishFile
    };
    if (fileInfo.parent && readtimes === fileInfo.parent ? fileInfo.parent.children.length : undefined) {
      generateData.info = fileInfo.dirname.split(projectParents)[1].substr(1);
    }
    report$1(new Date(), generateData);
  },
  compiled(ctx) {
    projectConfigJson(ctx);
    const {
      statisticsAndReport
    } = record$1();
    statisticsAndReport(project, repData$1, ctx.output, convertorCount, this.$options.isAutoOpenReport, this.$options.extensionPath, this.$options.lan);
    logManager_1.log(`js文件转换失败行数：    ${magenta(convertorCount.jsFailLineCount)}`);
    logManager_1.log(`axml文件转换失败行数：  ${magenta(convertorCount.axmlFailLineCount)}`);
    logManager_1.log(`acss文件转换失败行数：  ${magenta(0)}`);
    logManager_1.log(`json文件转换失败行数：  ${magenta(convertorCount.jsonFailLineCount)}`);
    logManager_1.log(`转换文件总行数：        ${magenta(convertorCount.fileTotalLineCount)}`);
  }
};
var lifecycle$1 = exportObj$1;

var alipayMaclePlugin = {
  name: 'ali-macle',
  lifeCycles: lifecycle$1
};
alipayMaclePlugin.name;
alipayMaclePlugin.lifeCycles;

var alipayMacle = function (sourceDir, targetDir, isAutoOpenReport = true, extensionPath = '', lan = 'zh') {
  const App = convertor$1();
  const opts = {
    dist: targetDir,
    entry: sourceDir,
    type: 'ali-macle',
    isAutoOpenReport,
    extensionPath,
    lan
  };
  App.use(alipayMaclePlugin, opts).start();
};

const {
  prettierCode
} = utils;
var macleConfigJson = function (ctx) {
  let filePath = '';
  if (ctx.$options.ifGenerate) {
    filePath = `${ctx.$options.dist}${path__default["default"].sep}app${path__default["default"].sep}.macle.config.json`;
  } else {
    filePath = `${ctx.$options.dist}${path__default["default"].sep}.macle.config.json`;
  }
  if (!fsExtra__default["default"].pathExistsSync(`${ctx.$options.entry}${path__default["default"].sep}.macle.config.json`)) {
    return;
  }
  let content = fsExtra__default["default"].readFileSync(`${ctx.$options.entry}${path__default["default"].sep}.macle.config.json`, 'utf-8');
  const json = JSON.parse(content);
  const distPath = json.buildDist.split(ctx.$options.entry)[1] || '';
  json.buildDist = ctx.$options.ifGenerate ? `${ctx.$options.dist}${path__default["default"].sep}app${distPath}` : ctx.$options.dist + distPath;
  content = JSON.stringify(json);
  content = prettierCode(content, 'json', {
    useTabs: true,
    tabWidth: 4
  });
  fsExtra__default["default"].outputFileSync(filePath, content);
};

const {
  report
} = reportMethods;
const {
  record
} = utils;

// 输出日志数据
let repData = {};
function judgeDirSame(entry, output) {
  return entry === output;
}
const exportObj = {
  defaultOptions: {
    exclude: []
  },
  beforeParse(next) {
    const {
      resultDataInit
    } = record();
    repData = resultDataInit();
    this.$options.entry;
    this.$options.dist;
    const pathArr = this.$options.entry.split(path__default["default"].sep);
    pathArr[pathArr.length - 1];
    next();
  },
  onParsing(fileInfo) {
    if (fileInfo.type === 'file') {
      let reptempData = {
        [fileInfo.path]: {
          status: 1
        }
      };
      repData.transforms = Object.assign(repData.transforms, reptempData);
    }
  },
  // this.$options.type === 'h5-macle' && judgeDirSame(this.$options.entry, this.$options.dist)才会进入onCompiling
  onCompiling(fileInfo, ctx) {
    let outPath = '';
    if (this.$options.ifGenerate) {
      outPath = path__default["default"].join(this.$options.dist, './app', fileInfo.path.split(fileInfo.entry)[1]);
    } else {
      outPath = path__default["default"].join(this.$options.dist, fileInfo.path.split(fileInfo.entry)[1]);
    }
    const date = new Date();
    const reportData = {
      info: fileInfo.path,
      type: 'parse'
    };
    report(date, reportData);
    const originCode = fsExtra__default["default"].readFileSync(fileInfo.path);
    const _reportData = {
      info: fileInfo.path,
      type: 'compile'
    };
    report(date, _reportData);
    fsExtra__default["default"].outputFileSync(outPath, originCode);
    const generateData = {
      info: fileInfo.path,
      type: 'generate'
    };
    report(date, generateData);
  },
  compiled(ctx) {
    const date = new Date();
    let jsonPath = '';
    if (this.$options.extensionPath) {
      jsonPath = path__default["default"].join(this.$options.extensionPath, '/node_modules/@macle/convertor/dist/app-config.json');
    } else {
      jsonPath = path__default["default"].join(__dirname, './app-config.json');
    }
    const originalCode = fsExtra__default["default"].readFileSync(jsonPath, 'utf-8');
    const obj = JSON.parse(originalCode);
    obj.entryPagePath = this.$options.entryPagePath.replace(/\\/g, '/');
    let outPath = '';
    let configParam;
    if (judgeDirSame(this.$options.entry, this.$options.dist)) {
      outPath = path__default["default"].join(this.$options.dist, './app-config.json');
      configParam = Object.assign({}, ctx);
    } else if (this.$options.ifGenerate) {
      outPath = path__default["default"].join(this.$options.dist, './app', './app-config.json');
      configParam = Object.assign({}, ctx, {
        output: `${ctx.output}${path__default["default"].sep}app`
      });
    } else {
      outPath = path__default["default"].join(this.$options.dist, './app-config.json');
      configParam = Object.assign({}, ctx);
    }
    if (!fs__default["default"].existsSync(`${this.$options.entry}${path__default["default"].sep}app-config.json`)) {
      let pages = [];
      pages = this.$options.pages.map(item => item.replace(/\\/g, '/'));
      obj.pages = pages;
      const res = JSON.stringify(obj);
      fsExtra__default["default"].outputFileSync(outPath, res);
    }
    const generateData = {
      info: 'app-config.json',
      type: 'generate'
    };
    report(date, generateData);
    projectConfigJson(configParam);
    macleConfigJson(ctx);
  }
};
var lifecycle = exportObj;

var h5MaclePlugin = {
  name: 'h5-macle',
  lifeCycles: lifecycle
};
h5MaclePlugin.name;
h5MaclePlugin.lifeCycles;

var h5Macle = function (sourceDir, targetDir, ...args) {
  let [isAutoOpenReport = true, extensionPath, lan, ifGenerate, appid, entryPagePath, pages] = args;
  const App = convertor$1();
  App.use(h5MaclePlugin, {
    entry: sourceDir,
    dist: targetDir,
    type: 'h5-macle',
    entryPagePath,
    isAutoOpenReport,
    pages,
    extensionPath,
    appid,
    ifGenerate
  }).start();
};

const typeInfo = {
  'wx-macle': {
    plugin: wxMacle,
    callName: 'wx'
  },
  'ali-macle': {
    plugin: alipayMacle,
    callName: 'my'
  },
  'h5-macle': {
    plugin: h5Macle,
    callName: 'h5'
  }
};
var cli = typeInfo;

const {
  red
} = utils;

/**
 * 微信和支付宝只用前六个参数
 * @param {string} type 
 * @param {string} input 
 * @param {string} output 
 * @param {boolean} isAutoOpenReport 
 * @param {string} extensionPath 
 * @param {string} language 'zh' 'en'
 * @param {boolean} ifGenerate
 * @param {string} appid
 * @param {string} entryPagePath 
 * @param {[string]} pages 
 * @returns 
 */

function convertor(type, input, output, ...args) {
  const [isAutoOpenReport = true, extensionPath = '', lan = 'zh', ifGenerate = true, appid = '', entryPagePath, pages] = args;
  return new Promise((resolve, reject) => {
    try {
      if (cli[type]) {
        if (type !== 'h5-macle' && input === output) {
          logManager_1.log(red('输入输出目录不能为同一个地址。'));
          reject(new Error('输入输出目录不能为同一个地址。'));
          return;
        }
        commonjsGlobal.type = cli[type].callName;
        cli[type]['plugin'](input, output, isAutoOpenReport, extensionPath, lan, ifGenerate, appid, entryPagePath, pages);
        resolve();
      } else {
        logManager_1.log(red('编译类型存在错误，请选择可用的转换类型。'));
        reject(new Error('编译类型错误，请选择可用的转换类型。'));
      }
    } catch (err) {
      reject(err);
    }
  });
}
var macleConvertor = {
  convertor
};
var macleConvertor_1 = macleConvertor.convertor;

exports.convertor = macleConvertor_1;
exports["default"] = macleConvertor;
