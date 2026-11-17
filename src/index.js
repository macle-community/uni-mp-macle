'use strict';

const path = require('path');
const { transformWxmlToMaml } = require('./transformers/template');
const { transformWxssToMass } = require('./transformers/style');
const { transformJsToMacle } = require('./transformers/script');
const { MacleReporter } = require('./reporter');
const macleRules = require('./rules');

function uniMaclePlugin(userOptions = {}) {
  let entryDir = process.cwd();
  let resolvedOutDir = '';

  const reporter = new MacleReporter(macleRules, {
    isAutoOpenReport: userOptions.isAutoOpenReport ?? true,
    lan: userOptions.lan || 'zh',
    viewTemplateDir: userOptions.viewTemplateDir,
  });

  return {
    name: 'vite:uni-mp-macle',
    enforce: 'post',

    config() {
      if (process.env.UNI_CUSTOM_PLATFORM === 'mp-macle' || userOptions.forceMacleOutDir) {
        const mode = process.env.NODE_ENV === 'production' ? 'build' : 'dev';
        const baseOut = process.env.UNI_OUTPUT_DIR
          ? process.env.UNI_OUTPUT_DIR.replace(/mp-weixin$/, 'mp-macle')
          : path.resolve(process.cwd(), `dist/${mode}/mp-macle`);

        process.env.UNI_OUTPUT_DIR = baseOut;
        return {
          build: { outDir: baseOut },
          define: {
            'process.env.UNI_CUSTOM_PLATFORM': JSON.stringify('mp-macle'),
          },
        };
      }
    },

    configResolved(config) {
      entryDir = process.env.UNI_INPUT_DIR || config.root || process.cwd();
      resolvedOutDir = config.build.outDir;
    },

    buildStart() {
      reporter.reset();
    },

    generateBundle(outputOptions, bundle) {
      for (const [fileName, assetOrChunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.wxml')) {
          const rawWxml = String(assetOrChunk.source);
          reporter.recordTemplate(fileName, rawWxml);

          const newFileName = fileName.replace(/\.wxml$/, '.maml');
          assetOrChunk.fileName = newFileName;
          assetOrChunk.source = transformWxmlToMaml(rawWxml);
          bundle[newFileName] = assetOrChunk;
          delete bundle[fileName];
        } else if (fileName.endsWith('.wxss')) {
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
          const rawJs = assetOrChunk.type === 'chunk' ? assetOrChunk.code : String(assetOrChunk.source);
          const { code, calledApis } = transformJsToMacle(rawJs, fileName);

          if (!fileName.includes('common/vendor.js')) {
            reporter.recordScript(fileName, calledApis);
          }

          if (assetOrChunk.type === 'chunk') {
            assetOrChunk.code = code;
          } else {
            assetOrChunk.source = code;
          }
        } else if (fileName === 'project.config.json') {
          try {
            const cfg = JSON.parse(String(assetOrChunk.source));
            cfg.setting = cfg.setting || {};
            cfg.setting.es5 = true;
            delete cfg.setting.es6;
            assetOrChunk.source = JSON.stringify(cfg, null, 2);
          } catch {}
        } else if (fileName.endsWith('.json')) {
          const rawJson = String(assetOrChunk.source).replace(/"subpackages"\s*:/g, '"subPackages":');
          reporter.recordJson(fileName, rawJson);
          assetOrChunk.source = rawJson;
        }
      }
    },

    async closeBundle() {
      if (resolvedOutDir) {
        await reporter.writeReport(entryDir, resolvedOutDir);
      }
    },
  };
}

module.exports = uniMaclePlugin;
