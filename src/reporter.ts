import fs = require('fs');
import path = require('path');
import fsExtra = require('@macle/fs-extra');
import open = require('@macle/open');
import { Parser } from 'htmlparser2';
import type { CalledApis, Rule, RuleSet, TransformRecord } from './types';

interface ReporterOptions {
  isAutoOpenReport?: boolean;
  lan?: string;
  viewTemplateDir?: string;
}

interface ReportComponent {
  name: string;
  attrs: string[];
  doc: string;
}

interface TemplateTransform extends TransformRecord {
  type: 'templete';
}

interface ScriptTransform extends TransformRecord {
  type: 'jsModular';
  openData: unknown[];
}

interface JsonTransform extends TransformRecord {
  type: 'jsonModular';
}

interface StyleTransform extends TransformRecord {
  type: 'wxssModular';
}

interface ReportSummary {
  modelAll: number;
  completely: number;
  partial: number;
  notsupport: number;
}

function getRuleDoc(rule?: Rule, preferTarget = true): string {
  if (!rule?.url) return '';
  return (preferTarget ? rule.url.target || rule.url.original : rule.url.original || rule.url.target) || '';
}

class MacleReporter {
  private readonly rules: RuleSet;
  private readonly isAutoOpen: boolean;
  private readonly lan: string;
  private readonly viewTemplateDir: string;
  private hasOpenedBrowser = false;
  private transforms: Record<string, TransformRecord> = {};
  private fileNum = 0;
  private projectName = '';

  constructor(configRules: RuleSet, options: ReporterOptions = {}) {
    this.rules = configRules;
    this.isAutoOpen = options.isAutoOpenReport ?? true;
    this.lan = options.lan || 'zh';
    this.viewTemplateDir =
      options.viewTemplateDir ||
      path.resolve(process.cwd(), 'node_modules/@macle/convertor/dist/view');
    this.reset();
  }

  reset(): void {
    this.transforms = {};
    this.fileNum = 0;
    this.projectName = '';
  }

  recordTemplate(fileName: string, rawCode: string): void {
    this.fileNum++;
    const result: TemplateTransform = { type: 'templete', status: 1, components: [] };
    const compRules = this.rules.components || {};

    const parser = new Parser(
      {
        onopentag: (tagName, attrs) => {
          const rule = compRules[tagName];
          if (!rule) return;

          const compEntry: ReportComponent = {
            name: tagName,
            attrs: [],
            doc: getRuleDoc(rule),
          };

          if (rule.status === 2) {
            result.status = 3;
            compEntry.attrs = ['不支持此组件'];
          } else {
            const propRules = rule.props || {};
            for (const attrKey of Object.keys(attrs)) {
              if (propRules[attrKey]?.status === 2) {
                if (result.status !== 3) result.status = 2;
                compEntry.attrs.push(attrKey);
              }
            }
          }

          if (compEntry.attrs.length > 0) {
            const existing = result.components.find((component) => component.name === tagName);
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

  recordScript(fileName: string, calledApis: CalledApis = {}): void {
    this.fileNum++;
    const result: ScriptTransform = { type: 'jsModular', status: 1, openData: [], components: [] };
    const apiRules = this.rules.apis || {};

    for (const [apiName, callInfo] of Object.entries(calledApis)) {
      const rule = apiRules[apiName];
      const entry: ReportComponent = { name: `wx.${apiName}`, attrs: [], doc: getRuleDoc(rule) };

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

        const paramRules = body.params?.props || {};
        const unsupportedProps: string[] = [];
        const diffProps: string[] = [];

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

  recordJson(fileName: string, rawJson: string): void {
    this.fileNum++;
    const result: JsonTransform = { type: 'jsonModular', status: 1, components: [] };

    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.transforms[fileName] = result;
        return;
      }
      const data = parsed as Record<string, unknown>;

      if (fileName === 'app.json' && typeof data.window === 'object' && data.window !== null) {
        const title = (data.window as Record<string, unknown>).navigationBarTitleText;
        if (typeof title === 'string') this.projectName = title;
      }

      const isPageJson = fileName.includes('pages/');
      const ruleSet = isPageJson ? this.rules.pageconfig || {} : this.rules.globalconfig || {};

      for (const key of Object.keys(data)) {
        const rule = ruleSet[key];
        if (!rule || rule.type === 7) continue;

        const entry: ReportComponent = {
          name: key,
          attrs: [],
          doc: getRuleDoc(rule, false),
        };

        if (rule.status === 2) {
          entry.attrs = ['属性不支持'];
          result.components.push(entry);
        } else if (
          rule.status === 1 &&
          rule.props &&
          typeof data[key] === 'object' &&
          data[key] !== null
        ) {
          for (const subProp of Object.keys(data[key])) {
            if (rule.props[subProp]?.status === 2) entry.attrs.push(subProp);
          }
          if (entry.attrs.length > 0) result.components.push(entry);
        }
      }

      if (result.components.length > 0) result.status = 2;
      const totalKeys = Object.keys(data).length;
      if (totalKeys > 0 && totalKeys === result.components.length) result.status = 3;
    } catch {
      // Invalid JSON is represented as an unflagged report entry, matching prior behavior.
    }

    this.transforms[fileName] = result;
  }

  recordStyle(fileName: string): void {
    this.fileNum++;
    this.transforms[fileName] = { type: 'wxssModular', status: 1, components: [] } satisfies StyleTransform;
  }

  async writeReport(entryDir: string, outDir: string): Promise<void> {
    const concept: ReportSummary = { modelAll: 0, completely: 0, partial: 0, notsupport: 0 };

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

export { MacleReporter };
