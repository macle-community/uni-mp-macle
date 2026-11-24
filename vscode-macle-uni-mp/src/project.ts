import fs from 'node:fs';
import path from 'node:path';
import * as vscode from 'vscode';
import { getMacleTargetPaths, resolveMacleProjectName } from './compiler-cli';

export type ProjectFramework = 'taro-react' | 'uni-vue' | 'pure-macle';

function packageManagerCommand(): { command: string; npxArgs: string[] } {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return { command: executable, npxArgs: [] };
}

async function resolveProjectDestination(): Promise<string | undefined> {
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Create Project Folder',
    title: 'Choose the parent folder for the new project',
  });
  return selected?.[0]?.fsPath;
}

async function createTerminalProject(
  framework: ProjectFramework,
  projectName: string,
  destination: string
): Promise<string> {
  const projectRoot = path.join(destination, projectName);
  if (fs.existsSync(projectRoot)) {
    throw new Error(`The project folder already exists: ${projectRoot}`);
  }

  const manager = packageManagerCommand();
  let args: string[];
  let commandName: string;
  if (framework === 'taro-react') {
    args = [...manager.npxArgs, '--yes', '@tarojs/cli', 'init', projectName];
    commandName = 'Taro React';
  } else {
    args = [...manager.npxArgs, '--yes', 'degit', 'dcloudio/uni-preset-vue#vite-ts', projectName];
    commandName = 'uni-app Vue';
  }

  const terminal = vscode.window.createTerminal({
    name: `Create ${commandName} Project`,
    cwd: destination,
  });
  terminal.show();
  terminal.sendText([manager.command, ...args].join(' '));
  return projectRoot;
}

export async function createPureMacleProject(
  projectName: string,
  destination: string
): Promise<string> {
  const projectRoot = path.join(destination, projectName);
  if (fs.existsSync(projectRoot)) {
    throw new Error(`The project folder already exists: ${projectRoot}`);
  }

  fs.mkdirSync(projectRoot, { recursive: true });

  const projectConfig = {
    description: 'project config file',
    projectname: projectName,
    setting: {
      es5: false,
    },
  };

  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Pure Macle Mini Program',
    scripts: {
      'compile:debug': `macle-compiler -s . -t ~/.macle/target/compose/${projectName}/root/debug/app -d`,
      'compile:release': `macle-compiler -s . -t ~/.macle/target/compile/${projectName}/app`,
    },
  };

  const appJson = {
    pages: ['pages/index/index'],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTitleText: projectName,
      navigationBarTextStyle: 'black',
      capsuleTheme: 'light',
    },
    style: 'v2',
    sitemapLocation: 'sitemap.json',
  };

  const appJs = `// app.js\nApp({\n  onLaunch() {\n    console.log('App launched');\n  },\n  onShow() {\n    console.log('App shown');\n  }\n});\n`;

  const appMass = `/**app.mass**/\n.container {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n  padding: 100rpx 0;\n  box-sizing: border-box;\n  background-color: white;\n}\n`;

  const pagesIndexDir = path.join(projectRoot, 'pages', 'index');
  fs.mkdirSync(pagesIndexDir, { recursive: true });

  const pageJson = `{\n  "usingComponents": {}\n}\n`;
  const pageMaml = `<!--pages/index/index.maml-->\n<view class="container">\n  <text class="title">{{motto}}</text>\n</view>\n`;
  const pageMass = `/**pages/index/index.mass**/\n.title {\n  font-size: 36rpx;\n  color: #333333;\n  font-weight: bold;\n}\n`;
  const pageJs = `// pages/index/index.js\nPage({\n  data: {\n    motto: 'Hello Macle'\n  },\n  onLoad(options) {},\n  onReady() {},\n  onShow() {},\n  onHide() {},\n  onUnload() {}\n});\n`;
  const gitignore = `node_modules/\ndist/\n.DS_Store\n`;

  fs.writeFileSync(path.join(projectRoot, 'project.config.json'), JSON.stringify(projectConfig, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(projectRoot, 'app.json'), JSON.stringify(appJson, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(projectRoot, 'app.js'), appJs, 'utf8');
  fs.writeFileSync(path.join(projectRoot, 'app.mass'), appMass, 'utf8');
  fs.writeFileSync(path.join(pagesIndexDir, 'index.json'), pageJson, 'utf8');
  fs.writeFileSync(path.join(pagesIndexDir, 'index.maml'), pageMaml, 'utf8');
  fs.writeFileSync(path.join(pagesIndexDir, 'index.mass'), pageMass, 'utf8');
  fs.writeFileSync(path.join(pagesIndexDir, 'index.js'), pageJs, 'utf8');
  fs.writeFileSync(path.join(projectRoot, '.gitignore'), gitignore, 'utf8');

  await configureRunAndDebug(projectRoot);
  return projectRoot;
}

export function detectProjectFramework(projectRoot: string): ProjectFramework {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      if (dependencies['@tarojs/taro'] || dependencies['@tarojs/cli']) return 'taro-react';
      if (dependencies['@dcloudio/vite-plugin-uni'] || dependencies['@dcloudio/uni-app']) return 'uni-vue';
    } catch {
      // ignore
    }
  }

  if (
    fs.existsSync(path.join(projectRoot, 'pages.json')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'pages.json'))
  ) {
    return 'uni-vue';
  }

  if (
    fs.existsSync(path.join(projectRoot, 'project.config.json')) ||
    (fs.existsSync(path.join(projectRoot, 'app.json')) &&
      (fs.existsSync(path.join(projectRoot, 'app.mass')) || fs.existsSync(path.join(projectRoot, 'app.js'))))
  ) {
    return 'pure-macle';
  }

  return 'uni-vue';
}

export async function createMacleProject(): Promise<void> {
  const framework = await vscode.window.showQuickPick(
    [
      {
        label: 'Pure Macle',
        description: 'Create a native Pure Macle mini program (.maml, .mass, .sjs, ma.*)',
        framework: 'pure-macle' as const,
      },
      {
        label: 'Vue + uni-app',
        description: 'Create a Vue 3 + Vite uni-app project',
        framework: 'uni-vue' as const,
      },
      {
        label: 'React + Taro',
        description: 'Create a Taro React project',
        framework: 'taro-react' as const,
      },
    ],
    { title: 'New Macle Project', placeHolder: 'Choose a framework' }
  );
  if (!framework) return;

  const projectName = (await vscode.window.showInputBox({
    prompt: 'Project name',
    placeHolder: 'my-macle-project',
    validateInput: (value) =>
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
        ? undefined
        : 'Use letters, numbers, dots, underscores, or hyphens.',
  }))?.trim();
  if (!projectName) return;

  const destination = await resolveProjectDestination();
  if (!destination) return;

  try {
    if (framework.framework === 'pure-macle') {
      const projectRoot = await createPureMacleProject(projectName, destination);
      const choice = await vscode.window.showInformationMessage(
        `Created Pure Macle project at ${projectRoot}.`,
        'Open Project'
      );
      if (choice === 'Open Project') {
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectRoot));
      }
    } else {
      const projectRoot = await createTerminalProject(framework.framework, projectName, destination);
      void vscode.window.showInformationMessage(
        `Creating ${framework.label} project in ${projectRoot}. VS Code will open the project after the scaffold terminal finishes.`
      );
    }
  } catch (error) {
    void vscode.window.showErrorMessage(`Could not create the project: ${String(error)}`);
  }
}

function parseJsonConfig(source: string): Record<string, unknown> {
  let normalized = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inString) {
      normalized += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      normalized += char;
      continue;
    }
    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      normalized += '\n';
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index - 1] === '*' && source[index] === '/')) index += 1;
      normalized += ' ';
      continue;
    }
    normalized += char;
  }
  return JSON.parse(normalized.replace(/,(\s*[}\]])/g, '$1')) as Record<string, unknown>;
}

function mergeJsonArray(
  existing: unknown,
  additions: unknown[],
  idField: string
): unknown[] {
  const existingItems = Array.isArray(existing) ? existing : [];
  const ids = new Set(
    existingItems
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => String(item[idField] ?? ''))
  );
  return [
    ...existingItems,
    ...additions.filter((item) => {
      if (!item || typeof item !== 'object') return true;
      const id = String((item as Record<string, unknown>)[idField] ?? '');
      return id ? !ids.has(id) : true;
    }),
  ];
}

export async function configureRunAndDebug(root?: string): Promise<void> {
  const projectRoot = root ?? projectRootFallback();
  if (!projectRoot) {
    void vscode.window.showErrorMessage('Open or select a project folder before configuring Run and Debug.');
    return;
  }

  const framework = detectProjectFramework(projectRoot);
  const projectName = resolveMacleProjectName(projectRoot);
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };

      const scripts = packageJson.scripts ?? {};
      if (framework === 'pure-macle') {
        scripts['compile:debug'] ??= `macle-compiler -s . -t ~/.macle/target/compose/${projectName}/root/debug/app -d`;
        scripts['compile:release'] ??= `macle-compiler -s . -t ~/.macle/target/compile/${projectName}/app`;
      } else if (framework === 'taro-react') {
        scripts['dev:h5'] ??= 'npx taro build --type h5 --watch';
        scripts['dev:macle'] ??= 'npx taro build --type macle --watch';
        scripts['build:macle'] ??= 'npx taro build --type macle';
      } else {
        scripts['dev:h5'] ??= 'npx uni -p h5 --watch';
        scripts['dev:macle'] ??= 'npx uni -p mp-weixin --watch';
        scripts['build:macle'] ??= 'npx uni -p mp-weixin';
      }
      packageJson.scripts = scripts;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    } catch {
      // Keep configuration going even if package.json has parsing issues
    }
  }

  const vscodeDirectory = path.join(projectRoot, '.vscode');
  fs.mkdirSync(vscodeDirectory, { recursive: true });

  const launchPath = path.join(vscodeDirectory, 'launch.json');
  let launch: Record<string, unknown> = { version: '0.2.0', configurations: [] };
  if (fs.existsSync(launchPath)) {
    try {
      launch = parseJsonConfig(fs.readFileSync(launchPath, 'utf8'));
    } catch {
      void vscode.window.showWarningMessage('Existing launch.json was invalid JSON; a valid launch configuration will be created.');
    }
  }

  let launchConfigurations: Array<Record<string, unknown>>;
  if (framework === 'pure-macle') {
    launchConfigurations = [
      {
        name: 'Macle: Compile & Debug Pure Macle',
        type: 'node',
        request: 'launch',
        runtimeExecutable: 'macle-compiler',
        runtimeArgs: [
          '-s',
          '${workspaceFolder}',
          '-t',
          `\${env:HOME}/.macle/target/compose/${projectName}/root/debug/app`,
          '-d',
        ],
        cwd: '${workspaceFolder}',
        console: 'integratedTerminal',
      },
    ];
  } else if (framework === 'taro-react') {
    launchConfigurations = [
      {
        name: 'Macle: Run Taro React in H5',
        type: 'pwa-chrome',
        request: 'launch',
        url: 'http://localhost:10086',
        webRoot: projectRoot,
        preLaunchTask: 'Macle: Start Taro H5',
      },
      {
        name: 'Macle: Debug Taro React in Macle',
        type: 'node',
        request: 'launch',
        runtimeExecutable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
        runtimeArgs: ['run', 'dev:macle'],
        cwd: projectRoot,
        console: 'integratedTerminal',
        env: {
          NODE_ENV: 'development',
        },
      },
    ];
  } else {
    launchConfigurations = [
      {
        name: 'Macle: Run Vue in H5',
        type: 'pwa-chrome',
        request: 'launch',
        url: 'http://localhost:5173',
        webRoot: projectRoot,
        preLaunchTask: 'Macle: Start Vue H5',
      },
      {
        name: 'Macle: Debug Vue in Macle',
        type: 'node',
        request: 'launch',
        runtimeExecutable: process.platform === 'win32' ? 'npm.cmd' : 'npm',
        runtimeArgs: ['run', 'dev:macle'],
        cwd: projectRoot,
        console: 'integratedTerminal',
        env: {
          UNI_PLATFORM: 'mp-weixin',
          UNI_CUSTOM_PLATFORM: 'mp-macle',
          UNI_OUTPUT_DIR: '${workspaceFolder}/dist/dev/mp-macle',
          NODE_ENV: 'development',
        },
      },
    ];
  }

  launch.configurations = mergeJsonArray(launch.configurations, launchConfigurations, 'name');
  fs.writeFileSync(launchPath, JSON.stringify(launch, null, 2), 'utf8');

  const tasksPath = path.join(vscodeDirectory, 'tasks.json');
  let tasks: Record<string, unknown> = { version: '2.0.0', tasks: [] };
  if (fs.existsSync(tasksPath)) {
    try {
      tasks = parseJsonConfig(fs.readFileSync(tasksPath, 'utf8'));
    } catch {
      void vscode.window.showWarningMessage('Existing tasks.json was invalid JSON; a valid task configuration will be created.');
    }
  }

  let taskConfigurations: Array<Record<string, unknown>>;
  if (framework === 'pure-macle') {
    taskConfigurations = [
      {
        label: 'Macle: Compile Pure Macle (Debug)',
        type: 'shell',
        command: `macle-compiler -s "\${workspaceFolder}" -t "\${env:HOME}/.macle/target/compose/${projectName}/root/debug/app" -d`,
        problemMatcher: [],
      },
      {
        label: 'Macle: Compile Pure Macle (Release)',
        type: 'shell',
        command: `macle-compiler -s "\${workspaceFolder}" -t "\${env:HOME}/.macle/target/compile/${projectName}/app"`,
        problemMatcher: [],
      },
    ];
  } else if (framework === 'taro-react') {
    taskConfigurations = [
      {
        label: 'Macle: Start Taro H5',
        type: 'npm',
        script: 'dev:h5',
        isBackground: true,
        problemMatcher: {
          owner: 'taro',
          pattern: { regexp: '^' },
          background: {
            activeOnStart: true,
            beginsPattern: '.*',
            endsPattern: '.*(?:Local|localhost).*',
          },
        },
      },
      {
        label: 'Macle: Compile Taro for Macle',
        type: 'npm',
        script: 'build:macle',
        problemMatcher: [],
      },
    ];
  } else {
    taskConfigurations = [
      {
        label: 'Macle: Start Vue H5',
        type: 'npm',
        script: 'dev:h5',
        isBackground: true,
        problemMatcher: {
          owner: 'uni-app',
          pattern: { regexp: '^' },
          background: {
            activeOnStart: true,
            beginsPattern: '.*',
            endsPattern: '.*(?:Local|localhost).*',
          },
        },
      },
      {
        label: 'Macle: Compile Vue for Macle',
        type: 'npm',
        script: 'build:macle',
        problemMatcher: [],
      },
    ];
  }

  tasks.tasks = mergeJsonArray(tasks.tasks, taskConfigurations, 'label');
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf8');

  const choice = await vscode.window.showInformationMessage(
    'Run and Debug configurations were added to .vscode/launch.json and .vscode/tasks.json.',
    'Open Launch'
  );
  if (choice === 'Open Launch') {
    await vscode.commands.executeCommand('workbench.action.debug.selectandstart');
  }
}

function projectRootFallback(): string | undefined {
  const activeDocument = vscode.window.activeTextEditor?.document.uri;
  const folder =
    (activeDocument ? vscode.workspace.getWorkspaceFolder(activeDocument) : undefined) ??
    vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath;
}
