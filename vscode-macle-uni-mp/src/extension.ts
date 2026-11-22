import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
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
import { configureRunAndDebug, createMacleProject } from './project';
import { showWelcomePage } from './welcome';

const outputChannel = vscode.window.createOutputChannel('Macle uni-app');

let buildProcess: ChildProcess | undefined;
let toolkitInstallPromise: Promise<{
  toolkitRoot: string;
  simulatorInstalled: boolean;
  officialExtensionInstalled: boolean;
}> | undefined;

interface ToolkitConfig {
  download: { url: string; fileName: string; timeoutMs: number; redirectLimit: number };
  toolkit: {
    version: string;
    storageFolder: string;
    contentsFolder: string;
    uiFolder: string;
    compilerFolder: string;
    simulatorFolder: string;
    ideFolder: string;
  };
  archives: {
    ui: string;
    compiler: string;
    simulator: string;
    ide: string;
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
    const config = toolkitConfig;
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
  let wasmPath = path.join(
    context.extensionPath,
    'node_modules',
    'libarchive-wasm',
    'dist',
    'libarchive.wasm'
  );
  if (!fs.existsSync(wasmPath)) {
    // Bundled layouts may ship the wasm next to the compiled extension.
    wasmPath = path.join(path.dirname(__dirname), 'libarchive.wasm');
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
  try {
    await extractZipWithLibarchive(context, source, destination);
    outputChannel.appendLine(`Extracted ${path.basename(source)} with libarchive-wasm.`);
    return;
  } catch (libarchiveError) {
    outputChannel.appendLine(
      `libarchive-wasm failed for ${path.basename(source)}: ${String(libarchiveError)}`
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

async function installPlatformSimulator(
  context: vscode.ExtensionContext,
  toolkitRoot: string,
  simulatorDirectory: string
): Promise<boolean> {
  const config = loadToolkitConfig(context);

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
): Promise<{
  toolkitRoot: string;
  simulatorInstalled: boolean;
  officialExtensionInstalled: boolean;
}> {
  const config = loadToolkitConfig(context);
  const storagePath = context.globalStorageUri.fsPath;

  outputChannel.appendLine(`Preparing Macle DevToolkit...`);
  outputChannel.appendLine(`Global storage path: ${storagePath}`);

  // Honor a user-provided existing toolkit folder (set from the welcome page).
  const localPath = context.globalState.get<string>('macle.toolkit.localPath');
  if (localPath) {
    try {
      const stat = await fs.promises.stat(localPath);
      if (stat.isDirectory()) {
        outputChannel.appendLine(`Using existing Macle toolkit at ${localPath}`);
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
    const officialExtension = vscode.extensions.getExtension(config.officialExtension.id);
    if (!officialExtension) {
      void vscode.window.showWarningMessage(
        `Build complete at ${outputDir}, but the official Macle extension (${config.officialExtension.id}) is not active in this session. ` +
        `If it was just installed from the toolkit, reload the window to activate it — then run the simulator again.`
      );
      return;
    }
    void vscode.commands.executeCommand(config.officialExtension.simulatorCommand);
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
  try {
    outputChannel.appendLine('=== Macle extension activating ===');

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('macle.toolkit.configFile')) {
          toolkitConfig = undefined;
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

    // Auto-show welcome page on first install (deferred so VS Code is ready).
    setTimeout(async () => {
      outputChannel.appendLine('setTimeout: showing welcome page (auto-show)...');
      try {
        await showWelcomePage(context, async () => {
          outputChannel.appendLine('Welcome page auto-show download callback starting...');
          await ensureToolkitInstalled(context);
          outputChannel.appendLine('Welcome page auto-show download callback complete.');
        }, true);
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
  const createProject = vscode.commands.registerCommand('macle.createProject', () =>
    createMacleProject()
  );
  const configureProjectRunAndDebug = vscode.commands.registerCommand(
    'macle.configureRunAndDebug',
    () => configureRunAndDebug()
  );
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  statusBar.text = '$(play) Macle Preview';
  statusBar.tooltip = 'Compile uni-app and open the Macle simulator';
  statusBar.command = 'macle.compileAndPreview';
  if (vscode.workspace.workspaceFolders?.length) statusBar.show();
  context.subscriptions.push(
    showWelcome,
    compileAndPreview,
    compileDev,
    openReport,
    setupMaui,
    createProject,
    configureProjectRunAndDebug,
    statusBar,
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      if (vscode.workspace.workspaceFolders?.length) statusBar.show();
      else statusBar.hide();
    })
  );
  } catch (error) {
    outputChannel.appendLine(`Macle extension activation failed: ${String(error)}`);
    void vscode.window.showErrorMessage(`Macle extension activation failed: ${String(error)}`);
  }
}

export function deactivate(): void {
  if (buildProcess && buildProcess.exitCode === null) buildProcess.kill();
  outputChannel.dispose();
}
