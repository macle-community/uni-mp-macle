import fs = require('fs');
import path = require('path');
import fsExtra = require('@macle/fs-extra');
import type { Plugin } from 'vite';
import { transformWxmlToMaml } from './transformers/template';
import { transformWxssToMass } from './transformers/style';
import { transformJsToMacle } from './transformers/script';
import { MacleReporter } from './reporter';
import { apis, components, globalconfig, pageconfig } from './rules';
import type { RuleSet } from './types';

interface MaclePluginOptions {
  forceMacleOutDir?: boolean;
  isAutoOpenReport?: boolean;
  lan?: string;
  sourceMaps?: boolean;
  viewTemplateDir?: string;
}

const macleRules: RuleSet = { apis, components, globalconfig, pageconfig };

function resolveMacleOutDir(forceMacleOutDir = false): string {
  if (process.env.UNI_CUSTOM_PLATFORM === 'mp-macle' || forceMacleOutDir) {
    const mode = process.env.NODE_ENV === 'production' ? 'build' : 'dev';
    const targetDir = process.env.UNI_OUTPUT_DIR
      ? process.env.UNI_OUTPUT_DIR.replace(/mp-weixin([\\/]?)$/, 'mp-macle$1')
      : path.resolve(process.cwd(), `dist/${mode}/mp-macle`);

    process.env.UNI_OUTPUT_DIR = targetDir;
    return targetDir;
  }
  return '';
}

function uniMaclePlugin(userOptions: MaclePluginOptions = {}): Plugin {
  let entryDir = process.cwd();
  let resolvedOutDir = resolveMacleOutDir(userOptions.forceMacleOutDir);

  const reporter = new MacleReporter(macleRules, {
    isAutoOpenReport: userOptions.isAutoOpenReport ?? true,
    lan: userOptions.lan || 'zh',
    viewTemplateDir: userOptions.viewTemplateDir,
  });

  const plugin: Plugin = {
    name: 'vite:uni-mp-macle',
    enforce: 'post',

    config() {
      const outDir = resolveMacleOutDir(userOptions.forceMacleOutDir);
      if (outDir) {
        return {
          build: {
            outDir,
            ...(userOptions.sourceMaps || process.env.UNI_MACLE_SOURCE_MAPS === 'true'
              ? { sourcemap: true }
              : {}),
          },
          define: {
            'process.env.UNI_CUSTOM_PLATFORM': JSON.stringify('mp-macle'),
          },
        };
      }
      return undefined;
    },

    configResolved(config) {
      entryDir = process.env.UNI_INPUT_DIR || config.root || process.cwd();
      resolvedOutDir = resolvedOutDir || config.build.outDir;
    },

    buildStart() {
      reporter.reset();
    },

    generateBundle(_outputOptions, bundle) {
      for (const [fileName, assetOrChunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.wxml') && 'source' in assetOrChunk) {
          const rawWxml = String(assetOrChunk.source);
          reporter.recordTemplate(fileName, rawWxml);

          const newFileName = fileName.replace(/\.wxml$/, '.maml');
          assetOrChunk.fileName = newFileName;
          assetOrChunk.source = transformWxmlToMaml(rawWxml);
          bundle[newFileName] = assetOrChunk;
          delete bundle[fileName];
        } else if (fileName.endsWith('.wxss') && 'source' in assetOrChunk) {
          reporter.recordStyle(fileName);

          const newFileName = fileName.replace(/\.wxss$/, '.mass');
          assetOrChunk.fileName = newFileName;
          assetOrChunk.source = transformWxssToMass(String(assetOrChunk.source));
          bundle[newFileName] = assetOrChunk;
          delete bundle[fileName];
        } else if (fileName.endsWith('.wxs')) {
          const newFileName = fileName.replace(/\.wxs$/, '.sjs');
          assetOrChunk.fileName = newFileName;
          bundle[newFileName] = assetOrChunk;
          delete bundle[fileName];
        } else if (fileName.endsWith('.js')) {
          const rawJs =
            assetOrChunk.type === 'chunk' ? assetOrChunk.code : String(assetOrChunk.source);
          const { code, calledApis } = transformJsToMacle(rawJs, fileName);

          if (!fileName.includes('common/vendor.js')) {
            reporter.recordScript(fileName, calledApis);
          }

          if (assetOrChunk.type === 'chunk') {
            assetOrChunk.code = code;
          } else {
            assetOrChunk.source = code;
          }
        } else if (fileName === 'project.config.json' && 'source' in assetOrChunk) {
          try {
            const cfg: unknown = JSON.parse(String(assetOrChunk.source));
            if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
              const projectConfig = cfg as Record<string, unknown>;
              const setting =
                projectConfig.setting && typeof projectConfig.setting === 'object'
                  ? (projectConfig.setting as Record<string, unknown>)
                  : {};
              setting.es5 = true;
              delete setting.es6;
              projectConfig.setting = setting;
              assetOrChunk.source = JSON.stringify(projectConfig, null, 2);
            }
          } catch {
            // Keep malformed project configuration unchanged.
          }
        } else if (fileName.endsWith('.json') && 'source' in assetOrChunk) {
          const rawJson = String(assetOrChunk.source).replace(/"subpackages"\s*:/g, '"subPackages":');
          reporter.recordJson(fileName, rawJson);
          assetOrChunk.source = rawJson;
        }
      }
    },

    async closeBundle() {
      if (!resolvedOutDir) return;

      const leakedWeixinDir = resolvedOutDir.replace(/mp-macle([\\/]?)$/, 'mp-weixin$1');
      const leakedStaticDir = path.join(leakedWeixinDir, 'static');
      const targetStaticDir = path.join(resolvedOutDir, 'static');

      if (leakedWeixinDir !== resolvedOutDir) {
        if (fs.existsSync(leakedStaticDir)) {
          fsExtra.copySync(leakedStaticDir, targetStaticDir, { overwrite: true });
          fsExtra.removeSync(leakedStaticDir);
          if (fs.readdirSync(leakedWeixinDir).length === 0) {
            fs.rmdirSync(leakedWeixinDir);
          }
        }

        const srcStaticDir = path.join(entryDir, 'static');
        if (!fs.existsSync(targetStaticDir) && fs.existsSync(srcStaticDir)) {
          fsExtra.copySync(srcStaticDir, targetStaticDir, { overwrite: true });
        }
      }

      await reporter.writeReport(entryDir, resolvedOutDir);
    },
  };

  return plugin;
}

export = uniMaclePlugin;
