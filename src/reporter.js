'use strict';

const fs = require('fs');
const fsExtra = require('@macle/fs-extra');
const path = require('path');
const open = require('@macle/open');
const htmlparser2 = require('htmlparser2');

class MacleReporter {
  constructor(configRules, options = {}) {
    this.rules = configRules;
    this.isAutoOpen = options.isAutoOpenReport ?? true;
    this.lan = options.lan || 'zh';
    this.viewTemplateDir =
      options.viewTemplateDir ||
      path.resolve(process.cwd(), 'node_modules/@macle/convertor/dist/view');
    this.hasOpenedBrowser = false;
    this.reset();
  }

  reset() {
    this.transforms = {};
    this.fileNum = 0;
    this.projectName = '';
  }

  recordTemplate(fileName, rawCode) {
    this.fileNum++;
    const result = { type: 'templete', status: 1, components: [] };
    const compRules = this.rules.components || {};

    const parser = new htmlparser2.Parser(
      {
        onopentag: (tagName, attrs) => {
          const rule = compRules[tagName];
          if (!rule) return;

          const compEntry = {
            name: tagName,
            attrs: [],
            doc: (rule.url && (rule.url.target || rule.url.original)) || '',
          };

          if (rule.status === 2) {
            result.status = 3;
            compEntry.attrs = ['不支持此组件'];
          } else {
            const propRules = rule.props || {};
            for (const attrKey of Object.keys(attrs)) {
              if (propRules[attrKey] && propRules[attrKey].status === 2) {
                if (result.status !== 3) result.status = 2;
                compEntry.attrs.push(attrKey);
              }
            }
          }

          if (compEntry.attrs.length > 0) {
            const existing = result.components.find((c) => c.name === tagName);
            if (existing) {
              existing.attrs = [...new Set([...existing.attrs, ...compEntry.attrs])];
            } else {
              result.components.push(compEntry);
            }
          }
        },
      },
      { decodeEntities: false, xmlMode: true }
    );

    parser.write(rawCode);
    parser.end();

    this.transforms[fileName] = result;
  }

  recordScript(fileName, calledApis = {}) {
    this.fileNum++;
    const result = { type: 'jsModular', status: 1, openData: [], components: [] };
    const apiRules = this.rules.apis || {};

    for (const [apiName, callInfo] of Object.entries(calledApis)) {
      const rule = apiRules[apiName];
      const docUrl = rule && rule.url ? rule.url.target || rule.url.original : '';
      const entry = { name: `wx.${apiName}`, attrs: [], doc: docUrl };

      if (!rule || rule.status === 2) {
        result.status = 3;
        entry.attrs = ['不支持'];
        result.components.push(entry);
        continue;
      }

      if (rule.status === 1 && rule.body) {
        const { body } = rule;
        if (body.type === 1) {
          entry.attrs.push(`命名差异: wx.${apiName} => ma.${body.value}`);
        }

        const paramRules = (body.params && body.params.props) || {};
        const unsupportedProps = [];
        const diffProps = [];

        for (const [propKey, propRule] of Object.entries(paramRules)) {
          const wasUsed = !callInfo.props || callInfo.props.includes(propKey);
          if (!wasUsed) continue;

          if (propRule.type === 0) unsupportedProps.push(propKey);
          else if (propRule.type === 4) diffProps.push(`${propKey}的默认值`);
          else if (propRule.type !== 7 && propRule.type !== 1) diffProps.push(propKey);
        }

        if (unsupportedProps.length > 0) {
          entry.attrs.push(`不支持参数${unsupportedProps.join('、')}`);
        }
        if (diffProps.length > 0) {
          entry.attrs.push(`参数${diffProps.join('、')} 存在差异`);
        }

        if (entry.attrs.length > 0) {
          result.components.push(entry);
          if (result.status !== 3) result.status = 2;
        }
      }
    }

    this.transforms[fileName] = result;
  }

  recordJson(fileName, rawJson) {
    this.fileNum++;
    const result = { type: 'jsonModular', status: 1, components: [] };

    try {
      const data = JSON.parse(rawJson);
      if (fileName === 'app.json' && data.window && data.window.navigationBarTitleText) {
        this.projectName = data.window.navigationBarTitleText;
      }

      const isPageJson = fileName.includes('pages/');
      const ruleSet = isPageJson ? this.rules.pageconfig || {} : this.rules.globalconfig || {};

      for (const key of Object.keys(data)) {
        const rule = ruleSet[key];
        if (!rule || rule.type === 7) continue;

        const entry = {
          name: key,
          attrs: [],
          doc: (rule.url && (rule.url.original || rule.url.target)) || '',
        };

        if (rule.status === 2) {
          entry.attrs = ['属性不支持'];
          result.components.push(entry);
        } else if (rule.status === 1 && rule.props && typeof data[key] === 'object') {
          for (const subProp of Object.keys(data[key])) {
            if (rule.props[subProp] && rule.props[subProp].status === 2) {
              entry.attrs.push(subProp);
            }
          }
          if (entry.attrs.length > 0) result.components.push(entry);
        }
      }

      if (result.components.length > 0) result.status = 2;
      const totalKeys = Object.keys(data).length;
      if (totalKeys > 0 && totalKeys === result.components.length) result.status = 3;
    } catch {}

    this.transforms[fileName] = result;
  }

  recordStyle(fileName) {
    this.fileNum++;
    this.transforms[fileName] = { type: 'wxssModular', status: 1, components: [] };
  }

  async writeReport(entryDir, outDir) {
    const concept = { modelAll: 0, completely: 0, partial: 0, notsupport: 0 };

    for (const item of Object.values(this.transforms)) {
      concept.modelAll++;
      if (item.status === 1) concept.completely++;
      else if (item.status === 2) concept.partial++;
      else concept.notsupport++;
    }

    const reportPayload = {
      transforms: this.transforms,
      apisLineMap: {},
      tableInfo: {
        项目名称: this.projectName || path.basename(entryDir),
        项目路径: entryDir,
        输出路径: outDir,
        文件数: String(this.fileNum),
      },
      opening: {},
      concept,
    };

    const reportRoot = path.join(outDir, 'macle-report', 'report');
    const jsDir = path.join(reportRoot, 'js');
    fsExtra.ensureDirSync(jsDir);

    if (fs.existsSync(this.viewTemplateDir)) {
      fsExtra.copySync(this.viewTemplateDir, reportRoot);
    }

    const dataJsPath = path.join(jsDir, 'data.js');
    const dataJsContent = `window.pageData = ${JSON.stringify(reportPayload)};window.ideLan="${this.lan}";`;
    fs.writeFileSync(dataJsPath, dataJsContent, 'utf8');

    console.log(
      `[Macle Report] Modules: ${concept.modelAll} | Supported: ${concept.completely} | Partial: ${concept.partial} | Unsupported: ${concept.notsupport}`
    );

    const indexHtmlPath = path.join(reportRoot, 'index.html');
    if (this.isAutoOpen && !this.hasOpenedBrowser && fs.existsSync(indexHtmlPath)) {
      this.hasOpenedBrowser = true;
      await open(indexHtmlPath);
    }
  }
}

module.exports = { MacleReporter };
