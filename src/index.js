'use strict';

const path = require('path');
const fs = require('fs');
const fsExtra = require('@macle/fs-extra');
const { transformWxmlToMaml } = require('./transformers/template');
const { transformWxssToMass } = require('./transformers/style');
const { transformJsToMacle } = require('./transformers/script');
const { MacleReporter } = require('./reporter');
const macleRules = require('./rules');

function resolveMacleOutDir(forceMacleOutDir) {
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

function uniMaclePlugin(userOptions = {}) {
  let entryDir = process.cwd();
  let resolvedOutDir = resolveMacleOutDir(userOptions.forceMacleOutDir);

  const reporter = new MacleReporter(macleRules, {
    isAutoOpenReport: userOptions.isAutoOpenReport ?? true,
    lan: userOptions.lan || 'zh',
    viewTemplateDir: userOptions.viewTemplateDir,
  });

  return {
    name: 'vite:uni-mp-macle',
    enforce: 'post',

    config() {
      const outDir = resolveMacleOutDir(userOptions.forceMacleOutDir);
      if (outDir) {
        return {
          build: { outDir },
          define: {
            'process.env.UNI_CUSTOM_PLATFORM': JSON.stringify('mp-macle'),
          },
        };
      }
    },

    configResolved(config) {
      entryDir = process.env.UNI_INPUT_DIR || config.root || process.cwd();
      resolvedOutDir = resolvedOutDir || config.build.outDir;
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
}

module.exports = uniMaclePlugin;
