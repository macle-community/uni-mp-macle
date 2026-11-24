import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as vscode from 'vscode';

export interface ResolvedCompiler {
  command: string;
  argsPrefix: string[];
}

export interface MacleTargetPaths {
  projectName: string;
  debugApp: string;
  releaseApp: string;
}

export interface ToolkitConfig {
  download: { url: string; fileName: string; timeoutMs: number; redirectLimit: number };
  toolkit: {
    version: string;
    storageFolder: string;
    contentsFolder: string;
    uiFolder: string;
    compilerFolder: string;
    compilerExecutable?: string;
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

let cachedToolkitConfig: ToolkitConfig | undefined;

export function resetToolkitConfigCache(): void {
  cachedToolkitConfig = undefined;
}

export function toolkitConfigPath(context?: vscode.ExtensionContext): string {
  if (context) {
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

  const defaultMedia = path.resolve(__dirname, '..', 'media', 'toolkit-config.json');
  if (fs.existsSync(defaultMedia)) {
    return defaultMedia;
  }
  return path.resolve(__dirname, 'media', 'toolkit-config.json');
}

export function loadToolkitConfig(context?: vscode.ExtensionContext): ToolkitConfig {
  if (cachedToolkitConfig) return cachedToolkitConfig;
  const configPath = toolkitConfigPath(context);
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as ToolkitConfig;
  cachedToolkitConfig = parsed;
  return parsed;
}

export function resolveMacleProjectName(projectRoot: string): string {
  try {
    const configPath = path.join(projectRoot, 'project.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectname?: string };
      if (config.projectname && typeof config.projectname === 'string') {
        return config.projectname.trim();
      }
    }
  } catch {
    // fallback
  }

  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (pkg.name && typeof pkg.name === 'string') {
        return pkg.name.trim();
      }
    }
  } catch {
    // fallback
  }

  return path.basename(projectRoot);
}

export function getMacleTargetPaths(projectRoot: string): MacleTargetPaths {
  const projectName = resolveMacleProjectName(projectRoot);
  const home = os.homedir();
  return {
    projectName,
    debugApp: path.join(home, '.macle', 'target', 'compose', projectName, 'root', 'debug', 'app'),
    releaseApp: path.join(home, '.macle', 'target', 'compile', projectName, 'app'),
  };
}

export function resolveMacleCompiler(context?: vscode.ExtensionContext): ResolvedCompiler | undefined {
  // 1. User configuration setting: macle.compiler.path
  const customPath = vscode.workspace.getConfiguration('macle').get<string>('compiler.path')?.trim();
  if (customPath && fs.existsSync(customPath)) {
    if (customPath.endsWith('.js')) {
      return { command: process.execPath || 'node', argsPrefix: [customPath] };
    }
    return { command: customPath, argsPrefix: [] };
  }

  // 2. Resolve compiler path from toolkit configuration
  try {
    const config = loadToolkitConfig(context);
    const compilerFolder = config.toolkit.compilerFolder || 'engine-compiler';
    const compilerExecutable = config.toolkit.compilerExecutable || 'bin/index.js';
    const compilerArchiveName =
      config.archives.compiler?.replace(/\.zip$/i, '') || 'Macle_26.6.0-LG0001_Engine_Compiler';

    // 2a. User-selected existing toolkit path (e.g. from welcome page)
    const localToolkit = context?.globalState.get<string>('macle.toolkit.localPath');
    if (localToolkit && fs.existsSync(localToolkit)) {
      const candidates = [
        path.join(localToolkit, compilerFolder, compilerExecutable),
        path.join(localToolkit, compilerArchiveName, compilerExecutable),
        path.join(localToolkit, config.toolkit.contentsFolder, compilerArchiveName, compilerExecutable),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return { command: process.execPath || 'node', argsPrefix: [candidate] };
        }
      }
    }

    // 2b. Extracted toolkit directory in globalStorage
    if (context) {
      try {
        const storageRoot = context.globalStorageUri.fsPath;
        const toolkitRoot = path.join(
          storageRoot,
          config.toolkit.storageFolder,
          config.toolkit.version
        );
        const candidates = [
          path.join(toolkitRoot, compilerFolder, compilerExecutable),
          path.join(toolkitRoot, config.toolkit.contentsFolder, compilerArchiveName, compilerExecutable),
        ];
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return { command: process.execPath || 'node', argsPrefix: [candidate] };
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 3. User local bin directory (~/.local/bin/macle-compiler)
  const userLocalBin = path.join(os.homedir(), '.local', 'bin', 'macle-compiler');
  if (fs.existsSync(userLocalBin)) {
    return { command: userLocalBin, argsPrefix: [] };
  }

  // 4. Default CLI executable in PATH
  return { command: 'macle-compiler', argsPrefix: [] };
}
