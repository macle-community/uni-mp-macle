'use strict';

const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let outputChannel = null;
let activeBuildProcess = null;

function getOutputChannel() {
  if (!outputChannel) {
    outputChannel = hx.window.createOutputChannel('Macle MiniProgram');
  }
  outputChannel.show();
  return outputChannel;
}

/**
 * Resolves the target project root directory from HBuilderX selection or active editor.
 */
async function resolveProjectDir(contextParam) {
  if (contextParam && contextParam.fsPath) {
    return fs.statSync(contextParam.fsPath).isDirectory()
      ? contextParam.fsPath
      : path.dirname(contextParam.fsPath);
  }

  const activeEditor = await hx.window.getActiveTextEditor();
  if (activeEditor && activeEditor.document && activeEditor.document.workspaceFolder) {
    return activeEditor.document.workspaceFolder.uri.fsPath;
  }

  const folders = await hx.workspace.getWorkspaceFolders();
  if (folders && folders.length > 0) {
    return folders[0].uri.fsPath;
  }

  hx.window.showErrorMessage('Please open or select a uni-app project folder first.');
  return null;
}

/**
 * 1. Injects HBuilderX custom platform config into package.json and registers @macle/uni-mp in vite.config.js
 */
async function configureProjectForMacle(projectDir, channel) {
  const pkgPath = path.join(projectDir, 'package.json');
  let pkg = {};

  if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } else {
    pkg = { name: path.basename(projectDir), version: '1.0.0' };
  }

  // Add HBuilderX native Run/Publish menu entry ("Macle MiniProgram")
  pkg['uni-app'] = pkg['uni-app'] || {};
  pkg['uni-app'].scripts = pkg['uni-app'].scripts || {};
  pkg['uni-app'].scripts['mp-macle'] = {
    title: 'Macle MiniProgram',
    env: {
      UNI_PLATFORM: 'mp-weixin',
      UNI_CUSTOM_PLATFORM: 'mp-macle',
    },
    define: {
      'MP-MACLE': true,
    },
  };

  pkg.devDependencies = pkg.devDependencies || {};
  if (!pkg.devDependencies['@macle/uni-mp']) {
    pkg.devDependencies['@macle/uni-mp'] = '^1.0.0';
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  channel.appendLine('[Macle] Updated package.json with uni-app.scripts["mp-macle"].');

  // Create or patch vite.config.js
  const viteConfigPath = path.join(projectDir, 'vite.config.js');
  if (!fs.existsSync(viteConfigPath)) {
    const defaultViteConfig = `import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import uniMacle from '@macle/uni-mp';

export default defineConfig({
  plugins: [
    uni(),
    uniMacle({ isAutoOpenReport: false }),
  ],
});
`;
    fs.writeFileSync(viteConfigPath, defaultViteConfig, 'utf8');
    channel.appendLine('[Macle] Created vite.config.js with @macle/uni-mp.');
  } else {
    let viteContent = fs.readFileSync(viteConfigPath, 'utf8');
    if (!viteContent.includes('@macle/uni-mp')) {
      viteContent = `import uniMacle from '@macle/uni-mp';\n${viteContent}`;
      viteContent = viteContent.replace(/uni\(\s*\)/, 'uni(), uniMacle({ isAutoOpenReport: false })');
      fs.writeFileSync(viteConfigPath, viteContent, 'utf8');
      channel.appendLine('[Macle] Patched existing vite.config.js with @macle/uni-mp.');
    }
  }
}

/**
 * 2. Runs the uni-app -> Macle build inside HBuilderX's output console
 */
async function runMacleBuild(projectDir, isProd) {
  const channel = getOutputChannel();
  await configureProjectForMacle(projectDir, channel);

  if (activeBuildProcess) {
    activeBuildProcess.kill();
    activeBuildProcess = null;
  }

  const mode = isProd ? 'build' : 'dev';
  // HBuilderX convention outputs to unpackage/dist/<dev|build>/mp-macle
  const outDir = path.join(projectDir, 'unpackage', 'dist', mode, 'mp-macle');

  const localUniBin = path.join(projectDir, 'node_modules', '.bin', 'uni');
  const cmd = fs.existsSync(localUniBin) ? localUniBin : 'npx';
  const args = fs.existsSync(localUniBin)
    ? isProd ? ['build', '-p', 'mp-weixin'] : ['-p', 'mp-weixin']
    : isProd ? ['uni', 'build', '-p', 'mp-weixin'] : ['uni', '-p', 'mp-weixin'];

  channel.appendLine(`\n[Macle] Starting ${mode.toUpperCase()} build -> ${outDir}\n`);

  activeBuildProcess = spawn(cmd, args, {
    cwd: projectDir,
    shell: true,
    env: {
      ...process.env,
      UNI_PLATFORM: 'mp-weixin',
      UNI_CUSTOM_PLATFORM: 'mp-macle',
      UNI_OUTPUT_DIR: outDir,
      NODE_ENV: isProd ? 'production' : 'development',
    },
  });

  activeBuildProcess.stdout.on('data', (chunk) => {
    channel.append(chunk.toString());
  });

  activeBuildProcess.stderr.on('data', (chunk) => {
    channel.append(chunk.toString());
  });

  activeBuildProcess.on('close', (code) => {
    if (code === 0) {
      channel.appendLine(`\n[Macle] Build succeeded! Output ready at: ${outDir}`);
      hx.window.setStatusBarMessage('Macle MiniProgram build completed.', 5000, 'info');
    } else if (code !== null) {
      channel.appendLine(`\n[Macle] Build exited with code ${code}`);
    }
    activeBuildProcess = null;
  });
}

/**
 * 3. Opens the generated HTML Compatibility Report inside HBuilderX or the system browser
 */
async function openCompatibilityReport(projectDir) {
  const candidates = [
    path.join(projectDir, 'unpackage/dist/dev/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'unpackage/dist/build/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'dist/dev/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'dist/build/mp-macle/macle-report/report/index.html'),
  ];

  const reportHtml = candidates.find((p) => fs.existsSync(p));
  if (!reportHtml) {
    hx.window.showWarningMessage('No Macle compatibility report found yet. Run a Macle build first.');
    return;
  }

  // Open inside HBuilderX built-in webview or external browser
  hx.env.openExternal(hx.Uri.file(reportHtml));
}

function activate(context) {
  context.subscriptions.push(
    hx.commands.registerCommand('macle.initProject', async (param) => {
      const dir = await resolveProjectDir(param);
      if (!dir) return;
      const channel = getOutputChannel();
      await configureProjectForMacle(dir, channel);
      hx.window.showInformationMessage(
        'Project configured for Macle! You can now use Run -> Macle MiniProgram.'
      );
    }),

    hx.commands.registerCommand('macle.buildDev', async (param) => {
      const dir = await resolveProjectDir(param);
      if (dir) await runMacleBuild(dir, false);
    }),

    hx.commands.registerCommand('macle.buildProd', async (param) => {
      const dir = await resolveProjectDir(param);
      if (dir) await runMacleBuild(dir, true);
    }),

    hx.commands.registerCommand('macle.openReport', async (param) => {
      const dir = await resolveProjectDir(param);
      if (dir) await openCompatibilityReport(dir);
    })
  );
}

function deactivate() {
  if (activeBuildProcess) {
    activeBuildProcess.kill();
    activeBuildProcess = null;
  }
}

module.exports = {
  activate,
  deactivate,
};
