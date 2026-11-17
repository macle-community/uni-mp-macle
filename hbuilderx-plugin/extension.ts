import fs = require('fs');
import path = require('path');
import { spawn } from 'child_process';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import hx = require('hbuilderx');

type JsonRecord = Record<string, unknown>;

let outputChannel: hx.OutputChannel | null = null;
let activeBuildProcess: ChildProcessWithoutNullStreams | null = null;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getOutputChannel(): hx.OutputChannel {
  if (!outputChannel) {
    outputChannel = hx.window.createOutputChannel('Macle MiniProgram');
  }
  outputChannel.show();
  return outputChannel;
}

/**
 * Resolves the target project root directory from HBuilderX selection or active editor.
 */
async function resolveProjectDir(contextParam: unknown): Promise<string | null> {
  if (isRecord(contextParam) && typeof contextParam.fsPath === 'string') {
    return fs.statSync(contextParam.fsPath).isDirectory()
      ? contextParam.fsPath
      : path.dirname(contextParam.fsPath);
  }

  const activeEditor = await hx.window.getActiveTextEditor();
  if (activeEditor?.document?.workspaceFolder) {
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
 * Injects HBuilderX custom platform config into package.json and registers @macle/uni-mp in vite.config.js.
 */
async function configureProjectForMacle(
  projectDir: string,
  channel: hx.OutputChannel
): Promise<void> {
  const pkgPath = path.join(projectDir, 'package.json');
  let pkg: JsonRecord;

  if (fs.existsSync(pkgPath)) {
    const parsed: unknown = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!isRecord(parsed)) throw new Error(`Expected a JSON object in ${pkgPath}`);
    pkg = parsed;
  } else {
    pkg = { name: path.basename(projectDir), version: '1.0.0' };
  }

  const uniApp = isRecord(pkg['uni-app']) ? pkg['uni-app'] : {};
  const uniScripts = isRecord(uniApp.scripts) ? uniApp.scripts : {};
  uniScripts['mp-macle'] = {
    title: 'Macle MiniProgram',
    env: {
      UNI_PLATFORM: 'mp-weixin',
      UNI_CUSTOM_PLATFORM: 'mp-macle',
    },
    define: {
      'MP-MACLE': true,
    },
  };
  pkg['uni-app'] = { ...uniApp, scripts: uniScripts };

  const devDependencies = isRecord(pkg.devDependencies) ? pkg.devDependencies : {};
  if (!devDependencies['@macle/uni-mp']) {
    devDependencies['@macle/uni-mp'] = '^1.0.0';
  }
  pkg.devDependencies = devDependencies;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  channel.appendLine('[Macle] Updated package.json with uni-app.scripts["mp-macle"].');

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
 * Runs the uni-app -> Macle build inside HBuilderX's output console.
 */
async function runMacleBuild(projectDir: string, isProd: boolean): Promise<void> {
  const channel = getOutputChannel();
  await configureProjectForMacle(projectDir, channel);

  if (activeBuildProcess) {
    activeBuildProcess.kill();
    activeBuildProcess = null;
  }

  const mode = isProd ? 'build' : 'dev';
  const outDir = path.join(projectDir, 'unpackage', 'dist', mode, 'mp-macle');

  const localUniBin = path.join(projectDir, 'node_modules', '.bin', 'uni');
  const hasLocalUni = fs.existsSync(localUniBin);
  const cmd = hasLocalUni ? localUniBin : 'npx';
  const args = hasLocalUni
    ? isProd
      ? ['build', '-p', 'mp-weixin']
      : ['-p', 'mp-weixin']
    : isProd
      ? ['uni', 'build', '-p', 'mp-weixin']
      : ['uni', '-p', 'mp-weixin'];

  channel.appendLine(`\n[Macle] Starting ${mode.toUpperCase()} build -> ${outDir}\n`);

  const child = spawn(cmd, args, {
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
  activeBuildProcess = child;

  child.stdout.on('data', (chunk: Buffer | string) => {
    channel.append(chunk.toString());
  });

  child.stderr.on('data', (chunk: Buffer | string) => {
    channel.append(chunk.toString());
  });

  child.on('close', (code) => {
    if (code === 0) {
      channel.appendLine(`\n[Macle] Build succeeded! Output ready at: ${outDir}`);
      hx.window.setStatusBarMessage('Macle MiniProgram build completed.', 5000, 'info');
    } else if (code !== null) {
      channel.appendLine(`\n[Macle] Build exited with code ${code}`);
    }
    if (activeBuildProcess === child) activeBuildProcess = null;
  });
}

/**
 * Opens the generated HTML Compatibility Report inside HBuilderX or the system browser.
 */
async function openCompatibilityReport(projectDir: string): Promise<void> {
  const candidates = [
    path.join(projectDir, 'unpackage/dist/dev/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'unpackage/dist/build/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'dist/dev/mp-macle/macle-report/report/index.html'),
    path.join(projectDir, 'dist/build/mp-macle/macle-report/report/index.html'),
  ];

  const reportHtml = candidates.find((candidate) => fs.existsSync(candidate));
  if (!reportHtml) {
    hx.window.showWarningMessage('No Macle compatibility report found yet. Run a Macle build first.');
    return;
  }

  hx.env.openExternal(hx.Uri.file(reportHtml));
}

function activate(context: hx.ExtensionContext): void {
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

function deactivate(): void {
  if (activeBuildProcess) {
    activeBuildProcess.kill();
    activeBuildProcess = null;
  }
}

export { activate, deactivate };
