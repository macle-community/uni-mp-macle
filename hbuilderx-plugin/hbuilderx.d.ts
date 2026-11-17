declare module 'hbuilderx' {
  export interface Disposable {
    dispose(): void;
  }

  export interface OutputChannel {
    append(value: string): void;
    appendLine(value: string): void;
    show(): void;
  }

  export interface Uri {
    fsPath: string;
  }

  export interface TextEditor {
    document?: {
      workspaceFolder?: {
        uri: Uri;
      };
    };
  }

  export interface WorkspaceFolder {
    uri: Uri;
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
  }

  const hx: {
    commands: {
      registerCommand(
        command: string,
        callback: (param?: unknown) => void | Promise<void>
      ): Disposable;
    };
    env: {
      openExternal(uri: Uri): void | Promise<void>;
    };
    Uri: {
      file(filePath: string): Uri;
    };
    window: {
      createOutputChannel(name: string): OutputChannel;
      getActiveTextEditor(): Promise<TextEditor | null | undefined>;
      showErrorMessage(message: string): void;
      showInformationMessage(message: string): void;
      showWarningMessage(message: string): void;
      setStatusBarMessage(message: string, timeout: number, type: 'info'): void;
    };
    workspace: {
      getWorkspaceFolders(): Promise<WorkspaceFolder[] | null | undefined>;
    };
  };

  export = hx;
}
