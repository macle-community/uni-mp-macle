import * as vscode from 'vscode';

interface MacleAction {
  label: string;
  description: string;
  command: string;
  icon: string;
}

const actions: MacleAction[] = [
  {
    label: 'New Project',
    description: 'Create a React Taro, Vue uni-app, or Pure Macle project',
    command: 'macle.createProject',
    icon: 'new-folder',
  },
  {
    label: 'Run & Debug Project',
    description: 'Configure VS Code launch and task profiles',
    command: 'macle.configureRunAndDebug',
    icon: 'debug-alt',
  },
  {
    label: 'Compile & Preview',
    description: 'Build for Macle and open the simulator',
    command: 'macle.compileAndPreview',
    icon: 'play',
  },
  {
    label: 'Compile for Macle',
    description: 'Start a development build',
    command: 'macle.compileDev',
    icon: 'tools',
  },
  {
    label: 'Open Web Simulator',
    description: 'Launch standalone Macle Web Simulator in browser',
    command: 'macle.openWebSimulator',
    icon: 'browser',
  },
  {
    label: 'Compatibility Report',
    description: 'View build compatibility findings',
    command: 'macle.openCompatibilityReport',
    icon: 'report',
  },
  {
    label: 'Configure MAUI UI Library',
    description: 'Copy the library and register page components',
    command: 'macle.configureMauiLibrary',
    icon: 'cloud-download',
  },
];

export class MacleActionItem extends vscode.TreeItem {
  constructor(action: MacleAction) {
    super(action.label, vscode.TreeItemCollapsibleState.None);
    this.description = action.description;
    this.tooltip = action.description;
    this.iconPath = new vscode.ThemeIcon(action.icon);
    this.command = {
      command: action.command,
      title: action.label,
    };
    this.contextValue = 'macleAction';
  }
}

export class MacleActivityProvider implements vscode.TreeDataProvider<MacleActionItem> {
  getTreeItem(element: MacleActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): MacleActionItem[] {
    return actions.map((action) => new MacleActionItem(action));
  }
}
