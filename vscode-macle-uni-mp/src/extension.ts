import { spawn, execSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import * as vscode from 'vscode';
import extractZipModule from 'extract-zip';
import { codeActionProvider, updateDiagnostics } from './diagnostics';
import { componentCompletionProvider } from './completions';
import { createConditionalDecorations } from './decorations';
import { openCompatibilityReport } from './report';
import { createMauiLibraryPlan, installMauiLibrary } from './maui-library';
import { MacleActivityProvider } from './activity';
import { resolveUniCli } from './uni-cli';
import {
  configureProject,
  configureRunAndDebug,
  createMacleProject,
  detectProjectFramework,
  ensureUniMaclePluginInjected,
} from './project';
import {
  ToolkitConfig,
  expandUserPath,
  getMacleTargetPaths,
  loadToolkitConfig,
  resetToolkitConfigCache,
  resolveMacleCompiler,
  toolkitConfigPath,
} from './compiler-cli';
import { showWelcomePage } from './welcome';

const outputChannel = vscode.window.createOutputChannel('Macle uni-app');

let buildProcess: ChildProcess | undefined;
let webSimulatorProcess: ChildProcess | undefined;
let simulatorWebviewPanel: vscode.WebviewPanel | undefined;
let simulatorServerUrl: string | undefined;
let currentSimulatorSourceDir: string | undefined;
let pureMacleWatcher: vscode.FileSystemWatcher | undefined;
let pureMacleRebuildTimer: NodeJS.Timeout | undefined;
let isPureMacleRebuilding = false;
let pendingPureMacleRebuild = false;
let statusBarItem: vscode.StatusBarItem | undefined;

function openSimulatorInsideVscode(url: string, context: vscode.ExtensionContext): void {
  simulatorServerUrl = url;
  if (simulatorWebviewPanel) {
    simulatorWebviewPanel.reveal(vscode.ViewColumn.Two, true);
    void simulatorWebviewPanel.webview.postMessage({ command: 'navigate', url });
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'macleSimulator',
    'Macle Simulator',
    { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );
  simulatorWebviewPanel = panel;

  const escapedUrl = url.replace(/"/g, '&quot;');
  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://localhost:* http://127.0.0.1:*; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Macle Simulator</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      height: 34px;
      box-sizing: border-box;
      border-bottom: 1px solid var(--vscode-panel-border, #333);
      background: var(--vscode-editorGroupHeader-tabsBackground, #252526);
      font-size: 12px;
      flex-shrink: 0;
    }
    .toolbar .url {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.75;
    }
    .toolbar select,
    .toolbar button {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ffffff);
      border: 1px solid var(--vscode-dropdown-border, transparent);
      border-radius: 3px;
      padding: 3px 8px;
      font-size: 11px;
      cursor: pointer;
    }
    .toolbar select:hover,
    .toolbar button:hover {
      background: var(--vscode-button-secondaryHoverBackground, #45494e);
    }
    .stage {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      overflow: hidden;
      background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.04), transparent 70%);
    }
    .stage.full-mode {
      padding: 0;
    }
    .phone-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
      flex-shrink: 0;
    }
    .phone-frame {
      position: relative;
      padding: 14px;
      border-radius: 46px;
      background: linear-gradient(145deg, #2d2f34, #17181c);
      box-shadow:
        0 20px 50px rgba(0, 0, 0, 0.55),
        inset 0 0 0 2px #43464e,
        inset 0 0 0 4px #111215;
      box-sizing: border-box;
    }
    .phone-frame::before,
    .phone-frame::after {
      content: '';
      position: absolute;
      background: #3a3d44;
      border-radius: 2px;
    }
    /* Volume / power side buttons */
    .phone-frame::before {
      left: -3px;
      top: 115px;
      width: 3px;
      height: 54px;
      box-shadow: 0 66px 0 #3a3d44;
    }
    .phone-frame::after {
      right: -3px;
      top: 145px;
      width: 3px;
      height: 76px;
    }
    .phone-screen {
      position: relative;
      width: 375px;
      height: 812px;
      border-radius: 34px;
      overflow: hidden;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
    }
    .phone-notch-bar {
      height: 28px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    .phone-island {
      width: 96px;
      height: 20px;
      border-radius: 12px;
      background: #111215;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 7px;
      box-sizing: border-box;
    }
    .phone-camera {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #3b5998, #0b1020 70%);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    }
    .phone-home-bar {
      height: 18px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 2;
    }
    .phone-home-indicator {
      width: 120px;
      height: 4px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.25);
    }
    iframe {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      background: #ffffff;
      display: block;
    }
    /* Full-width mode hides the phone shell */
    .stage.full-mode .phone-wrapper {
      width: 100%;
      height: 100%;
      transform: none !important;
    }
    .stage.full-mode .phone-frame {
      width: 100%;
      height: 100%;
      padding: 0;
      border-radius: 0;
      background: none;
      box-shadow: none;
    }
    .stage.full-mode .phone-frame::before,
    .stage.full-mode .phone-frame::after,
    .stage.full-mode .phone-notch-bar,
    .stage.full-mode .phone-home-bar {
      display: none;
    }
    .stage.full-mode .phone-screen {
      width: 100% !important;
      height: 100% !important;
      border-radius: 0;
      box-shadow: none;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="url" id="urlLabel">${escapedUrl}</span>
    <select id="deviceSelect" title="Simulator Device Shape">
      <option value="375x812" selected>Mobile (375×812)</option>
      <option value="390x844">Pro (390×844)</option>
      <option value="412x915">Android (412×915)</option>
      <option value="full">Full Width</option>
    </select>
    <button id="reloadBtn" title="Reload Simulator">Reload</button>
    <button id="browserBtn" title="Open in External Browser">Open in Browser</button>
  </div>
  <div class="stage" id="stage">
    <div class="phone-wrapper" id="phoneWrapper">
      <div class="phone-frame" id="phoneFrame">
        <div class="phone-screen" id="phoneScreen">
          <div class="phone-notch-bar">
            <div class="phone-island">
              <div class="phone-camera"></div>
            </div>
          </div>
          <iframe id="simFrame" src="${escapedUrl}" allow="clipboard-read; clipboard-write"></iframe>
          <div class="phone-home-bar">
            <div class="phone-home-indicator"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const frame = document.getElementById('simFrame');
    const urlLabel = document.getElementById('urlLabel');
    const stage = document.getElementById('stage');
    const phoneWrapper = document.getElementById('phoneWrapper');
    const phoneFrame = document.getElementById('phoneFrame');
    const phoneScreen = document.getElementById('phoneScreen');
    const deviceSelect = document.getElementById('deviceSelect');

    function fitPhone() {
      const mode = deviceSelect.value;
      if (mode === 'full') {
        stage.classList.add('full-mode');
        phoneWrapper.style.transform = '';
        return;
      }
      stage.classList.remove('full-mode');
      const [w, h] = mode.split('x').map(Number);
      phoneScreen.style.width = w + 'px';
      phoneScreen.style.height = h + 'px';

      const stageRect = stage.getBoundingClientRect();
      const availW = Math.max(100, stageRect.width - 32);
      const availH = Math.max(100, stageRect.height - 32);
      const frameW = phoneFrame.offsetWidth || (w + 28);
      const frameH = phoneFrame.offsetHeight || (h + 28);
      const scale = Math.min(1, availW / frameW, availH / frameH);
      phoneWrapper.style.transform = scale < 1 ? 'scale(' + scale.toFixed(4) + ')' : '';
    }

    deviceSelect.addEventListener('change', fitPhone);
    new ResizeObserver(fitPhone).observe(stage);
    fitPhone();

    document.getElementById('reloadBtn').addEventListener('click', () => {
      frame.src = frame.src;
    });
    document.getElementById('browserBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'openInBrowser' });
    });
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.command === 'reload') {
        frame.src = frame.src;
      } else if (msg.command === 'navigate' && msg.url) {
        urlLabel.textContent = msg.url;
        frame.src = msg.url;
      }
    });
  </script>
</body>
</html>`;

  panel.webview.onDidReceiveMessage(
    (msg: { command?: string }) => {
      if (msg?.command === 'openInBrowser' && simulatorServerUrl) {
        void vscode.env.openExternal(vscode.Uri.parse(simulatorServerUrl));
      }
    },
    undefined,
    context.subscriptions
  );

  panel.onDidDispose(() => {
    if (simulatorWebviewPanel === panel) {
      simulatorWebviewPanel = undefined;
    }
  });
}

function presentSimulatorUrl(
  url: string,
  context: vscode.ExtensionContext,
  label = 'Macle Simulator'
): void {
  const openIn = vscode.workspace.getConfiguration('macle').get<string>('simulator.openIn', 'vscode');
  if (openIn === 'browser') {
    void vscode.env.openExternal(vscode.Uri.parse(url));
    void vscode.window.showInformationMessage(`${label} started at ${url}`, 'Open in Browser').then((choice) => {
      if (choice === 'Open in Browser') {
        void vscode.env.openExternal(vscode.Uri.parse(url));
      }
    });
    return;
  }

  openSimulatorInsideVscode(url, context);
}

function spawnOfficialSimulatorServer(
  executable: string,
  cwd: string,
  outputDir: string,
  preferredRoot: string,
  context: vscode.ExtensionContext
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.ELECTRON_RUN_AS_NODE;
    currentSimulatorSourceDir = outputDir;

    const args = [
      '-o',
      ...(process.platform === 'linux' ? ['--headless'] : []),
      '--source',
      outputDir,
      '--root',
      preferredRoot,
      '--mode',
      'debug',
    ];
    outputChannel.appendLine(`Launching official simulator server inside VS Code: ${executable} ${args.join(' ')}`);

    const child = spawn(executable, args, {
      cwd,
      env: cleanEnv,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    webSimulatorProcess = child;

    let settled = false;
    const finish = (url: string) => {
      if (settled) return;
      settled = true;
      simulatorServerUrl = url;
      openSimulatorInsideVscode(url, context);
      resolve(url);
    };

    child.on('message', (msg) => {
      if (typeof msg !== 'string') return;
      outputChannel.appendLine(`[simulator ipc] ${msg}`);
      if (msg.startsWith('server-started:') || msg.startsWith('server-refreshed:')) {
        const rawUrl = msg.slice(msg.indexOf(':') + 1).trim();
        if (rawUrl) {
          const url = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
          if (settled) {
            simulatorServerUrl = url;
            openSimulatorInsideVscode(url, context);
          } else {
            finish(url);
          }
        }
      }
    });

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      outputChannel.append(text);
      const match = text.match(/https?:\/\/localhost:\d+[^\s]*/);
      if (match && !settled) {
        finish(match[0]);
      }
    });

    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));

    child.on('error', (err) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    child.on('exit', (code) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      outputChannel.appendLine(`Simulator server stopped (exit code ${code ?? 0}).`);
      if (!settled) {
        settled = true;
        reject(new Error(`Simulator server exited early with code ${code ?? 0}`));
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Timed out waiting for official simulator server URL.'));
      }
    }, 10000);
  });
}

function notifySimulatorReload(port = 30000): void {
  const openIn = vscode.workspace.getConfiguration('macle').get<string>('simulator.openIn', 'vscode');
  if (
    openIn !== 'vscode' &&
    !simulatorWebviewPanel &&
    webSimulatorProcess &&
    webSimulatorProcess.exitCode === null &&
    webSimulatorProcess.connected
  ) {
    try {
      if (currentSimulatorSourceDir) {
        webSimulatorProcess.send(
          `show-simulator:${JSON.stringify({ onlyServer: true, compiledSourcePath: currentSimulatorSourceDir })}`
        );
      } else {
        webSimulatorProcess.send('refresh-simulator');
      }
    } catch {
      // ignore
    }
  }
  if (simulatorWebviewPanel) {
    void simulatorWebviewPanel.webview.postMessage({ command: 'reload' });
  }
  for (const p of [port, 30001, 30002]) {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: p,
        path: '/api/recompile',
        method: 'POST',
        timeout: 1000,
      },
      () => {}
    );
    req.on('error', () => {});
    req.end();
  }
}

function updateStatusBarWatchState(watching: boolean, compiling = false): void {
  if (!statusBarItem) return;
  if (compiling) {
    statusBarItem.text = '$(sync~spin) Macle: Compiling...';
    statusBarItem.tooltip = 'Auto-recompiling Pure Macle changes...';
  } else if (watching) {
    statusBarItem.text = '$(eye) Macle: Watching';
    statusBarItem.tooltip = 'Macle Simulator is active and watching for changes. Click to recompile.';
  } else {
    statusBarItem.text = '$(play) Macle Preview';
    statusBarItem.tooltip = 'Build Pure Macle or uni-app and open in Macle Simulator';
  }
}

function startPureMacleWatcher(root: string, context: vscode.ExtensionContext): void {
  if (pureMacleWatcher) {
    updateStatusBarWatchState(true);
    return;
  }

  const pattern = new vscode.RelativePattern(root, '**/*.{maml,mass,js,ts,json,sjs,png,jpg,jpeg,svg}');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  pureMacleWatcher = watcher;
  context.subscriptions.push(watcher);

  const onChange = (uri: vscode.Uri) => {
    const rel = path.relative(root, uri.fsPath);
    if (
      rel.startsWith('.vscode') ||
      rel.startsWith('node_modules') ||
      rel.startsWith('.git') ||
      rel.startsWith('dist') ||
      rel.endsWith('.tmp')
    ) {
      return;
    }

    if (pureMacleRebuildTimer) {
      clearTimeout(pureMacleRebuildTimer);
    }
    pureMacleRebuildTimer = setTimeout(() => {
      void triggerPureMacleWatchRebuild(root, rel, context);
    }, 250);
  };

  watcher.onDidChange(onChange);
  watcher.onDidCreate(onChange);
  watcher.onDidDelete(onChange);

  outputChannel.appendLine(`[Watch] Pure Macle file watcher active for ${root}`);
  updateStatusBarWatchState(true);
}

async function triggerPureMacleWatchRebuild(
  root: string,
  changedFile: string,
  context: vscode.ExtensionContext
): Promise<void> {
  if (isPureMacleRebuilding) {
    pendingPureMacleRebuild = true;
    return;
  }

  isPureMacleRebuilding = true;
  outputChannel.appendLine(`[Watch] Change detected in ${changedFile}. Auto-recompiling Pure Macle...`);
  updateStatusBarWatchState(true, true);

  try {
    await compilePureMacle(root, false, context, true);
    const config = loadToolkitConfig(context);
    const port = config.webSimulator?.port || 30001;
    notifySimulatorReload(port);
  } finally {
    isPureMacleRebuilding = false;
    updateStatusBarWatchState(true, false);
    if (pendingPureMacleRebuild) {
      pendingPureMacleRebuild = false;
      void triggerPureMacleWatchRebuild(root, 'pending changes', context);
    }
  }
}
let toolkitInstallPromise: Promise<{
  toolkitRoot: string;
  simulatorInstalled: boolean;
  officialExtensionInstalled: boolean;
}> | undefined;

class DownloadInterruptedError extends Error {}

function downloadToolkitAttempt(
  url: URL,
  destination: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  state: { received: number; reportedPercent: number },
  redirects: number,
  token?: vscode.CancellationToken
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const config = loadToolkitConfig();
    if (!config) {
      reject(new Error('The toolkit configuration was not loaded.'));
      return;
    }
    if (redirects > config.download.redirectLimit) {
      reject(new Error('The toolkit download exceeded the redirect limit.'));
      return;
    }
    if (token?.isCancellationRequested) {
      reject(new Error('Download cancelled by user.'));
      return;
    }

    // Resume support: pick up where a previous attempt left off.
    let resumeFrom = 0;
    try {
      resumeFrom = fs.statSync(destination).size;
    } catch {
      resumeFrom = 0;
    }
    if (resumeFrom > 0) {
      outputChannel.appendLine(`Resuming download from byte ${resumeFrom}...`);
    }

    const headers: Record<string, string> = {};
    if (resumeFrom > 0) headers['Range'] = `bytes=${resumeFrom}-`;

    const request = https.get(url, { headers }, (response) => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        const location = response.headers.location;
        if (!location) {
          reject(new Error(`The toolkit server returned HTTP ${status} without a redirect URL.`));
          return;
        }
        const redirectUrl = new URL(location, url);
        if (redirectUrl.protocol !== 'https:') {
          reject(new Error('The toolkit server redirected to a non-HTTPS URL.'));
          return;
        }
        void downloadToolkitAttempt(redirectUrl, destination, progress, state, redirects + 1, token).then(
          resolve,
          reject
        );
        return;
      }

      // Server ignored the Range header and is restarting from scratch.
      if (status === 200 && resumeFrom > 0) {
        response.destroy();
        outputChannel.appendLine('Server does not support resume (HTTP 200 for range request); restarting download.');
        fs.promises.rm(destination, { force: true })
          .then(() => downloadToolkitAttempt(url, destination, progress, { received: 0, reportedPercent: 0 }, redirects, token))
          .then(resolve, reject);
        return;
      }

      // Range beyond file size — the partial file is already complete.
      if (status === 416) {
        response.resume();
        fs.promises.stat(destination).then(
          (stat) => resolve(stat.size),
          () => reject(new Error('The toolkit server returned HTTP 416 for the resume request.'))
        );
        return;
      }

      if (status !== 200 && status !== 206) {
        response.resume();
        reject(new Error(`The toolkit server returned HTTP ${status}.`));
        return;
      }

      const resuming = status === 206;
      const rangeTotal = Number(response.headers['content-length']);
      const total = Number.isFinite(rangeTotal) && rangeTotal > 0
        ? (resuming ? resumeFrom + rangeTotal : rangeTotal)
        : undefined;

      state.received = resuming ? resumeFrom : 0;
      state.reportedPercent = 0;

      const output = fs.createWriteStream(destination, { flags: resuming ? 'a' : 'w' });
      response.on('data', (chunk: Buffer) => {
        if (token?.isCancellationRequested) {
          response.destroy();
          output.destroy();
          reject(new Error('Download cancelled by user.'));
          return;
        }
        state.received += chunk.length;
        const receivedMb = (state.received / (1024 * 1024)).toFixed(1);
        if (total && total > 0) {
          const percent = Math.floor((state.received / total) * 100);
          progress.report({
            message: `${percent}% (${receivedMb} MB)`,
            increment: Math.max(0, percent - state.reportedPercent),
          });
          state.reportedPercent = Math.max(state.reportedPercent, percent);
        } else {
          progress.report({ message: `${receivedMb} MB` });
        }
      });
      response.on('error', reject);
      response.on('aborted', () => {
        output.destroy();
        reject(new DownloadInterruptedError('The toolkit download was interrupted.'));
      });
      output.on('error', reject);
      output.on('finish', () => {
        output.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          if (total && state.received < total) {
            reject(new DownloadInterruptedError(
              `The toolkit download ended early (${state.received} of ${total} bytes).`
            ));
            return;
          }
          resolve(total);
        });
      });
      response.pipe(output);
    });
    request.setTimeout(
      config.download.timeoutMs,
      () => request.destroy(new DownloadInterruptedError('The toolkit download timed out.'))
    );
    request.on('error', reject);

    token?.onCancellationRequested(() => {
      request.destroy(new Error('Download cancelled by user.'));
    });
  });
}

async function downloadToolkitFile(
  url: URL,
  destination: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  state: { received: number; reportedPercent: number },
  redirects = 0,
  token?: vscode.CancellationToken
): Promise<void> {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await downloadToolkitAttempt(url, destination, progress, state, redirects, token);
      return;
    } catch (error) {
      if (token?.isCancellationRequested) throw error;
      const message = String(error);
      const recoverable =
        error instanceof DownloadInterruptedError ||
        message.includes('interrupted') ||
        message.includes('timed out') ||
        message.includes('ECONNRESET') ||
        message.includes('EPIPE') ||
        message.includes('ETIMEDOUT') ||
        message.includes('socket hang up');
      if (!recoverable || attempt === maxAttempts) throw error;
      const delayMs = Math.min(2000 * attempt, 10000);
      outputChannel.appendLine(
        `Download attempt ${attempt}/${maxAttempts} failed (${message}). Retrying in ${Math.round(delayMs / 1000)}s...`
      );
      void vscode.window.showInformationMessage(
        `Toolkit download interrupted — resuming automatically (attempt ${attempt + 1} of ${maxAttempts})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function extractZipWithSystemUnzip(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('unzip', ['-o', '-q', source, '-d', destination], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', (error) => reject(new Error(`Failed to run unzip: ${String(error)}`)));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`));
    });
  });
}

/**
 * Extract via libarchive compiled to WebAssembly (libarchive-wasm).
 *
 * This handles archive variants the other extractors cannot, such as
 * Deflate64 (method 9) compressed entries, unusual zip64 layouts and
 * archives whose central directory confuses yauzl/Info-ZIP. It loads the
 * whole archive into memory, so it is only used as a fallback for archives
 * the streaming extractors failed on.
 */
async function extractZipWithLibarchive(
  context: vscode.ExtensionContext,
  source: string,
  destination: string
): Promise<void> {
  const candidates = [
    path.join(__dirname, 'libarchive.wasm'),
    path.join(context.extensionPath, 'lib', 'libarchive.wasm'),
    path.join(context.extensionPath, 'libarchive.wasm'),
    path.join(path.dirname(__dirname), 'libarchive.wasm'),
    path.join(
      context.extensionPath,
      'node_modules',
      'libarchive-wasm',
      'dist',
      'libarchive.wasm'
    ),
  ];

  const wasmPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!wasmPath) {
    throw new Error(
      `libarchive.wasm was not found in the extension bundle. Checked: ${candidates.join(', ')}`
    );
  }
  const wasmBinary = await fs.promises.readFile(wasmPath);

  const { libarchiveWasm, ArchiveReader } = await import('libarchive-wasm');
  const mod = await libarchiveWasm({ wasmBinary } as never);

  const data = await fs.promises.readFile(source);
  const archiveLabel = path.basename(source);
  const reader = new ArchiveReader(mod, new Int8Array(data.buffer, data.byteOffset, data.byteLength));
  const destinationRoot = path.resolve(destination);
  await fs.promises.mkdir(destinationRoot, { recursive: true });

  let extractedFiles = 0;
  let extractedDirs = 0;
  try {
    for (const entry of reader.entries()) {
      const entryPath = entry.getPathname();
      if (!entryPath || entryPath.includes('../')) {
        outputChannel.appendLine(`Skipping unsafe archive entry: ${entryPath}`);
        continue;
      }
      const normalized = entryPath.replace(/\\/g, '/').replace(/^\/+/, '');
      const target = path.resolve(destinationRoot, normalized);
      if (target !== destinationRoot && !target.startsWith(destinationRoot + path.sep)) {
        outputChannel.appendLine(`Skipping archive entry outside destination: ${entryPath}`);
        continue;
      }

      const filetype = entry.getFiletype();
      if (filetype === 'Directory' || normalized.endsWith('/')) {
        await fs.promises.mkdir(target, { recursive: true });
        extractedDirs++;
        continue;
      }
      if (filetype === 'SymbolicLink') {
        // Refuse to create symlinks from untrusted archives.
        outputChannel.appendLine(`Skipping symlink entry: ${entryPath}`);
        continue;
      }

      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      const chunk = entry.readData();
      if (!chunk) {
        // Zero-size entry; make sure the file still exists on disk.
        await fs.promises.writeFile(target, Buffer.alloc(0));
        extractedFiles++;
        continue;
      }
      await fs.promises.writeFile(target, Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      extractedFiles++;
    }
  } catch (error) {
    if (error instanceof Error && /memory access out of bounds|abort|RuntimeError/i.test(error.message)) {
      // A wasm abort usually means the data is not a recognizable archive at all.
      throw new Error(
        `libarchive-wasm could not read ${archiveLabel}: the file does not appear to be a recognizable archive.`
      );
    }
    throw error;
  } finally {
    try { reader.free(); } catch { /* ignore */ }
  }
  outputChannel.appendLine(
    `libarchive-wasm extracted ${extractedFiles} files, ${extractedDirs} directories from ${archiveLabel}`
  );
}

interface ArchiveSignatureInfo {
  format: string;
  hex: string;
}

/**
 * Detect the archive type from the leading bytes. ZIP archives start with
 * "PK"; toolkit archives are sometimes RAR ("Rar!"), 7-Zip ("7z\xBC\xAF") or
 * self-extracting executables with an MZ header — all of which libarchive-wasm
 * can read even when the file is named .zip.
 */
async function detectArchiveSignature(filePath: string): Promise<ArchiveSignatureInfo | null> {
  try {
    const handle = await fs.promises.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(8);
      const read = await handle.read(buffer, 0, 8, 0);
      const hex = buffer.slice(0, read.bytesRead).toString('hex').toUpperCase();
      if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
        return { format: 'zip', hex };
      }
      if (buffer[0] === 0x52 && buffer[1] === 0x61 && buffer[2] === 0x72 && buffer[3] === 0x21) {
        return { format: 'rar', hex };
      }
      if (buffer[0] === 0x37 && buffer[1] === 0x7a && buffer[2] === 0xbc && buffer[3] === 0xaf) {
        return { format: '7z', hex };
      }
      if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
        return { format: 'sfx-executable', hex };
      }
      return { format: 'unknown', hex };
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

async function hasZipSignature(filePath: string): Promise<boolean> {
  const info = await detectArchiveSignature(filePath);
  return info !== null && info.format !== 'unknown';
}

async function extractZip(
  context: vscode.ExtensionContext,
  source: string,
  destination: string
): Promise<void> {
  await fs.promises.mkdir(destination, { recursive: true });

  const stat = await fs.promises.stat(source).catch(() => undefined);
  const sizeLabel = stat ? `${stat.size} bytes` : 'unknown size';
  outputChannel.appendLine(`Extracting ${source} (${sizeLabel})...`);

  if (!stat || stat.size === 0) {
    throw new Error(
      `Archive ${path.basename(source)} is missing or empty (${sizeLabel}). Re-download the toolkit.`
    );
  }
  // Do not gate extraction on the signature: toolkit archives are sometimes
  // RAR/7z/SFX payloads named .zip, which extract-zip rejects but
  // libarchive-wasm reads. Log what we found and let the extractors decide.
  const signature = await detectArchiveSignature(source);
  if (!signature || signature.format === 'unknown') {
    outputChannel.appendLine(
      `Warning: ${path.basename(source)} has an unrecognized leading signature ` +
      `(${signature ? signature.hex : 'unreadable'}). Attempting extraction anyway.`
    );
  } else if (signature.format !== 'zip') {
    outputChannel.appendLine(
      `${path.basename(source)} is ${signature.format} data (starts with ${signature.hex}) — ` +
      `skipping extract-zip and using libarchive-wasm.`
    );
    await extractZipWithLibarchive(context, source, destination);
    return;
  } else {
    outputChannel.appendLine(`${path.basename(source)} has a valid ZIP signature (${signature.hex}).`);
  }

  let extractZipError: unknown;
  try {
    await extractZipModule(source, { dir: destination });
    return;
  } catch (error) {
    extractZipError = error;
    outputChannel.appendLine(`extract-zip failed for ${path.basename(source)}: ${String(error)}`);
  }
  let libarchiveError: unknown;
  try {
    await extractZipWithLibarchive(context, source, destination);
    outputChannel.appendLine(`Extracted ${path.basename(source)} with libarchive-wasm.`);
    return;
  } catch (error) {
    libarchiveError = error;
    outputChannel.appendLine(
      `libarchive-wasm failed for ${path.basename(source)}: ${String(error)}`
    );
  }
  try {
    if (process.platform === 'win32') {
      // Official VS Code on Windows has no system unzip binary.
      outputChannel.appendLine(
        `System unzip is not available on ${process.platform} — skipping the final fallback.`
      );
      throw new Error('System unzip is not available on this platform.');
    }
    await extractZipWithSystemUnzip(source, destination);
  } catch (unzipError) {
    throw new Error(
      `Failed to extract ${path.basename(source)} (${sizeLabel}). ` +
      `extract-zip: ${String(extractZipError)}. libarchive-wasm: ${String(libarchiveError)}. unzip: ${String(unzipError)}. ` +
      `The archive may be corrupted — delete the cached toolkit and download it again.`
    );
  }
}

async function extractZipIfNeeded(
  context: vscode.ExtensionContext,
  source: string,
  destination: string,
  archiveName: string
): Promise<void> {
  const marker = path.join(destination, '.macle-toolkit-archive');
  try {
    if ((await fs.promises.readFile(marker, 'utf8')) === archiveName) return;
  } catch {
    // Extract into a clean staging directory when the completion marker is absent.
  }

  const stagingPath = `${destination}.staging`;
  await fs.promises.rm(stagingPath, { recursive: true, force: true });
  await fs.promises.mkdir(stagingPath, { recursive: true });
  try {
    await extractZip(context, source, stagingPath);
    await fs.promises.writeFile(path.join(stagingPath, '.macle-toolkit-archive'), archiveName);
    await fs.promises.rm(destination, { recursive: true, force: true });
    await fs.promises.rename(stagingPath, destination);
  } catch (error) {
    await fs.promises.rm(stagingPath, { recursive: true, force: true });
    throw error;
  }
}

async function findNamedEntry(
  root: string,
  name: string,
  entryType: 'file' | 'directory'
): Promise<string | undefined> {
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    const entries = await fs.promises.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.name === name && (entryType === 'file' ? entry.isFile() : entry.isDirectory())) {
        return fullPath;
      }
      if (entry.isDirectory()) pending.push(fullPath);
    }
  }
  return undefined;
}

async function findFileWithExtension(
  root: string,
  extension: string
): Promise<string | undefined> {
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    let entries;
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
        return fullPath;
      }
      if (entry.isDirectory()) pending.push(fullPath);
    }
  }
  return undefined;
}

/**
 * Poll briefly for the newly installed extension to become visible. A freshly
 * installed extension may not appear in the current session until the window
 * reloads, so this is informational only.
 */
async function waitForExtensionVisible(extensionId: string, timeoutMs = 10000): Promise<boolean> {
  if (vscode.extensions.getExtension(extensionId)) return true;
  const deadline = Date.now() + timeoutMs;
  return await new Promise<boolean>((resolve) => {
    const timer = setInterval(() => {
      if (vscode.extensions.getExtension(extensionId)) {
        cleanup();
        resolve(true);
      } else if (Date.now() > deadline) {
        cleanup();
        resolve(false);
      }
    }, 500);
    const subscription = vscode.extensions.onDidChange(() => {
      if (vscode.extensions.getExtension(extensionId)) {
        cleanup();
        resolve(true);
      }
    });
    const cleanup = () => {
      clearInterval(timer);
      subscription.dispose();
    };
  });
}

/**
 * Install the official Macle VS Code extension, step by step:
 *
 *  1. Try the marketplace (gallery) by extension ID.
 *  2. If that fails, install from the .vsix shipped inside the toolkit's IDE archive.
 *  3. If that also fails, show the user the .vsix path so it can be installed
 *     manually with "Extensions: Install from VSIX...".
 *
 * A completed install command (no thrown error) is treated as success — VS Code
 * shows its own "Completed installing extension." notification. The extension
 * may only become visible/active after a window reload.
 */
async function installOfficialIdeExtension(
  context: vscode.ExtensionContext,
  toolkitRoot: string,
  ideDirectory: string
): Promise<boolean> {
  const config = loadToolkitConfig(context);
  const officialExtensionId = config.officialExtension.id;

  // Official VS Code mechanism for programmatic installs:
  // 'workbench.extensions.installExtension' accepts an extension ID (marketplace
  // install) or a VSIX URI (install from file).
  const installOfficial = async (
    target: string | vscode.Uri,
    label: string
  ): Promise<boolean> => {
    await vscode.commands.executeCommand('workbench.extensions.installExtension', target);
    const visible = await waitForExtensionVisible(officialExtensionId);
    if (visible) {
      outputChannel.appendLine(`Installed official Macle extension ${officialExtensionId} ${label}.`);
    } else {
      outputChannel.appendLine(
        `Install command ${label} completed; ${officialExtensionId} is not visible in this session yet. ` +
        `A window reload will activate it.`
      );
    }
    return true;
  };

  if (vscode.extensions.getExtension(officialExtensionId)) {
    outputChannel.appendLine(`Official Macle extension ${officialExtensionId} is already installed.`);
    return true;
  }

  // Step 1: marketplace / gallery install by ID.
  outputChannel.appendLine(`Trying to install ${officialExtensionId} from the marketplace...`);
  try {
    if (await installOfficial(officialExtensionId, 'from the marketplace')) {
      return true;
    }
  } catch (error) {
    outputChannel.appendLine(
      `Marketplace install of ${officialExtensionId} failed: ${String(error)}`
    );
  }

  // Step 2: install from the .vsix inside the toolkit IDE archive.
  const vsixPath = await findFileWithExtension(ideDirectory, '.vsix');
  if (vsixPath) {
    outputChannel.appendLine(`Trying to install the official Macle extension from ${vsixPath}...`);
    try {
      if (await installOfficial(vscode.Uri.file(vsixPath), 'from the toolkit')) {
        return true;
      }
    } catch (error) {
      outputChannel.appendLine(
        `Toolkit VSIX install of ${officialExtensionId} failed: ${String(error)}`
      );
    }
  } else {
    outputChannel.appendLine(`No .vsix package found in ${ideDirectory}.`);
  }

  // Step 3: give the user everything needed to install manually.
  if (vsixPath) {
    const choice = await vscode.window.showErrorMessage(
      `Could not install the official Macle extension (${officialExtensionId}) automatically. ` +
      `Install it manually with the command "Extensions: Install from VSIX..." and select: ${vsixPath}`,
      'Copy VSIX Path',
      'Open Extensions View'
    );
    if (choice === 'Copy VSIX Path') {
      await vscode.env.clipboard.writeText(vsixPath);
      void vscode.window.showInformationMessage(`VSIX path copied: ${vsixPath}`);
    } else if (choice === 'Open Extensions View') {
      await vscode.commands.executeCommand('workbench.view.extensions');
    }
  } else {
    void vscode.window.showErrorMessage(
      `Could not install the official Macle extension (${officialExtensionId}), and no .vsix was found in the toolkit IDE archive at ${ideDirectory}.`
    );
  }
  return false;
}

async function resolveWebSimulatorEntry(context: vscode.ExtensionContext): Promise<string | undefined> {
  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;
  const folder = config.webSimulator?.folder || 'simulator-web';
  const entry = config.webSimulator?.entry || 'src/cli.js';

  const candidates = [
    path.join(storagePath, folder, entry),
    path.join(storagePath, folder, 'simulator-web-1.0.0', entry),
    path.join(storagePath, 'toolkit', config.toolkit.version, 'simulator', 'web', entry),
    path.join(storagePath, 'toolkit', config.toolkit.version, 'simulator', 'web', 'simulator-web-1.0.0', entry),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const baseDir = path.join(storagePath, folder);
  if (fs.existsSync(baseDir)) {
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const nested = path.join(baseDir, ent.name, entry);
          if (fs.existsSync(nested)) return nested;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const localCli = require.resolve('@macle-community/simulator-web/src/cli.js');
    if (fs.existsSync(localCli)) return localCli;
  } catch {
    // ignore
  }

  return undefined;
}

async function ensureWebSimulatorInstalled(
  context: vscode.ExtensionContext
): Promise<string> {
  const existing = await resolveWebSimulatorEntry(context);
  if (existing) {
    outputChannel.appendLine(`Found Macle Web Simulator at ${existing}`);
    return existing;
  }

  const config = loadToolkitConfig(context);
  const url =
    config.webSimulator?.url ||
    'https://github.com/macle-community/simulator-web/archive/refs/tags/v1.0.0.zip';
  const fileName = config.webSimulator?.fileName || 'simulator-web-1.0.0.zip';
  const targetFolder = config.webSimulator?.folder || 'simulator-web';

  const storagePath = context.globalStorageUri.fsPath;
  await fs.promises.mkdir(storagePath, { recursive: true });

  const archivePath = path.join(storagePath, fileName);
  const destinationDir = path.join(storagePath, targetFolder);

  outputChannel.appendLine(`Downloading Macle Web Simulator from ${url}...`);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Downloading Macle Web Simulator',
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: 'Downloading...' });
      await downloadToolkitFile(
        new URL(url),
        archivePath,
        progress,
        { received: 0, reportedPercent: 0 },
        0
      );
      progress.report({ message: 'Extracting Web Simulator...' });
      outputChannel.appendLine(`Extracting Web Simulator to ${destinationDir}...`);
      await extractZip(context, archivePath, destinationDir);
    }
  );

  const resolved = await resolveWebSimulatorEntry(context);
  if (!resolved) {
    throw new Error(`Web simulator extracted at ${destinationDir}, but entry point could not be located.`);
  }
  outputChannel.appendLine(`Macle Web Simulator installed at: ${resolved}`);
  return resolved;
}

async function openWebSimulator(
  outputDir: string,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const cliPath = await ensureWebSimulatorInstalled(context);
    const config = loadToolkitConfig(context);
    const port = config.webSimulator?.port || 30001;

    if (webSimulatorProcess && webSimulatorProcess.exitCode === null) {
      const activeUrl = simulatorServerUrl || `http://localhost:${port}`;
      outputChannel.appendLine(`Macle Web Simulator is already running at ${activeUrl}`);
      presentSimulatorUrl(activeUrl, context, 'Macle Web Simulator');
      return;
    }

    const webSourceDir = fs.existsSync(path.join(outputDir, 'app', 'app-config.json'))
      ? path.join(outputDir, 'app')
      : outputDir;
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Macle Web Simulator for ${webSourceDir}...`);
    outputChannel.appendLine(`CLI: ${cliPath}`);

    const args = [cliPath, '-s', webSourceDir, '-p', String(port), '-w', '-o'];
    const child = spawn(process.execPath || 'node', args, {
      cwd: path.dirname(cliPath),
      env: process.env,
    });
    webSimulatorProcess = child;

    let simulatorOpened = false;
    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      outputChannel.append(text);
      if (!simulatorOpened && (text.includes('Local URL:') || text.includes('Dual-Thread:') || text.includes(`:${port}`))) {
        simulatorOpened = true;
        presentSimulatorUrl(`http://localhost:${port}`, context, 'Macle Web Simulator');
      }
    });
    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));

    child.on('error', (err) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      outputChannel.appendLine(`Failed to launch Web Simulator: ${err.message}`);
      void vscode.window.showErrorMessage(`Failed to launch Web Simulator: ${err.message}`);
    });

    child.on('exit', (code) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      outputChannel.appendLine(`Web Simulator server stopped (exit code ${code ?? 0}).`);
    });

    setTimeout(() => {
      if (!simulatorOpened && webSimulatorProcess === child) {
        simulatorOpened = true;
        presentSimulatorUrl(`http://localhost:${port}`, context, 'Macle Web Simulator');
      }
    }, 1500);
  } catch (error) {
    outputChannel.appendLine(`Could not start Macle Web Simulator: ${String(error)}`);
    void vscode.window.showErrorMessage(`Could not start Macle Web Simulator: ${String(error)}`);
  }
}

interface ResolvedLinuxSimulator {
  dir: string;
  executable?: string;
  webScript: string;
}

async function findLinuxDesktopSimulator(
  context: vscode.ExtensionContext
): Promise<{ dir: string; executable: string } | undefined> {
  const config = loadToolkitConfig(context);
  const macleConfig = vscode.workspace.getConfiguration('macle');
  const simName = config.platforms?.linux?.executableName || 'macle-simulator';

  // 1. User setting: macle.simulator.path
  const customSimPath = macleConfig.get<string>('simulator.path')?.trim();
  if (customSimPath) {
    const expanded = expandUserPath(customSimPath);
    if (fs.existsSync(expanded)) {
      const dir = fs.statSync(expanded).isDirectory() ? expanded : path.dirname(expanded);
      const exe = fs.statSync(expanded).isDirectory() ? path.join(expanded, simName) : expanded;
      if (fs.existsSync(exe)) {
        return { dir, executable: exe };
      }
    }
  }

  // 2. Local toolkits (setting, official extension, or default search paths)
  const officialExtPath = findOfficialExtensionPath(context);
  const localSetting = macleConfig.get<string>('toolkit.localPath')?.trim();
  const localState = context.globalState.get<string>('macle.toolkit.localPath');
  const toolkitRoots = [
    localSetting ? expandUserPath(localSetting) : '',
    localState ? expandUserPath(localState) : '',
    officialExtPath ? path.join(officialExtPath, 'src', 'utils') : '',
    path.join(os.homedir(), 'macle', 'DevToolkit_26.6.0'),
    path.join(os.homedir(), 'macle', 'DevToolkit_25.9.0'),
    path.join(os.homedir(), 'nati', 'macle', 'DevToolkit_26.6.0'),
    path.join(os.homedir(), 'nati', 'macle', 'DevToolkit_25.9.0'),
    path.join(context.globalStorageUri.fsPath, config.toolkit.storageFolder, config.toolkit.version),
  ].filter(Boolean);

  for (const tkRoot of toolkitRoots) {
    if (!fs.existsSync(tkRoot)) continue;
    const candidates = [
      path.join(tkRoot, 'DevToolkit_26.6.0-LG0001', 'Macle_26.6.0-LG0001_DevSuite_Simulator', 'Macle_26.6.0-LG0001_DevSuite_Simulator_Linux', simName),
      path.join(tkRoot, 'Macle_25.9.0_DevSuite_Simulator', 'Macle_25.9.0_DevSuite_Simulator_Linux', simName),
      path.join(tkRoot, 'simulator', 'linux', simName),
      path.join(tkRoot, 'simulator', 'Macle_26.6.0-LG0001_DevSuite_Simulator_Linux', simName),
      path.join(tkRoot, 'Macle_26.6.0-LG0001_DevSuite_Simulator_Linux', simName),
      path.join(tkRoot, 'Macle_25.9.0_DevSuite_Simulator_Linux', simName),
      path.join(tkRoot, 'simulator', simName),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        const binCand = path.join(path.dirname(cand), `${simName}-bin`);
        if (fs.existsSync(binCand)) {
          return { dir: path.dirname(cand), executable: cand };
        }
      }
    }
  }

  // 3. System PATH or ~/.local/bin/macle-simulator
  const userLocalExe = path.join(os.homedir(), '.local', 'bin', simName);
  if (fs.existsSync(userLocalExe)) {
    try {
      const real = fs.realpathSync(userLocalExe);
      const binInReal = path.join(path.dirname(real), `${simName}-bin`);
      if (fs.existsSync(binInReal)) {
        return { dir: path.dirname(real), executable: userLocalExe };
      }
      const scriptText = fs.readFileSync(userLocalExe, 'utf8');
      if (scriptText.includes('macle-simulator')) {
        return { dir: path.dirname(userLocalExe), executable: userLocalExe };
      }
    } catch {
      // ignore
    }
  }

  try {
    const whichOut = execSync(`which ${simName} 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (whichOut && fs.existsSync(whichOut)) {
      const real = fs.realpathSync(whichOut);
      if (fs.existsSync(path.join(path.dirname(real), `${simName}-bin`))) {
        return { dir: path.dirname(real), executable: whichOut };
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}

async function resolveLinuxSimulatorEntry(
  context: vscode.ExtensionContext
): Promise<ResolvedLinuxSimulator | undefined> {
  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;
  const folder = config.platforms?.linux?.folder || 'simulator-linux';
  const webEntry = config.platforms?.linux?.webEntry || 'macle-web-simulator.js';
  const execName = config.platforms?.linux?.executableName || 'macle-simulator';

  // Check desktop simulator first
  const desktopSim = await findLinuxDesktopSimulator(context);

  const baseDir = path.join(storagePath, folder);
  const candidateDirs = [
    ...(desktopSim ? [desktopSim.dir] : []),
    baseDir,
    path.join(baseDir, 'simulator-linux-v-1.0.0'),
    path.join(storagePath, 'toolkit', config.toolkit.version, 'simulator', 'linux'),
    path.join(storagePath, 'toolkit', config.toolkit.version, 'simulator', 'linux', 'simulator-linux-v-1.0.0'),
  ];

  if (fs.existsSync(baseDir)) {
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          candidateDirs.push(path.join(baseDir, ent.name));
        }
      }
    } catch {
      // ignore
    }
  }

  for (const dir of candidateDirs) {
    const webScript = path.join(dir, webEntry);
    if (fs.existsSync(webScript)) {
      const execPath = desktopSim?.executable || path.join(dir, execName);
      return {
        dir,
        webScript,
        executable: fs.existsSync(execPath) ? execPath : undefined,
      };
    }
  }

  if (desktopSim) {
    return {
      dir: desktopSim.dir,
      webScript: path.join(desktopSim.dir, webEntry),
      executable: desktopSim.executable,
    };
  }

  return undefined;
}

async function ensureLinuxSimulatorInstalled(
  context: vscode.ExtensionContext
): Promise<ResolvedLinuxSimulator> {
  const existing = await resolveLinuxSimulatorEntry(context);
  if (existing) {
    outputChannel.appendLine(`Found Macle Linux Simulator at ${existing.webScript}`);
    await syncSimulatorToOfficialExtension(context, 'linux', existing.dir);
    return existing;
  }

  const config = loadToolkitConfig(context);
  const linuxConfig = config.platforms?.linux;
  const url =
    linuxConfig?.url ||
    'https://github.com/macle-community/simulator-linux/archive/refs/tags/v-1.0.0.zip';
  const fileName = linuxConfig?.fileName || 'simulator-linux-v-1.0.0.zip';
  const targetFolder = linuxConfig?.folder || 'simulator-linux';

  const storagePath = context.globalStorageUri.fsPath;
  await fs.promises.mkdir(storagePath, { recursive: true });

  const archivePath = path.join(storagePath, fileName);
  const destinationDir = path.join(storagePath, targetFolder);

  outputChannel.appendLine(`Downloading Macle Linux Simulator from ${url}...`);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Downloading Macle Linux Simulator',
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: 'Downloading Linux Simulator...' });
      await downloadToolkitFile(
        new URL(url),
        archivePath,
        progress,
        { received: 0, reportedPercent: 0 },
        0
      );
      progress.report({ message: 'Extracting Linux Simulator...' });
      outputChannel.appendLine(`Extracting Linux Simulator to ${destinationDir}...`);
      await extractZip(context, archivePath, destinationDir);
    }
  );

  const resolved = await resolveLinuxSimulatorEntry(context);
  if (!resolved) {
    throw new Error(`Linux simulator extracted at ${destinationDir}, but entry point could not be located.`);
  }

  if (resolved.executable) {
    try {
      await fs.promises.chmod(resolved.executable, 0o755);
    } catch {
      // ignore
    }
  }

  await syncSimulatorToOfficialExtension(context, 'linux', resolved.dir);
  outputChannel.appendLine(`Macle Linux Simulator installed at: ${resolved.webScript}`);
  return resolved;
}

async function openLinuxSimulator(
  outputDir: string,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const sim = await ensureLinuxSimulatorInstalled(context);
    const config = loadToolkitConfig(context);
    const defaultPort = config.platforms?.linux?.port || 30000;
    const macleConfig = vscode.workspace.getConfiguration('macle');
    const simType = macleConfig.get<string>('simulator.type', 'platform');
    const openIn = macleConfig.get<string>('simulator.openIn', 'vscode');

    if (webSimulatorProcess && webSimulatorProcess.exitCode === null) {
      if (openIn === 'vscode') {
        if (webSimulatorProcess.connected) {
          try {
            webSimulatorProcess.send('refresh-simulator');
          } catch {
            // ignore
          }
        }
        const activeUrl = simulatorServerUrl || `http://localhost:${defaultPort}`;
        openSimulatorInsideVscode(activeUrl, context);
        return;
      }
      outputChannel.appendLine(`Macle Simulator is already running at http://localhost:${defaultPort}`);
      presentSimulatorUrl(`http://localhost:${defaultPort}`, context, 'Macle Linux Simulator');
      return;
    }

    const preferredRoot = projectRoot() || outputDir;
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Macle Linux Simulator...`);
    outputChannel.appendLine(`Source: ${outputDir}`);
    outputChannel.appendLine(`Root: ${preferredRoot}`);

    const hasDesktopBin = sim.executable && (
      fs.existsSync(path.join(sim.dir, 'macle-simulator-bin')) ||
      (sim.executable.endsWith('macle-simulator') && fs.existsSync(sim.executable))
    );
    const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

    // 1. Open inside VS Code using official simulator server mode (-o + IPC) when preferred
    if (openIn === 'vscode' && simType !== 'web' && hasDesktopBin && sim.executable) {
      try {
        await spawnOfficialSimulatorServer(sim.executable, sim.dir, outputDir, preferredRoot, context);
        return;
      } catch (serverErr) {
        outputChannel.appendLine(
          `Official simulator server mode failed (${String(serverErr)}). Falling back to web script...`
        );
      }
    }

    let child: ChildProcess;
    let serverPort = defaultPort;

    if (openIn === 'standalone' && simType !== 'web' && hasDesktopBin && hasDisplay && sim.executable) {
      outputChannel.appendLine(`Launching native Linux desktop simulator: ${sim.executable}`);
      child = spawn(sim.executable, ['-s', outputDir, '-r', preferredRoot], {
        cwd: sim.dir,
        env: process.env,
      });
      webSimulatorProcess = child;
      child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
      child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
      child.on('error', (err) => {
        if (webSimulatorProcess === child) webSimulatorProcess = undefined;
        outputChannel.appendLine(`Failed to launch Linux Simulator: ${err.message}`);
        void vscode.window.showErrorMessage(`Failed to launch Linux Simulator: ${err.message}`);
      });
      child.on('exit', (code) => {
        if (webSimulatorProcess === child) webSimulatorProcess = undefined;
        outputChannel.appendLine(`Linux Simulator stopped (exit code ${code ?? 0}).`);
      });
      return;
    }

    outputChannel.appendLine(`Launching Linux web simulator: ${sim.webScript}`);
    const webSourceDir = fs.existsSync(path.join(outputDir, 'app', 'app-config.json'))
      ? path.join(outputDir, 'app')
      : outputDir;
    child = spawn(process.execPath || 'node', [sim.webScript, '-s', webSourceDir, '-r', preferredRoot], {
      cwd: sim.dir,
      env: process.env,
    });

    webSimulatorProcess = child;
    let simulatorOpened = false;

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      outputChannel.append(text);
      const urlMatch = text.match(/http:\/\/localhost:(\d+)\/?/);
      if (urlMatch) {
        serverPort = parseInt(urlMatch[1], 10);
      }
      if (!simulatorOpened && (text.includes('http://localhost') || text.includes('Web Simulator running'))) {
        simulatorOpened = true;
        presentSimulatorUrl(`http://localhost:${serverPort}/`, context, 'Macle Linux Simulator');
      }
    });

    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));

    child.on('error', (err) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      outputChannel.appendLine(`Failed to launch Linux Simulator: ${err.message}`);
      void vscode.window.showErrorMessage(`Failed to launch Linux Simulator: ${err.message}`);
    });

    child.on('exit', (code) => {
      if (webSimulatorProcess === child) webSimulatorProcess = undefined;
      outputChannel.appendLine(`Linux Simulator stopped (exit code ${code ?? 0}).`);
    });

    setTimeout(() => {
      if (!simulatorOpened && webSimulatorProcess === child) {
        simulatorOpened = true;
        presentSimulatorUrl(`http://localhost:${serverPort}/`, context, 'Macle Linux Simulator');
      }
    }, 2000);
  } catch (error) {
    outputChannel.appendLine(`Could not start Macle Linux Simulator: ${String(error)}. Falling back to Web Simulator...`);
    await openWebSimulator(outputDir, context);
  }
}

function findOfficialExtensionPath(context: vscode.ExtensionContext): string | undefined {
  const config = loadToolkitConfig(context);
  const loaded = vscode.extensions.getExtension(config.officialExtension.id);
  if (loaded?.extensionPath && fs.existsSync(loaded.extensionPath)) {
    return loaded.extensionPath;
  }

  const prefix = `${config.officialExtension.id.toLowerCase()}-`;
  const searchRoots = Array.from(
    new Set([
      path.dirname(context.extensionPath),
      path.join(os.homedir(), '.vscode', 'extensions'),
    ])
  );

  for (const root of searchRoots) {
    if (!fs.existsSync(root)) continue;
    try {
      const entries = fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith(prefix))
        .map((entry) => entry.name)
        .sort()
        .reverse();
      if (entries.length > 0) {
        return path.join(root, entries[0]);
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

async function syncSimulatorToOfficialExtension(
  context: vscode.ExtensionContext,
  platform: NodeJS.Platform,
  sourcePath: string
): Promise<boolean> {
  const officialExtPath = findOfficialExtensionPath(context);
  if (!officialExtPath) return false;

  const config = loadToolkitConfig(context);
  const relDir = config.officialExtension.relativeSimulatorDirectory ?? ['src', 'utils', 'simulator'];

  let platformFolder: string | undefined;
  let expectedTargetExecutable: string | undefined;
  if (platform === 'darwin') {
    platformFolder = config.platforms.darwin.simulatorDirectory;
    expectedTargetExecutable = path.join(
      config.platforms.darwin.appName,
      ...config.platforms.darwin.executableRelativePath
    );
  } else if (platform === 'win32') {
    platformFolder = config.platforms.win32.simulatorDirectory;
    expectedTargetExecutable = config.platforms.win32.executableName;
  } else if (platform === 'linux') {
    platformFolder = config.platforms.linux?.simulatorDirectory || 'linux';
    expectedTargetExecutable = config.platforms.linux?.executableName || 'macle-simulator';
  }

  if (!platformFolder || !expectedTargetExecutable) return false;

  const targetDir = path.join(officialExtPath, ...relDir, platformFolder);
  const targetExecutablePath = path.join(targetDir, expectedTargetExecutable);
  const sourceHasLinuxBin =
    platform === 'linux' && fs.existsSync(path.join(sourcePath, 'macle-simulator-bin'));
  const targetHasLinuxBin =
    platform !== 'linux' || !sourceHasLinuxBin || fs.existsSync(path.join(targetDir, 'macle-simulator-bin'));

  if (fs.existsSync(targetExecutablePath) && targetHasLinuxBin) {
    return true;
  }

  try {
    await fs.promises.mkdir(targetDir, { recursive: true });
    if (platform === 'darwin') {
      const appName = config.platforms.darwin.appName;
      const sourceApp = sourcePath.endsWith(appName)
        ? sourcePath
        : path.join(sourcePath, appName);
      if (!fs.existsSync(sourceApp)) return false;
      const destinationApp = path.join(targetDir, appName);
      await fs.promises.rm(destinationApp, { recursive: true, force: true });
      await fs.promises.cp(sourceApp, destinationApp, { recursive: true });
      await fs.promises.chmod(
        path.join(destinationApp, ...config.platforms.darwin.executableRelativePath),
        0o755
      );
    } else {
      await fs.promises.cp(sourcePath, targetDir, { recursive: true, force: true });
      if (platform === 'linux') {
        for (const binName of [
          config.platforms.linux?.executableName || 'macle-simulator',
          'macle-simulator-bin',
          'chrome-sandbox',
          'chrome_crashpad_handler',
        ]) {
          const binPath = path.join(targetDir, binName);
          if (fs.existsSync(binPath)) {
            try {
              await fs.promises.chmod(binPath, 0o755);
            } catch {
              // ignore
            }
          }
        }
      }
    }
    outputChannel.appendLine(
      `Automatically synced ${platform} simulator to official Macle extension at ${targetDir}`
    );
    return true;
  } catch (error) {
    outputChannel.appendLine(
      `Could not sync ${platform} simulator to official Macle extension: ${String(error)}`
    );
    return false;
  }
}

async function autoSyncAvailableSimulators(context: vscode.ExtensionContext): Promise<void> {
  if (!findOfficialExtensionPath(context)) return;

  const config = loadToolkitConfig(context);
  const platform = process.platform;

  if (platform === 'linux') {
    const sim = await resolveLinuxSimulatorEntry(context);
    if (sim) {
      await syncSimulatorToOfficialExtension(context, 'linux', sim.dir);
    }
    return;
  }

  if (platform !== 'darwin' && platform !== 'win32') return;

  const platformConfig = platform === 'darwin' ? config.platforms.darwin : config.platforms.win32;
  const storageRoot = context.globalStorageUri.fsPath;
  const localSetting = vscode.workspace.getConfiguration('macle.toolkit').get<string>('localPath', '').trim();
  const localState = context.globalState.get<string>('macle.toolkit.localPath') || '';

  const candidateRoots = [
    localSetting ? expandUserPath(localSetting) : '',
    localState ? expandUserPath(localState) : '',
    path.join(os.homedir(), 'macle', 'DevToolkit_26.6.0'),
    path.join(os.homedir(), 'macle', 'DevToolkit_25.9.0'),
    path.join(storageRoot, config.toolkit.storageFolder, config.toolkit.version),
  ].filter(Boolean);

  for (const tkRoot of candidateRoots) {
    if (!fs.existsSync(tkRoot)) continue;
    if (platform === 'darwin') {
      const directApp = path.join(tkRoot, 'simulator', platformConfig.simulatorDirectory, config.platforms.darwin.appName);
      if (fs.existsSync(directApp)) {
        await syncSimulatorToOfficialExtension(context, 'darwin', directApp);
        return;
      }
      const foundApp = await findNamedEntry(tkRoot, config.platforms.darwin.appName, 'directory');
      if (foundApp) {
        await syncSimulatorToOfficialExtension(context, 'darwin', foundApp);
        return;
      }
    } else {
      const directExe = path.join(tkRoot, 'simulator', platformConfig.simulatorDirectory, config.platforms.win32.executableName);
      if (fs.existsSync(directExe)) {
        await syncSimulatorToOfficialExtension(context, 'win32', path.dirname(directExe));
        return;
      }
      const foundExe = await findNamedEntry(tkRoot, config.platforms.win32.executableName, 'file');
      if (foundExe) {
        await syncSimulatorToOfficialExtension(context, 'win32', path.dirname(foundExe));
        return;
      }
    }
  }
}

async function installPlatformSimulator(
  context: vscode.ExtensionContext,
  toolkitRoot: string,
  simulatorDirectory: string
): Promise<boolean> {
  const config = loadToolkitConfig(context);

  const platform = process.platform;
  if (platform === 'linux') {
    outputChannel.appendLine(`Installing Linux Simulator (v-1.0.0)...`);
    try {
      await ensureLinuxSimulatorInstalled(context);
      return true;
    } catch (err) {
      outputChannel.appendLine(`Linux Simulator setup notice: ${String(err)}. Falling back to web simulator...`);
      await ensureWebSimulatorInstalled(context);
      return true;
    }
  }
  if (platform !== 'darwin' && platform !== 'win32') {
    outputChannel.appendLine(
      `No official desktop simulator for ${platform}. Installing Macle Web Simulator as default...`
    );
    try {
      await ensureWebSimulatorInstalled(context);
      return true;
    } catch (err) {
      outputChannel.appendLine(`Web Simulator setup failed: ${String(err)}`);
      return false;
    }
  }

  const platformConfig = platform === 'darwin'
    ? config.platforms.darwin
    : config.platforms.win32;
  const platformArchiveName = `${config.archives.platformPrefix}_${platformConfig.archiveLabel}${config.archives.platformSuffix}`;
  const platformArchive = await findNamedEntry(simulatorDirectory, platformArchiveName, 'file');
  if (!platformArchive) throw new Error(`The simulator package is missing ${platformArchiveName}.`);

  const officialSimulatorDirectory = path.join(
    toolkitRoot,
    'simulator',
    platformConfig.simulatorDirectory
  );
  const installMarker = path.join(officialSimulatorDirectory, '.macle-toolkit-version');
  const expectedExecutable =
    platform === 'darwin'
      ? path.join(
          officialSimulatorDirectory,
          config.platforms.darwin.appName,
          ...config.platforms.darwin.executableRelativePath
        )
      : path.join(officialSimulatorDirectory, config.platforms.win32.executableName);
  try {
    if ((await fs.promises.readFile(installMarker, 'utf8')) === platformArchiveName) {
      await fs.promises.access(expectedExecutable);
      await syncSimulatorToOfficialExtension(
        context,
        platform,
        platform === 'darwin'
          ? path.join(officialSimulatorDirectory, config.platforms.darwin.appName)
          : officialSimulatorDirectory
      );
      return true;
    }
  } catch {
    // Install or repair the simulator when its marker or executable is missing.
  }

  const extractedPlatform = path.join(toolkitRoot, `simulator-${platform}-staging`);
  await fs.promises.rm(extractedPlatform, { recursive: true, force: true });
  await extractZip(context, platformArchive, extractedPlatform);

  let simulatorSource: string;
  if (platform === 'darwin') {
    simulatorSource =
      (await findNamedEntry(extractedPlatform, config.platforms.darwin.appName, 'directory')) ?? '';
    if (!simulatorSource) throw new Error(`The Mac simulator archive does not contain ${config.platforms.darwin.appName}.`);
    await fs.promises.access(
      path.join(simulatorSource, ...config.platforms.darwin.executableRelativePath)
    );
  } else {
    simulatorSource =
      (await findNamedEntry(extractedPlatform, config.platforms.win32.executableName, 'file')) ?? '';
    if (!simulatorSource) throw new Error(`The Windows simulator archive does not contain ${config.platforms.win32.executableName}.`);
  }

  await fs.promises.mkdir(officialSimulatorDirectory, { recursive: true });
  if (platform === 'darwin') {
    const destinationApp = path.join(officialSimulatorDirectory, config.platforms.darwin.appName);
    await fs.promises.rm(destinationApp, { recursive: true, force: true });
    await fs.promises.cp(simulatorSource, destinationApp, { recursive: true });
    await fs.promises.chmod(
      path.join(destinationApp, ...config.platforms.darwin.executableRelativePath),
      0o755
    );
    await syncSimulatorToOfficialExtension(context, 'darwin', destinationApp);
  } else {
    await fs.promises.cp(path.dirname(simulatorSource), officialSimulatorDirectory, {
      recursive: true,
      force: true,
    });
    await syncSimulatorToOfficialExtension(context, 'win32', officialSimulatorDirectory);
  }
  await fs.promises.writeFile(installMarker, platformArchiveName);
  return true;
}

async function prepareToolkit(
  context: vscode.ExtensionContext
): Promise<{
  toolkitRoot: string;
  simulatorInstalled: boolean;
  officialExtensionInstalled: boolean;
}> {
  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;

  outputChannel.appendLine(`Preparing Macle DevToolkit...`);
  outputChannel.appendLine(`Global storage path: ${storagePath}`);

  // Honor a user-provided existing toolkit folder (settings or welcome page).
  const localPathSetting = vscode.workspace
    .getConfiguration('macle.toolkit')
    .get<string>('localPath', '')
    .trim();
  const localPathRaw = localPathSetting || context.globalState.get<string>('macle.toolkit.localPath') || '';
  const localPath = localPathRaw ? expandUserPath(localPathRaw) : '';
  if (localPath) {
    try {
      const stat = await fs.promises.stat(localPath);
      if (stat.isDirectory()) {
        outputChannel.appendLine(`Using existing Macle toolkit at ${localPath}`);
        await autoSyncAvailableSimulators(context);
        return { toolkitRoot: localPath, simulatorInstalled: false, officialExtensionInstalled: false };
      }
    } catch {
      // Fall through to download when the saved path is missing or invalid.
    }
  }

  const toolkitRoot = path.join(storagePath, config.toolkit.storageFolder, config.toolkit.version);
  const archivePath = path.join(storagePath, config.download.fileName);
  await fs.promises.mkdir(toolkitRoot, { recursive: true });
  let archiveIsPresent = false;
  try {
    const stat = await fs.promises.stat(archivePath);
    archiveIsPresent = stat.size > 0 && (await hasZipSignature(archivePath));
    if (archiveIsPresent) {
      outputChannel.appendLine(`Toolkit archive already cached at ${archivePath} (${stat.size} bytes)`);
    } else if (stat && !(await hasZipSignature(archivePath))) {
      outputChannel.appendLine(
        `Toolkit archive at ${archivePath} (${stat.size} bytes) is not a valid ZIP file — deleting and re-downloading.`
      );
      await fs.promises.rm(archivePath, { force: true });
    }
  } catch {
    outputChannel.appendLine(`Toolkit archive not found at ${archivePath} — will download.`);
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Setting up Macle DevToolkit',
      cancellable: true,
    },
    async (progress, token) => {
      let officialExtensionInstalled = false;
      outputChannel.appendLine(`Starting toolkit setup with progress reporter.`);
      if (!archiveIsPresent) {
        const temporaryArchive = `${archivePath}.download`;
        // Keep any existing partial file so the download can resume instead of restarting.
        progress.report({ message: 'Downloading toolkit' });
        try {
          outputChannel.appendLine(`Downloading toolkit from ${config.download.url}...`);
          await downloadToolkitFile(new URL(config.download.url), temporaryArchive, progress, {
            received: 0,
            reportedPercent: 0,
          }, 0, token);
          await fs.promises.rename(temporaryArchive, archivePath);
          outputChannel.appendLine(`Downloaded Macle DevToolkit to ${archivePath}`);
        } catch (error) {
          if (token.isCancellationRequested) {
            outputChannel.appendLine(`Download cancelled by user. Partial file kept for resume.`);
            throw new Error('Download cancelled by user.');
          }
          outputChannel.appendLine(`Download failed: ${String(error)}`);
          throw error;
        }
      }

      if (token.isCancellationRequested) {
        outputChannel.appendLine(`Setup cancelled by user.`);
        throw new Error('Setup cancelled by user.');
      }

      const contentsDirectory = path.join(toolkitRoot, config.toolkit.contentsFolder);
      progress.report({ message: 'Extracting toolkit archive' });
      outputChannel.appendLine(`Extracting toolkit archive to ${contentsDirectory}...`);
      await extractZipIfNeeded(context, archivePath, contentsDirectory, config.download.fileName);

      const uiArchive = await findNamedEntry(contentsDirectory, config.archives.ui, 'file');
      const compilerArchive = await findNamedEntry(contentsDirectory, config.archives.compiler, 'file');
      const simulatorArchive = await findNamedEntry(contentsDirectory, config.archives.simulator, 'file');
      if (!uiArchive || !compilerArchive || !simulatorArchive) {
        throw new Error('The toolkit archive is missing one or more UI, Engine Compiler, or Simulator ZIPs.');
      }

      progress.report({ message: 'Extracting DevSuite UI' });
      const uiDirectory = path.join(toolkitRoot, config.toolkit.uiFolder);
      await extractZipIfNeeded(context, uiArchive, uiDirectory, config.archives.ui);
      progress.report({ message: 'Extracting Engine Compiler' });
      const compilerDirectory = path.join(toolkitRoot, config.toolkit.compilerFolder);
      await extractZipIfNeeded(context, compilerArchive, compilerDirectory, config.archives.compiler);
      progress.report({ message: 'Extracting Simulator' });
      const simulatorDirectory = path.join(toolkitRoot, config.toolkit.simulatorFolder);
      await extractZipIfNeeded(context, simulatorArchive, simulatorDirectory, config.archives.simulator);

      progress.report({ message: 'Extracting DevSuite IDE' });
      const ideDirectory = path.join(toolkitRoot, config.toolkit.ideFolder);
      const ideArchive = await findNamedEntry(contentsDirectory, config.archives.ide, 'file');
      if (ideArchive) {
        await extractZipIfNeeded(context, ideArchive, ideDirectory, config.archives.ide);
        progress.report({ message: 'Installing official Macle extension' });
        officialExtensionInstalled = await installOfficialIdeExtension(context, toolkitRoot, ideDirectory);
      } else {
        outputChannel.appendLine(
          `IDE archive ${config.archives.ide} not found in the toolkit contents — skipping official extension install.`
        );
      }

      progress.report({ message: 'Installing platform simulator for Macle Tools' });
      const simulatorInstalled = await installPlatformSimulator(context, toolkitRoot, simulatorDirectory);
      return { toolkitRoot, simulatorInstalled, officialExtensionInstalled };
    }
  );
}

function ensureToolkitInstalled(
  context: vscode.ExtensionContext
): Promise<{ toolkitRoot: string; simulatorInstalled: boolean }> {
  if (!toolkitInstallPromise) {
    toolkitInstallPromise = prepareToolkit(context).catch((error) => {
      toolkitInstallPromise = undefined;
      throw error;
    });
  }
  return toolkitInstallPromise;
}

async function offerToolkitRecovery(context: vscode.ExtensionContext, error: unknown): Promise<void> {
  const message = String(error);
  outputChannel.appendLine(`Toolkit setup failed: ${message}`);
  const corrupted =
    message.includes('not a valid ZIP') ||
    message.includes('corrupted') ||
    message.includes('is missing or empty');
  if (!corrupted) return;

  const choice = await vscode.window.showErrorMessage(
    'The cached Macle DevToolkit appears to be corrupted (possibly an interrupted download). Delete it and download again?',
    'Delete and Re-download',
    'Cancel'
  );
  if (choice !== 'Delete and Re-download') return;

  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;
  const toolkitRoot = path.join(storagePath, config.toolkit.storageFolder, config.toolkit.version);
  await fs.promises.rm(toolkitRoot, { recursive: true, force: true });
  await fs.promises.rm(path.join(storagePath, config.download.fileName), { force: true });
  outputChannel.appendLine('Deleted corrupted toolkit cache. Re-downloading...');
  await ensureToolkitInstalled(context);
}

function projectRoot(): string | undefined {
  const activeDocument = vscode.window.activeTextEditor?.document.uri;
  const folder =
    (activeDocument ? vscode.workspace.getWorkspaceFolder(activeDocument) : undefined) ??
    vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

async function outputSignature(outputDir: string): Promise<string> {
  const files: string[] = [];
  const pending = [outputDir];
  while (pending.length > 0) {
    const current = pending.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.promises.stat(fullPath);
          files.push(`${path.relative(outputDir, fullPath)}:${stats.size}:${stats.mtimeMs}`);
        } catch {
          // A build may replace files while this snapshot is being collected.
        }
      }
    }
  }
  return files.sort().join('\n');
}

async function waitForOutputChange(
  outputDir: string,
  before: string,
  child: ChildProcess,
  didFailToSpawn: () => boolean,
  timeoutMs = 300_000
): Promise<boolean> {
  const started = Date.now();
  let lastSignature = '';
  let stableSince = 0;

  while (Date.now() - started < timeoutMs) {
    if (didFailToSpawn() || child.signalCode !== null) return false;
    if (child.exitCode !== null && child.exitCode !== 0) return false;
    const current = await outputSignature(outputDir);
    if (current && current !== before) {
      if (current === lastSignature) {
        if (Date.now() - stableSince >= 2_000) return true;
      } else {
        lastSignature = current;
        stableSince = Date.now();
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function openDesktopSimulator(
  outputDir: string,
  context: vscode.ExtensionContext
): Promise<boolean> {
  const platform = process.platform;
  const config = loadToolkitConfig(context);
  const openIn = vscode.workspace.getConfiguration('macle').get<string>('simulator.openIn', 'vscode');
  const preferredRoot = projectRoot() || outputDir;

  // 1. Direct launch / VS Code embedded server mode from toolkit
  const toolkit = await ensureToolkitInstalled(context);
  if (toolkit.simulatorInstalled) {
    const storagePath = context.globalStorageUri.fsPath;
    const toolkitRoot = path.join(storagePath, config.toolkit.storageFolder, config.toolkit.version);

    if (platform === 'darwin') {
      const appPath = path.join(
        toolkitRoot,
        'simulator',
        config.platforms.darwin.simulatorDirectory,
        config.platforms.darwin.appName
      );
      const binPath = path.join(appPath, ...config.platforms.darwin.executableRelativePath);
      if (openIn === 'vscode' && fs.existsSync(binPath)) {
        try {
          await spawnOfficialSimulatorServer(binPath, path.dirname(binPath), outputDir, preferredRoot, context);
          return true;
        } catch (err) {
          outputChannel.appendLine(`macOS embedded simulator server failed: ${String(err)}`);
        }
      }
      if (fs.existsSync(appPath)) {
        outputChannel.appendLine(`Launching macOS Desktop Simulator: ${appPath}`);
        spawn('open', ['-a', appPath, '--args', '-s', outputDir], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        void vscode.window.showInformationMessage(`Launched Macle Desktop Simulator (${path.basename(appPath)})`);
        return true;
      }
    } else if (platform === 'win32') {
      const exePath = path.join(
        toolkitRoot,
        'simulator',
        config.platforms.win32.simulatorDirectory,
        config.platforms.win32.executableName
      );
      if (openIn === 'vscode' && fs.existsSync(exePath)) {
        try {
          await spawnOfficialSimulatorServer(exePath, path.dirname(exePath), outputDir, preferredRoot, context);
          return true;
        } catch (err) {
          outputChannel.appendLine(`Windows embedded simulator server failed: ${String(err)}`);
        }
      }
      if (fs.existsSync(exePath)) {
        outputChannel.appendLine(`Launching Windows Desktop Simulator: ${exePath}`);
        spawn(exePath, ['-s', outputDir], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        void vscode.window.showInformationMessage(`Launched Macle Desktop Simulator (${path.basename(exePath)})`);
        return true;
      }
    }
  }

  // 2. Fallback: invoke official extension command
  const officialExtension = vscode.extensions.getExtension(config.officialExtension.id);
  if (officialExtension) {
    try {
      if (!officialExtension.isActive) {
        await officialExtension.activate();
      }
      const command =
        openIn === 'vscode'
          ? 'MiniProgram.commands.tools.simulator'
          : config.officialExtension.simulatorCommand;
      await vscode.commands.executeCommand(command);
      outputChannel.appendLine(`Invoked official Macle extension simulator command (${command}).`);
      void vscode.window.showInformationMessage(
        `Macle DevTools simulator opened for ${outputDir}`
      );
      return true;
    } catch (err) {
      outputChannel.appendLine(`Official extension simulator command could not be invoked: ${String(err)}`);
    }
  }

  return false;
}

async function openMacleSimulator(
  outputDir: string,
  context: vscode.ExtensionContext
): Promise<void> {
  const platform = process.platform;
  const simType = vscode.workspace.getConfiguration('macle').get<string>('simulator.type', 'platform');
  outputChannel.appendLine(`[Simulator] Opening simulator (mode: ${simType}, platform: ${platform})...`);

  // If user explicitly configured simulator.type to 'web', open web simulator directly
  if (simType === 'web') {
    outputChannel.appendLine(`Launching Web Simulator (configured preference)...`);
    await openWebSimulator(outputDir, context);
    return;
  }

  // 1. Linux Platform Simulator
  if (platform === 'linux') {
    try {
      outputChannel.appendLine(`Launching Macle Linux Simulator (platform priority)...`);
      await openLinuxSimulator(outputDir, context);
      return;
    } catch (linuxError) {
      outputChannel.appendLine(`Linux platform simulator failed: ${String(linuxError)}. Falling back to Web Simulator...`);
      await openWebSimulator(outputDir, context);
      return;
    }
  }

  // 2. macOS and Windows Desktop Platform Simulator
  if (platform === 'darwin' || platform === 'win32') {
    try {
      outputChannel.appendLine(`Launching desktop platform simulator for ${platform}...`);
      const launched = await openDesktopSimulator(outputDir, context);
      if (launched) {
        return;
      }
      outputChannel.appendLine(`Desktop platform simulator executable not found. Falling back to Web Simulator...`);
    } catch (desktopError) {
      outputChannel.appendLine(`Desktop platform simulator error: ${String(desktopError)}. Falling back to Web Simulator...`);
    }
  }

  // 3. Fallback to Web Simulator
  outputChannel.appendLine(`Launching Web Simulator (fallback)...`);
  await openWebSimulator(outputDir, context);
}

async function selectUniAppProject(): Promise<{ root: string; cli: NonNullable<ReturnType<typeof resolveUniCli>> } | undefined> {
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select uni-app project',
    title: 'Select a uni-app application folder',
  });
  const root = selected?.[0]?.fsPath;
  if (!root) return undefined;
  const cli = resolveUniCli(root);
  if (!cli) {
    void vscode.window.showErrorMessage(
      `No uni CLI was found in "${root}". Install the app dependencies (npm install) and ensure @dcloudio/vite-plugin-uni is listed in the uni-app project's dependencies.`
    );
    return undefined;
  }
  return { root, cli };
}

async function runMacleCompilerOnce(
  sourceDir: string,
  debugApp: string,
  context: vscode.ExtensionContext
): Promise<boolean> {
  const compiler = resolveMacleCompiler(context);
  if (!compiler) {
    void vscode.window.showErrorMessage(
      'Could not find macle-compiler. Ensure macle-compiler is installed or configure macle.compiler.path in settings.'
    );
    return false;
  }

  fs.mkdirSync(debugApp, { recursive: true });
  const args = [...compiler.argsPrefix, '-s', sourceDir, '-t', debugApp, '-d'];
  outputChannel.appendLine(`Compiling Macle bundle: ${compiler.command} ${args.join(' ')}`);

  return await new Promise<boolean>((resolve) => {
    const child = spawn(compiler.command, args, {
      cwd: sourceDir,
      shell: process.platform === 'win32',
    });
    child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.on('error', (error) => {
      outputChannel.appendLine(`Could not start macle-compiler: ${error.message}`);
      resolve(false);
    });
    child.on('exit', (code) => {
      outputChannel.appendLine(`macle-compiler exited with code ${code ?? 0}`);
      resolve(code === 0);
    });
  });
}

function startCompiledOutputWatcher(
  root: string,
  sourceDir: string,
  context: vscode.ExtensionContext,
  openOnFirstBuild = true
): void {
  if (pureMacleWatcher) {
    pureMacleWatcher.dispose();
    pureMacleWatcher = undefined;
  }
  if (pureMacleRebuildTimer) {
    clearTimeout(pureMacleRebuildTimer);
    pureMacleRebuildTimer = undefined;
  }

  autoConfigureMauiIfNeeded(root, context);

  const { compileRoot, compileApp } = getMacleTargetPaths(root);
  let simulatorOpened = !openOnFirstBuild;

  const triggerCompile = async () => {
    if (!fs.existsSync(path.join(sourceDir, 'app.json'))) return;
    if (isPureMacleRebuilding) {
      pendingPureMacleRebuild = true;
      return;
    }
    isPureMacleRebuilding = true;
    updateStatusBarWatchState(true, true);
    try {
      const ok = await runMacleCompilerOnce(sourceDir, compileApp, context);
      if (ok) {
        if (!simulatorOpened) {
          simulatorOpened = true;
          await openMacleSimulator(compileRoot, context);
        } else {
          notifySimulatorReload();
        }
      }
    } finally {
      isPureMacleRebuilding = false;
      updateStatusBarWatchState(true, false);
      if (pendingPureMacleRebuild) {
        pendingPureMacleRebuild = false;
        void triggerCompile();
      }
    }
  };

  const scheduleCompile = (uri: vscode.Uri) => {
    const rel = path.relative(sourceDir, uri.fsPath);
    if (!rel || rel.startsWith('macle-report') || rel.startsWith('..')) return;
    if (pureMacleRebuildTimer) clearTimeout(pureMacleRebuildTimer);
    pureMacleRebuildTimer = setTimeout(() => {
      pureMacleRebuildTimer = undefined;
      void triggerCompile();
    }, 500);
  };

  fs.mkdirSync(sourceDir, { recursive: true });
  const pattern = new vscode.RelativePattern(sourceDir, '**/*');
  pureMacleWatcher = vscode.workspace.createFileSystemWatcher(pattern);
  pureMacleWatcher.onDidChange(scheduleCompile);
  pureMacleWatcher.onDidCreate(scheduleCompile);
  pureMacleWatcher.onDidDelete(scheduleCompile);
  updateStatusBarWatchState(true, false);

  if (openOnFirstBuild && fs.existsSync(path.join(sourceDir, 'app.json'))) {
    void triggerCompile();
  }
}

async function compilePureMacle(
  root: string,
  preview: boolean,
  context: vscode.ExtensionContext,
  isWatchRebuild = false
): Promise<void> {
  const compiler = resolveMacleCompiler(context);
  if (!compiler) {
    void vscode.window.showErrorMessage(
      'Could not find macle-compiler. Ensure macle-compiler is installed or configure macle.compiler.path in settings.'
    );
    return;
  }

  autoConfigureMauiIfNeeded(root, context);

  const { compileRoot, compileApp } = getMacleTargetPaths(root);
  fs.mkdirSync(compileApp, { recursive: true });

  const args = [...compiler.argsPrefix, '-s', root, '-t', compileApp, '-d'];
  if (!isWatchRebuild) {
    outputChannel.show(true);
  }
  outputChannel.appendLine(`Starting Macle Compiler (Debug) in ${root}`);
  outputChannel.appendLine(`Command: ${compiler.command} ${args.join(' ')}`);
  outputChannel.appendLine(`Target: ${compileApp}`);

  const child = spawn(compiler.command, args, {
    cwd: root,
    shell: process.platform === 'win32',
  });
  buildProcess = child;

  child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
  child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
  child.on('error', (error) => {
    if (buildProcess === child) buildProcess = undefined;
    outputChannel.appendLine(`Could not start macle-compiler: ${error.message}`);
    if (!isWatchRebuild) {
      void vscode.window.showErrorMessage(`Could not start macle-compiler: ${error.message}`);
    }
  });

  return new Promise<void>((resolve) => {
    child.on('exit', async (code) => {
      if (buildProcess === child) buildProcess = undefined;
      outputChannel.appendLine(`macle-compiler exited with code ${code ?? 0}`);
      if (code === 0) {
        if (isWatchRebuild) {
          outputChannel.appendLine(`Pure Macle auto-recompiled successfully to ${compileApp}`);
        } else if (preview) {
          outputChannel.appendLine(`Pure Macle compilation succeeded. Launching simulator for ${compileRoot}...`);
          void vscode.window.showInformationMessage(`Pure Macle compiled successfully. Opening in simulator...`);
          await openMacleSimulator(compileRoot, context);
          startPureMacleWatcher(root, context);
        } else {
          const choice = await vscode.window.showInformationMessage(
            `Pure Macle compiled successfully to ${compileApp}`,
            'Open in Simulator'
          );
          if (choice === 'Open in Simulator') {
            await openMacleSimulator(compileRoot, context);
            startPureMacleWatcher(root, context);
          }
        }
      } else {
        outputChannel.appendLine(`Pure Macle compilation failed (exit code ${code}). Check Macle output channel.`);
        if (!isWatchRebuild) {
          void vscode.window.showErrorMessage(
            `Pure Macle compilation failed (exit code ${code}). Check Macle output channel.`
          );
        }
      }
      resolve();
    });
  });
}

async function compileReleaseBuild(context: vscode.ExtensionContext): Promise<void> {
  const preferredRoot = projectRoot();
  if (!preferredRoot) {
    void vscode.window.showErrorMessage('Open a project folder before compiling for Macle.');
    return;
  }
  if (buildProcess && buildProcess.exitCode === null) {
    void vscode.window.showInformationMessage('A Macle build is already running.');
    return;
  }

  const framework = detectProjectFramework(preferredRoot);
  if (framework === 'pure-macle') {
    const compiler = resolveMacleCompiler(context);
    if (!compiler) {
      void vscode.window.showErrorMessage(
        'Could not find macle-compiler. Ensure macle-compiler is installed or configure macle.compiler.path in settings.'
      );
      return;
    }
    const { releaseApp } = getMacleTargetPaths(preferredRoot);
    fs.mkdirSync(releaseApp, { recursive: true });

    const args = [...compiler.argsPrefix, '-s', preferredRoot, '-t', releaseApp];
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Macle Compiler (Release) in ${preferredRoot}`);
    outputChannel.appendLine(`Command: ${compiler.command} ${args.join(' ')}`);
    outputChannel.appendLine(`Target: ${releaseApp}`);

    const child = spawn(compiler.command, args, {
      cwd: preferredRoot,
      shell: process.platform === 'win32',
    });
    buildProcess = child;
    child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.on('error', (error) => {
      if (buildProcess === child) buildProcess = undefined;
      outputChannel.appendLine(`Could not start macle-compiler: ${error.message}`);
      void vscode.window.showErrorMessage(`Could not start macle-compiler: ${error.message}`);
    });
    child.on('exit', (code) => {
      if (buildProcess === child) buildProcess = undefined;
      outputChannel.appendLine(`macle-compiler exited with code ${code ?? 0}`);
      if (code === 0) {
        void vscode.window.showInformationMessage(`Pure Macle release build succeeded: ${releaseApp}`);
      } else {
        void vscode.window.showErrorMessage(
          `Pure Macle release build failed (exit code ${code}). Check Macle output channel.`
        );
      }
    });
  } else {
    const cli = resolveUniCli(preferredRoot);
    if (!cli) {
      void vscode.window.showErrorMessage(`No uni CLI found in "${preferredRoot}".`);
      return;
    }
    const outputDir = path.resolve(preferredRoot, 'dist/build/mp-macle');
    const env = {
      ...process.env,
      UNI_PLATFORM: 'mp-weixin',
      UNI_CUSTOM_PLATFORM: 'mp-macle',
      UNI_OUTPUT_DIR: outputDir,
      NODE_ENV: 'production',
    };
    outputChannel.show(true);
    outputChannel.appendLine(`Starting release build in ${preferredRoot}`);
    const child = spawn(cli.command, [...cli.argsPrefix, 'build', '-p', 'mp-weixin'], {
      cwd: preferredRoot,
      env,
      shell: cli.shell,
    });
    buildProcess = child;
    child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.on('exit', (code) => {
      if (buildProcess === child) buildProcess = undefined;
      outputChannel.appendLine(`uni CLI exited with code ${code ?? 0}`);
      if (code === 0) {
        void vscode.window.showInformationMessage(`Build succeeded: ${outputDir}`);
      } else {
        void vscode.window.showErrorMessage(`Build failed (exit code ${code}).`);
      }
    });
  }
}

async function startBuild(
  preview: boolean,
  context: vscode.ExtensionContext
): Promise<void> {
  const preferredRoot = projectRoot();
  if (!preferredRoot) {
    void vscode.window.showErrorMessage('Open a project folder before compiling for Macle.');
    return;
  }
  if (buildProcess && buildProcess.exitCode === null) {
    void vscode.window.showInformationMessage('A Macle development build is already running.');
    return;
  }

  const framework = detectProjectFramework(preferredRoot);
  if (framework === 'pure-macle') {
    await compilePureMacle(preferredRoot, preview, context);
    return;
  }

  if (framework === 'taro-react') {
    const taroOut = outputDirectory(preferredRoot);
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    outputChannel.show(true);
    outputChannel.appendLine(`Starting Taro Macle build in ${preferredRoot}`);
    outputChannel.appendLine(`Output: ${taroOut}`);

    if (preview) {
      startCompiledOutputWatcher(preferredRoot, taroOut, context, true);
    }

    const child = spawn(npmCmd, ['run', 'dev:macle'], {
      cwd: preferredRoot,
      env: { ...process.env, NODE_ENV: 'development' },
      shell: process.platform === 'win32',
    });
    buildProcess = child;
    child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
    child.on('error', (error) => {
      if (buildProcess === child) buildProcess = undefined;
      outputChannel.appendLine(`Could not start Taro build: ${error.message}`);
      void vscode.window.showErrorMessage(`Could not start Taro build: ${error.message}`);
    });
    child.on('exit', (code) => {
      outputChannel.appendLine(`Taro CLI exited with code ${code ?? 0}`);
      if (buildProcess === child) buildProcess = undefined;
    });
    return;
  }

  const workspaceRoots = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
  const savedRoot = context.workspaceState.get<string>('macle.uniAppProjectRoot');
  const candidateRoots = [
    preferredRoot,
    ...(savedRoot ? [savedRoot] : []),
    ...workspaceRoots.filter((root) => path.resolve(root) !== path.resolve(preferredRoot)),
  ];
  const uniqueRoots = [...new Set(candidateRoots.map((root) => path.resolve(root)))];
  const projectCandidates = uniqueRoots.flatMap((root) => {
    const cli = resolveUniCli(root);
    return cli ? [{ root, cli }] : [];
  });
  let project = projectCandidates.find(
    (candidate) => path.resolve(candidate.root) === path.resolve(preferredRoot)
  );
  if (!project && projectCandidates.length === 1) project = projectCandidates[0];
  if (!project && projectCandidates.length > 1) {
    const selected = await vscode.window.showQuickPick(
      projectCandidates.map((candidate) => ({
        label: path.basename(candidate.root),
        description: candidate.root,
        candidate,
      })),
      { placeHolder: 'Choose the uni-app project to build for Macle' }
    );
    project = selected?.candidate;
  }
  if (!project) {
    const expectedCommand = path.join(
      preferredRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'uni.cmd' : 'uni'
    );
    const choice = await vscode.window.showErrorMessage(
      `No uni-app CLI was found for "${preferredRoot}". Open the uni-app application folder (not the plugin repository) and install its dependencies. Expected a local CLI at "${expectedCommand}" or @dcloudio/vite-plugin-uni in the app's dependency tree.`,
      'Select uni-app Folder'
    );
    if (choice !== 'Select uni-app Folder') return;
    project = await selectUniAppProject();
    if (!project) return;
  }
  const { root, cli } = project;
  await context.workspaceState.update('macle.uniAppProjectRoot', root);
  const configPath = configureProject(root);
  if (!configPath) return;
  autoConfigureMauiIfNeeded(root, context);

  const mode = 'dev';
  const outputDir = path.resolve(root, `dist/${mode}/mp-macle`);
  const before = await outputSignature(outputDir);
  const env = {
    ...process.env,
    UNI_PLATFORM: 'mp-weixin',
    UNI_CUSTOM_PLATFORM: 'mp-macle',
    UNI_OUTPUT_DIR: outputDir,
    UNI_MACLE_SOURCE_MAPS: 'true',
    NODE_ENV: 'development',
  };
  const args = ['-p', 'mp-weixin'];
  outputChannel.show(true);
  outputChannel.appendLine(`Starting Macle build in ${root}`);
  outputChannel.appendLine(`Output: ${outputDir}`);
  const child = spawn(cli.command, [...cli.argsPrefix, ...args], {
    cwd: root,
    env,
    shell: cli.shell,
  });
  buildProcess = child;
  let spawnFailed = false;
  child.stdout?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
  child.stderr?.on('data', (data: Buffer) => outputChannel.append(data.toString()));
  child.on('error', (error) => {
    spawnFailed = true;
    if (buildProcess === child) buildProcess = undefined;
    outputChannel.appendLine(`Could not start uni CLI: ${error.message}`);
    void vscode.window.showErrorMessage(`Could not start the uni CLI: ${error.message}`);
  });
  child.on('exit', (code) => {
    outputChannel.appendLine(`uni CLI exited with code ${code ?? 0}`);
    if (buildProcess === child) buildProcess = undefined;
    if (code !== null && code !== 0) {
      void vscode.window.showErrorMessage(`Macle development build failed (exit code ${code}).`);
    }
  });

  void vscode.window.showInformationMessage('Macle development build started.');
  if (!preview) return;

  const changed = await waitForOutputChange(outputDir, before, child, () => spawnFailed);
  if (!changed) {
    void vscode.window.showErrorMessage(
      'The Macle output did not change before the build timed out or failed. Check the Macle uni-app output channel.'
    );
    return;
  }

  autoConfigureMauiIfNeeded(root, context);

  const { compileRoot, compileApp } = getMacleTargetPaths(root);
  const compiled = await runMacleCompilerOnce(outputDir, compileApp, context);
  if (!compiled) {
    void vscode.window.showErrorMessage(
      'Macle compiler failed to bundle the compiled miniapp. Check the Macle uni-app output channel.'
    );
    return;
  }
  await openMacleSimulator(compileRoot, context);
  startCompiledOutputWatcher(root, outputDir, context, false);
}

function resolveToolkitMauiDist(context: vscode.ExtensionContext): string | undefined {
  const config = loadToolkitConfig(context);
  const candidates: string[] = [];

  const configuredLocalPath = vscode.workspace
    .getConfiguration('macle.toolkit')
    .get<string>('localPath', '')
    .trim();
  const savedLocalPath = context.globalState.get<string>('macle.toolkit.localPath')?.trim();
  for (const rawBase of [configuredLocalPath, savedLocalPath]) {
    if (!rawBase) continue;
    const base = expandUserPath(rawBase);
    candidates.push(path.join(base, config.toolkit.uiFolder, 'dist'));
    candidates.push(path.join(base, 'dist'));
    try {
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory() && /devsuite_ui/i.test(entry.name)) {
          candidates.push(path.join(base, entry.name, 'dist'));
        }
      }
    } catch {
      // ignore unreadable localPath
    }
  }

  const storageToolkitRoot = path.join(
    context.globalStorageUri.fsPath,
    config.toolkit.storageFolder,
    config.toolkit.version
  );
  candidates.push(path.join(storageToolkitRoot, config.toolkit.uiFolder, 'dist'));
  candidates.push(path.join(storageToolkitRoot, config.toolkit.contentsFolder, config.toolkit.uiFolder, 'dist'));

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

function autoConfigureMauiIfNeeded(root: string, context: vscode.ExtensionContext): void {
  const toolkitDist = resolveToolkitMauiDist(context);
  if (!toolkitDist) return;

  const targetFolder = vscode.workspace
    .getConfiguration('macle.maui')
    .get<string>('targetFolder', 'maui-components');

  try {
    const plan = createMauiLibraryPlan(root, toolkitDist, targetFolder);
    if (plan.updates.length === 0) return;

    const result = installMauiLibrary(root, toolkitDist, targetFolder);
    if (result.copiedFiles > 0 || result.configuredPages > 0) {
      outputChannel.appendLine(
        `[MAUI] Auto-configured MAUI library from ${toolkitDist}: copied ${result.copiedFiles} file(s), configured ${result.configuredPages} page(s).`
      );
    }
  } catch {
    // Non-fatal during automatic pre-build check
  }
}

async function configureMauiLibrary(context: vscode.ExtensionContext): Promise<void> {
  const root = projectRoot();
  if (!root) {
    void vscode.window.showErrorMessage('Open a Macle or uni-app project folder before configuring the MAUI library.');
    return;
  }

  let libraryFolder = resolveToolkitMauiDist(context);
  if (!libraryFolder) {
    const lastLibraryFolder = context.workspaceState.get<string>('macle.maui.libraryFolder');
    const selected = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: lastLibraryFolder ? vscode.Uri.file(lastLibraryFolder) : undefined,
      openLabel: 'Select MAUI library folder',
      title: 'Select a MAUI library folder containing dist/',
    });
    if (!selected?.[0]) return;
    libraryFolder = selected[0].fsPath;
  }

  const targetFolder = vscode.workspace
    .getConfiguration('macle.maui')
    .get<string>('targetFolder', 'maui-components');

  try {
    const result = installMauiLibrary(root, libraryFolder, targetFolder);
    await context.workspaceState.update('macle.maui.libraryFolder', libraryFolder);

    const summary = [
      `Copied ${result.copiedFiles} file(s).`,
      `Configured ${result.configuredPages} page(s).`,
      result.skippedConflicts > 0
        ? `${result.skippedConflicts} existing file conflict(s) were left unchanged.`
        : '',
      result.skippedSymlinks > 0
        ? `${result.skippedSymlinks} symbolic link(s) were skipped.`
        : '',
      result.registrationConflicts.length > 0
        ? `Existing registrations were kept for: ${result.registrationConflicts.join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (
      result.missingEntries.length > 0 ||
      result.skippedConflicts > 0 ||
      result.registrationConflicts.length > 0
    ) {
      const missing =
        result.missingEntries.length > 0
          ? ` Could not register component entries: ${result.missingEntries.join(', ')}.`
          : '';
      void vscode.window.showWarningMessage(`${summary}${missing}`);
    } else {
      void vscode.window.showInformationMessage(summary);
    }
  } catch (error) {
    void vscode.window.showErrorMessage(`Could not configure the MAUI library: ${String(error)}`);
  }
}

function outputDirectory(root: string): string {
  if (detectProjectFramework(root) === 'taro-react') {
    return path.resolve(root, 'dist');
  }
  return path.resolve(root, 'dist/dev/mp-macle');
}

export function activate(context: vscode.ExtensionContext): void {
  try {
    outputChannel.appendLine('=== Macle extension activating ===');

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('macle.toolkit.configFile')) {
          resetToolkitConfigCache();
          toolkitInstallPromise = undefined;
        }
      })
    );

    outputChannel.appendLine('Registering macle.showWelcomePage command...');

    // Register the welcome page command immediately so it appears in the Command Palette.
    const showWelcome = vscode.commands.registerCommand('macle.showWelcomePage', async () => {
      outputChannel.appendLine('macle.showWelcomePage command invoked.');
      try {
        await showWelcomePage(context, async () => {
          outputChannel.appendLine('Welcome page download callback starting...');
          await ensureToolkitInstalled(context);
          outputChannel.appendLine('Welcome page download callback complete.');
        }, true);
      } catch (error) {
        outputChannel.appendLine(`Welcome page error: ${String(error)}`);
        await offerToolkitRecovery(context, error);
      }
    });
    context.subscriptions.push(showWelcome);
    outputChannel.appendLine('macle.showWelcomePage command registered.');

    // Auto-show welcome page only on first install, extension update, or missing compiler/setup issue.
    setTimeout(async () => {
      void autoSyncAvailableSimulators(context);
      const currentVersion = String(context.extension.packageJSON?.version ?? '1.0.0');
      const lastVersion = context.globalState.get<string>('macle.lastVersion');
      const alreadyShown = context.globalState.get<boolean>('macle.welcomeShown');
      const userSkipped = context.globalState.get<boolean>('macle.welcomeSkipped');
      const hasCompiler = Boolean(resolveMacleCompiler(context));
      const isFirstTime = !alreadyShown;
      const isUpdate = lastVersion !== currentVersion;
      const hasIssue = !hasCompiler && !userSkipped;

      if (!isFirstTime && !isUpdate && !hasIssue) {
        outputChannel.appendLine('Skipping welcome page auto-show (already configured and up to date).');
        return;
      }

      outputChannel.appendLine(
        `setTimeout: showing welcome page (firstTime=${isFirstTime}, update=${isUpdate}, issue=${hasIssue})...`
      );
      try {
        await context.globalState.update('macle.lastVersion', currentVersion);
        await showWelcomePage(
          context,
          async () => {
            outputChannel.appendLine('Welcome page auto-show download callback starting...');
            await ensureToolkitInstalled(context);
            outputChannel.appendLine('Welcome page auto-show download callback complete.');
          },
          true
        );
      } catch (error) {
        outputChannel.appendLine(`Welcome page auto-show error: ${String(error)}`);
        await offerToolkitRecovery(context, error);
      }
    }, 1000);

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider('macle.tools', new MacleActivityProvider())
    );

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('macle');
  const diagnosticsFor = (document: vscode.TextDocument): void =>
    updateDiagnostics(document, diagnosticCollection);
  for (const document of vscode.workspace.textDocuments) diagnosticsFor(document);

  context.subscriptions.push(
    diagnosticCollection,
    vscode.workspace.onDidOpenTextDocument(diagnosticsFor),
    vscode.workspace.onDidChangeTextDocument((event) => diagnosticsFor(event.document)),
    vscode.languages.registerCodeActionsProvider(
      [
        { language: 'vue' },
        { language: 'javascript' },
        { language: 'javascriptreact' },
        { language: 'typescript' },
        { language: 'typescriptreact' },
      ],
      codeActionProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    ),
    vscode.languages.registerCompletionItemProvider(
      { language: 'vue' },
      componentCompletionProvider(),
      '<',
      '-',
      ' '
    )
  );

  const decorations = createConditionalDecorations(context);
  const updateDecorations = (editor: vscode.TextEditor): void => decorations.update(editor);
  for (const editor of vscode.window.visibleTextEditors) updateDecorations(editor);
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
      for (const editor of editors) updateDecorations(editor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === event.document) updateDecorations(editor);
      }
    })
  );

  const compileAndPreview = vscode.commands.registerCommand('macle.compileAndPreview', () =>
    startBuild(true, context)
  );
  const buildAndRun = vscode.commands.registerCommand('macle.buildAndRun', () =>
    startBuild(true, context)
  );
  const compileDev = vscode.commands.registerCommand('macle.compileDev', () =>
    startBuild(false, context)
  );
  const compileRelease = vscode.commands.registerCommand('macle.compileRelease', () =>
    compileReleaseBuild(context)
  );
  const openReport = vscode.commands.registerCommand('macle.openCompatibilityReport', async () => {
    const root = projectRoot();
    if (!root) {
      void vscode.window.showErrorMessage('Open a uni-app project folder first.');
      return;
    }
    await openCompatibilityReport(context, root, outputDirectory(root));
  });
  const setupMaui = vscode.commands.registerCommand('macle.configureMauiLibrary', () =>
    configureMauiLibrary(context)
  );
  const createProject = vscode.commands.registerCommand('macle.createProject', () =>
    createMacleProject()
  );
  const configureProjectRunAndDebug = vscode.commands.registerCommand(
    'macle.configureRunAndDebug',
    () => configureRunAndDebug()
  );
  const openWebSimulatorCommand = vscode.commands.registerCommand('macle.openWebSimulator', async () => {
    const root = projectRoot();
    if (!root) {
      void vscode.window.showErrorMessage('Open a project folder first.');
      return;
    }
    const targetPaths = getMacleTargetPaths(root);
    const outputDir = fs.existsSync(targetPaths.debugApp)
      ? targetPaths.debugApp
      : outputDirectory(root);
    await openWebSimulator(outputDir, context);
  });
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  statusBar.text = '$(play) Macle Preview';
  statusBar.tooltip = 'Build Pure Macle or uni-app and open in Macle Simulator';
  statusBar.command = 'macle.compileAndPreview';
  statusBarItem = statusBar;
  if (vscode.workspace.workspaceFolders?.length) statusBar.show();

  const startWatcherCommand = vscode.commands.registerCommand('macle.startWatcher', () => {
    const root = projectRoot();
    if (!root) {
      void vscode.window.showErrorMessage('Open a project folder first.');
      return;
    }
    startPureMacleWatcher(root, context);
    void vscode.window.showInformationMessage(`Pure Macle file watcher active for ${root}`);
  });

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (ensureUniMaclePluginInjected(folder.uri.fsPath)) {
      outputChannel.appendLine(`Ensured Macle Vite plugin is injected in ${folder.uri.fsPath}`);
    }
  }

  const resolveH5SimulatorDebugConfig = {
    resolveDebugConfigurationWithSubstitutedVariables(
      _folder: vscode.WorkspaceFolder | undefined,
      debugConfiguration: vscode.DebugConfiguration
    ): vscode.DebugConfiguration | undefined {
      const openIn = vscode.workspace.getConfiguration('macle').get<string>('simulator.openIn', 'vscode');
      if (
        openIn === 'vscode' &&
        typeof debugConfiguration.name === 'string' &&
        debugConfiguration.name.includes('Macle') &&
        typeof debugConfiguration.url === 'string'
      ) {
        openSimulatorInsideVscode(debugConfiguration.url, context);
        // Cancel external Chrome launch so the H5 simulator stays inside VS Code's Webview panel.
        return undefined;
      }
      return debugConfiguration;
    },
  };
  const pwaChromeProvider = vscode.debug.registerDebugConfigurationProvider(
    'pwa-chrome',
    resolveH5SimulatorDebugConfig
  );
  const chromeProvider = vscode.debug.registerDebugConfigurationProvider(
    'chrome',
    resolveH5SimulatorDebugConfig
  );

  const debugSessionListener = vscode.debug.onDidStartDebugSession((session) => {
    if (!session.name.includes('Macle')) return;
    if (session.type === 'pwa-chrome') {
      const openIn = vscode.workspace.getConfiguration('macle').get<string>('simulator.openIn', 'vscode');
      const url = typeof session.configuration?.url === 'string' ? session.configuration.url : undefined;
      if (openIn === 'vscode' && url) {
        openSimulatorInsideVscode(url, context);
      }
      return;
    }
    const root = projectRoot();
    if (root) {
      ensureUniMaclePluginInjected(root);
      if (detectProjectFramework(root) === 'pure-macle') {
        startPureMacleWatcher(root, context);
      } else {
        startCompiledOutputWatcher(root, outputDirectory(root), context, true);
      }
    }
  });

  const taskListener = vscode.tasks.onDidStartTask((event) => {
    if (event.execution.task.name.includes('Macle')) {
      const root = projectRoot();
      if (root) {
        ensureUniMaclePluginInjected(root);
      }
    }
  });

  context.subscriptions.push(
    showWelcome,
    compileAndPreview,
    buildAndRun,
    compileDev,
    compileRelease,
    openWebSimulatorCommand,
    startWatcherCommand,
    pwaChromeProvider,
    chromeProvider,
    debugSessionListener,
    taskListener,
    openReport,
    setupMaui,
    createProject,
    configureProjectRunAndDebug,
    statusBar,
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      if (vscode.workspace.workspaceFolders?.length) statusBar.show();
      else statusBar.hide();
      for (const added of event.added) {
        ensureUniMaclePluginInjected(added.uri.fsPath);
      }
    })
  );
  } catch (error) {
    outputChannel.appendLine(`Macle extension activation failed: ${String(error)}`);
    void vscode.window.showErrorMessage(`Macle extension activation failed: ${String(error)}`);
  }
}

export function deactivate(): void {
  if (pureMacleWatcher) {
    pureMacleWatcher.dispose();
    pureMacleWatcher = undefined;
  }
  if (pureMacleRebuildTimer) {
    clearTimeout(pureMacleRebuildTimer);
    pureMacleRebuildTimer = undefined;
  }
  if (simulatorWebviewPanel) {
    simulatorWebviewPanel.dispose();
    simulatorWebviewPanel = undefined;
  }
  if (buildProcess && buildProcess.exitCode === null) buildProcess.kill();
  if (webSimulatorProcess && webSimulatorProcess.exitCode === null) webSimulatorProcess.kill();
  outputChannel.dispose();
}
