import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as vscode from 'vscode';
import { codeActionProvider, updateDiagnostics } from './diagnostics';
import { componentCompletionProvider } from './completions';
import { createConditionalDecorations } from './decorations';
import { openCompatibilityReport } from './report';
import { createMauiLibraryPlan, installMauiLibrary } from './maui-library';
import { MacleActivityProvider } from './activity';
import { resolveUniCli } from './uni-cli';

const outputChannel = vscode.window.createOutputChannel('Macle uni-app');

let buildProcess: ChildProcess | undefined;
let toolkitInstallPromise: Promise<{ toolkitRoot: string; simulatorInstalled: boolean }> | undefined;

interface ZipExtractor {
  zip: {
    uncompress(source: string, destination: string): Promise<void>;
  };
}

interface ToolkitConfig {
  download: { url: string; fileName: string; timeoutMs: number; redirectLimit: number };
  toolkit: {
    version: string;
    storageFolder: string;
    contentsFolder: string;
    uiFolder: string;
    compilerFolder: string;
    simulatorFolder: string;
  };
  archives: {
    ui: string;
    compiler: string;
    simulator: string;
    platformPrefix: string;
    platformSuffix: string;
  };
  officialExtension: {
    id: string;
    simulatorCommand: string;
    relativeSimulatorDirectory: string[];
    zipExtractorModule: string;
  };
  platforms: {
    darwin: {
      archiveLabel: string;
      simulatorDirectory: string;
      appName: string;
      executableRelativePath: string[];
    };
    win32: {
      archiveLabel: string;
      simulatorDirectory: string;
      executableName: string;
    };
  };
}

let toolkitConfig: ToolkitConfig | undefined;

function toolkitConfigPath(context: vscode.ExtensionContext): string {
  const override = vscode.workspace
    .getConfiguration('macle.toolkit')
    .get<string>('configFile', '')
    .trim();
  if (override) {
    return path.isAbsolute(override)
      ? override
      : path.resolve(context.extensionPath, override);
  }
  return path.join(context.extensionPath, 'media', 'toolkit-config.json');
}

function loadToolkitConfig(context: vscode.ExtensionContext): ToolkitConfig {
  if (toolkitConfig) return toolkitConfig;
  const configPath = toolkitConfigPath(context);
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as ToolkitConfig;
  toolkitConfig = parsed;
  return parsed;
}

function downloadToolkitFile(
  url: URL,
  destination: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  state: { received: number; reportedPercent: number },
  redirects = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const config = toolkitConfig;
    if (!config) {
      reject(new Error('The toolkit configuration was not loaded.'));
      return;
    }
    if (redirects > config.download.redirectLimit) {
      reject(new Error('The toolkit download exceeded the redirect limit.'));
      return;
    }

    const request = https.get(url, (response) => {
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
        void downloadToolkitFile(redirectUrl, destination, progress, state, redirects + 1).then(
          resolve,
          reject
        );
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`The toolkit server returned HTTP ${status}.`));
        return;
      }

      const total = Number(response.headers['content-length']);
      const output = fs.createWriteStream(destination);
      response.on('data', (chunk: Buffer) => {
        state.received += chunk.length;
        const receivedMb = (state.received / (1024 * 1024)).toFixed(1);
        if (Number.isFinite(total) && total > 0) {
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
      response.on('aborted', () => reject(new Error('The toolkit download was interrupted.')));
      output.on('error', reject);
      output.on('finish', () => {
        output.close((error) => (error ? reject(error) : resolve()));
      });
      response.pipe(output);
    });
    request.setTimeout(
      config.download.timeoutMs,
      () => request.destroy(new Error('The toolkit download timed out.'))
    );
    request.on('error', reject);
  });
}

function getZipExtractor(context: vscode.ExtensionContext): ZipExtractor {
  const config = loadToolkitConfig(context);
  const extension = vscode.extensions.getExtension(config.officialExtension.id);
  if (!extension) throw new Error('The required Macle MiniProgram Tools extension is not installed.');
  const extensionRequire = createRequire(path.join(extension.extensionPath, 'package.json'));
  return extensionRequire(config.officialExtension.zipExtractorModule) as ZipExtractor;
}

async function extractZip(
  context: vscode.ExtensionContext,
  source: string,
  destination: string
): Promise<void> {
  await fs.promises.mkdir(destination, { recursive: true });
  await getZipExtractor(context).zip.uncompress(source, destination);
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

async function installPlatformSimulator(
  context: vscode.ExtensionContext,
  toolkitRoot: string,
  simulatorDirectory: string
): Promise<boolean> {
  const config = loadToolkitConfig(context);
  const extension = vscode.extensions.getExtension(config.officialExtension.id);
  if (!extension) throw new Error('The required Macle MiniProgram Tools extension is not installed.');

  const platform = process.platform;
  if (platform !== 'darwin' && platform !== 'win32') {
    outputChannel.appendLine(`No Macle simulator package is available for ${platform}.`);
    return false;
  }

  const platformConfig = platform === 'darwin'
    ? config.platforms.darwin
    : config.platforms.win32;
  const platformArchiveName = `${config.archives.platformPrefix}_${platformConfig.archiveLabel}${config.archives.platformSuffix}`;
  const platformArchive = await findNamedEntry(simulatorDirectory, platformArchiveName, 'file');
  if (!platformArchive) throw new Error(`The simulator package is missing ${platformArchiveName}.`);

  const officialSimulatorDirectory = path.join(
    extension.extensionPath,
    ...config.officialExtension.relativeSimulatorDirectory,
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
  } else {
    await fs.promises.rm(expectedExecutable, { force: true });
    await fs.promises.copyFile(simulatorSource, expectedExecutable);
  }
  await fs.promises.writeFile(installMarker, platformArchiveName);
  return true;
}

async function prepareToolkit(
  context: vscode.ExtensionContext
): Promise<{ toolkitRoot: string; simulatorInstalled: boolean }> {
  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;
  const toolkitRoot = path.join(storagePath, config.toolkit.storageFolder, config.toolkit.version);
  const archivePath = path.join(storagePath, config.download.fileName);
  await fs.promises.mkdir(toolkitRoot, { recursive: true });
  let archiveIsPresent = false;
  try {
    archiveIsPresent = (await fs.promises.stat(archivePath)).size > 0;
  } catch {
    // Download the toolkit if it is not already cached.
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Setting up Macle DevToolkit',
      cancellable: false,
    },
    async (progress) => {
      if (!archiveIsPresent) {
        const temporaryArchive = `${archivePath}.download`;
        await fs.promises.rm(temporaryArchive, { force: true });
        progress.report({ message: 'Downloading toolkit' });
        try {
          await downloadToolkitFile(new URL(config.download.url), temporaryArchive, progress, {
            received: 0,
            reportedPercent: 0,
          });
          await fs.promises.rename(temporaryArchive, archivePath);
          outputChannel.appendLine(`Downloaded Macle DevToolkit to ${archivePath}`);
        } catch (error) {
          await fs.promises.rm(temporaryArchive, { force: true });
          throw error;
        }
      }

      const contentsDirectory = path.join(toolkitRoot, config.toolkit.contentsFolder);
      progress.report({ message: 'Extracting toolkit archive' });
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
      progress.report({ message: 'Installing platform simulator for Macle Tools' });
      const simulatorInstalled = await installPlatformSimulator(context, toolkitRoot, simulatorDirectory);
      return { toolkitRoot, simulatorInstalled };
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

async function openMacleSimulator(
  outputDir: string,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const toolkit = await ensureToolkitInstalled(context);
    if (!toolkit.simulatorInstalled) {
      void vscode.window.showInformationMessage(
        `Build complete at ${outputDir}. The toolkit is extracted, but Macle does not provide a simulator package for ${process.platform}.`
      );
      return;
    }
    const config = loadToolkitConfig(context);
    const extension = vscode.extensions.getExtension(config.officialExtension.id);
    if (!extension) throw new Error('Macle MiniProgram Tools is not installed.');
    await extension.activate();
    await vscode.commands.executeCommand(config.officialExtension.simulatorCommand);
    void vscode.window.showInformationMessage(
      `Macle DevTools simulator command invoked. Build output: ${outputDir}`
    );
  } catch (error) {
    void vscode.window.showWarningMessage(
      `Build succeeded, but Macle DevTools could not be opened: ${String(error)}`
    );
  }
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

async function startBuild(
  preview: boolean,
  context: vscode.ExtensionContext
): Promise<void> {
  const preferredRoot = projectRoot();
  if (!preferredRoot) {
    void vscode.window.showErrorMessage('Open a uni-app project folder before compiling for Macle.');
    return;
  }
  if (buildProcess && buildProcess.exitCode === null) {
    void vscode.window.showInformationMessage('A Macle development build is already running.');
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
  await openMacleSimulator(outputDir, context);
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
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('macle.toolkit.configFile')) {
        toolkitConfig = undefined;
        toolkitInstallPromise = undefined;
      }
    })
  );

  void ensureToolkitInstalled(context).catch((error) => {
    const message = `Could not set up Macle DevToolkit. It will be retried the next time VS Code starts: ${String(error)}`;
    outputChannel.appendLine(message);
    void vscode.window.showWarningMessage(message);
  });

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
  const compileDev = vscode.commands.registerCommand('macle.compileDev', () =>
    startBuild(false, context)
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
