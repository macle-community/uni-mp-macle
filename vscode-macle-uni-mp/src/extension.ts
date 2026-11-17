import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as vscode from 'vscode';
import { codeActionProvider, updateDiagnostics } from './diagnostics';
import { componentCompletionProvider } from './completions';
import { createConditionalDecorations } from './decorations';
import { openCompatibilityReport } from './report';
import { createMauiLibraryPlan, installMauiLibrary } from './maui-library';

const officialToolsExtensionId = 'MacleTeam.macle-miniprogram-tools';
const officialSimulatorCommand = 'MiniProgram.commands.tools.simulator.openInStandAlone';
const outputChannel = vscode.window.createOutputChannel('Macle uni-app');

let buildProcess: ChildProcess | undefined;

function projectRoot(): string | undefined {
  const activeDocument = vscode.window.activeTextEditor?.document.uri;
  const folder =
    (activeDocument ? vscode.workspace.getWorkspaceFolder(activeDocument) : undefined) ??
    vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}

function pluginConfigPath(root: string): string | undefined {
  for (const name of [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cts',
    'vite.config.cjs',
  ]) {
    const configPath = path.join(root, name);
    if (fs.existsSync(configPath)) return configPath;
  }
  return undefined;
}

function addPluginToConfig(
  config: string,
  pluginImport: string,
  commonJs: boolean
): string | undefined {
  const imported = commonJs
    ? config.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\((['"])@macle\/uni-mp\2\)/)
    : config.match(/import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])@macle\/uni-mp\2/);
  const bundledImport = commonJs
    ? config.match(
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\((['"])[^'"]*macle-uni-mp\.cjs\2\)/
      )
    : config.match(
        /import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])[^'"]*macle-uni-mp\.cjs\2/
      );
  let next = config;
  let pluginName = 'macleUniPlugin';

  if (imported) {
    pluginName = imported[1];
    next = next.replace(imported[0], imported[0].replace('@macle/uni-mp', pluginImport));
  } else if (bundledImport) {
    pluginName = bundledImport[1];
  } else {
    const importStatement = commonJs
      ? `const ${pluginName} = require(${JSON.stringify(pluginImport)});`
      : `import ${pluginName} from ${JSON.stringify(pluginImport)};`;
    next = `${importStatement}\n${next}`;
  }

  const call = `${pluginName}({ sourceMaps: true, isAutoOpenReport: false })`;
  if (new RegExp(`\\b${pluginName}\\s*\\(`).test(next)) return next;

  const pluginsProperty = /plugins\s*:\s*\[/;
  if (pluginsProperty.test(next)) {
    return next.replace(pluginsProperty, (match) => `${match}\n      ${call},`);
  }

  const configObject =
    /(defineConfig\s*\(\s*\{|export\s+default\s*\{|module\.exports\s*=\s*\{|exports\.default\s*=\s*\{)/;
  if (configObject.test(next)) {
    return next.replace(configObject, (match) => `${match}\n  plugins: [${call}],`);
  }
  return undefined;
}

function configureProject(root: string): string | undefined {
  const corePath = path.join(__dirname, 'macle-uni-mp.cjs');
  if (!fs.existsSync(corePath)) {
    void vscode.window.showErrorMessage(
      'The bundled Macle compiler is missing. Rebuild the VS Code extension package.'
    );
    return undefined;
  }
  try {
    const projectCorePath = path.join(root, 'node_modules', '.cache', 'macle-uni-mp.cjs');
    fs.mkdirSync(path.dirname(projectCorePath), { recursive: true });
    fs.copyFileSync(corePath, projectCorePath);
    const pluginImport = './node_modules/.cache/macle-uni-mp.cjs';
    const configPath = pluginConfigPath(root);

    if (!configPath) {
      const newConfigPath = path.join(root, 'vite.config.mjs');
      const source = `import { defineConfig } from 'vite';\nimport macleUniPlugin from ${JSON.stringify(pluginImport)};\n\nexport default defineConfig({\n  plugins: [macleUniPlugin({ sourceMaps: true, isAutoOpenReport: false })],\n});\n`;
      fs.writeFileSync(newConfigPath, source, 'utf8');
      return newConfigPath;
    }

    const original = fs.readFileSync(configPath, 'utf8');
    const commonJs = /\.(?:cjs|cts)$/.test(configPath);
    const updated = addPluginToConfig(original, pluginImport, commonJs);
    if (!updated) {
      void vscode.window.showErrorMessage(
        `Could not safely add the Macle plugin to ${path.basename(configPath)}. Add the bundled plugin to the Vite plugins array manually.`
      );
      return undefined;
    }
    if (updated !== original) fs.writeFileSync(configPath, updated, 'utf8');
    return configPath;
  } catch (error) {
    void vscode.window.showErrorMessage(`Could not prepare the Macle compiler: ${String(error)}`);
    return undefined;
  }
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

async function openMacleSimulator(outputDir: string): Promise<void> {
  const extension = vscode.extensions.getExtension(officialToolsExtensionId);
  if (!extension) {
    const choice = await vscode.window.showInformationMessage(
      `Build complete at ${outputDir}. Install Macle MiniProgram Tools to open the simulator.`,
      'Install Extension'
    );
    if (choice === 'Install Extension') {
      await vscode.env.openExternal(
        vscode.Uri.parse(
          `https://marketplace.visualstudio.com/items?itemName=${officialToolsExtensionId}`
        )
      );
    }
    return;
  }

  try {
    await extension.activate();
    await vscode.commands.executeCommand(officialSimulatorCommand);
    void vscode.window.showInformationMessage(
      `Macle DevTools simulator command invoked. Build output: ${outputDir}`
    );
  } catch (error) {
    void vscode.window.showWarningMessage(
      `Build succeeded, but Macle DevTools could not be opened: ${String(error)}`
    );
  }
}

async function startBuild(preview: boolean): Promise<void> {
  const root = projectRoot();
  if (!root) {
    void vscode.window.showErrorMessage('Open a uni-app project folder before compiling for Macle.');
    return;
  }
  if (buildProcess && buildProcess.exitCode === null) {
    void vscode.window.showInformationMessage('A Macle development build is already running.');
    return;
  }

  const cli = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'uni.cmd' : 'uni');
  if (!fs.existsSync(cli)) {
    void vscode.window.showErrorMessage(
      'The local uni CLI was not found. Install the project dependencies before building.'
    );
    return;
  }
  const configPath = configureProject(root);
  if (!configPath) return;

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
  const child = spawn(cli, args, { cwd: root, env, shell: process.platform === 'win32' });
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
  await openMacleSimulator(outputDir);
}

async function configureMauiLibrary(context: vscode.ExtensionContext): Promise<void> {
  const root = projectRoot();
  if (!root) {
    void vscode.window.showErrorMessage('Open a uni-app project folder before configuring the MAUI library.');
    return;
  }

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

  const targetFolder = vscode.workspace
    .getConfiguration('macle.maui')
    .get<string>('targetFolder', 'maui-components');

  try {
    const plan = createMauiLibraryPlan(root, selected[0].fsPath, targetFolder);
    const pageDescription =
      plan.updates.length === 1 ? '1 page' : `${plan.updates.length} pages`;
    const confirmation = await vscode.window.showWarningMessage(
      `Copy MAUI dist files into ${path.relative(root, plan.outputDirectory) || '.'} and add component registrations to ${pageDescription} in ${path.relative(root, plan.pagesJsonPath)}? Existing files and registrations will be preserved.`,
      { modal: true },
      'Copy and Configure'
    );
    if (confirmation !== 'Copy and Configure') return;

    const result = installMauiLibrary(root, selected[0].fsPath, targetFolder);
    await context.workspaceState.update('macle.maui.libraryFolder', selected[0].fsPath);

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
  return path.resolve(root, 'dist/dev/mp-macle');
}

export function activate(context: vscode.ExtensionContext): void {
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
    startBuild(true)
  );
  const compileDev = vscode.commands.registerCommand('macle.compileDev', () => startBuild(false));
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
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  statusBar.text = '$(play) Macle Preview';
  statusBar.tooltip = 'Compile uni-app and open the Macle simulator';
  statusBar.command = 'macle.compileAndPreview';
  if (vscode.workspace.workspaceFolders?.length) statusBar.show();
  context.subscriptions.push(
    compileAndPreview,
    compileDev,
    openReport,
    setupMaui,
    statusBar,
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (vscode.workspace.workspaceFolders?.length) statusBar.show();
      else statusBar.hide();
    })
  );
}

export function deactivate(): void {
  if (buildProcess && buildProcess.exitCode === null) buildProcess.kill();
  outputChannel.dispose();
}
