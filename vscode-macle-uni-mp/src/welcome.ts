import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';

export type WelcomeChoice = 'download' | 'existing' | 'skip';

function isToolkitArchiveCached(context: vscode.ExtensionContext): boolean {
  try {
    const storagePath = context.globalStorageUri.fsPath;
    const archivePath = path.join(storagePath, 'DevToolkit_26.6.0-LG0001.zip');
    const stat = fs.statSync(archivePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}

function isToolkitExtracted(context: vscode.ExtensionContext): boolean {
  try {
    const storagePath = context.globalStorageUri.fsPath;
    const contentsDir = path.join(storagePath, 'toolkit', '26.6.0', 'contents');
    return fs.existsSync(contentsDir);
  } catch {
    return false;
  }
}

export async function showWelcomePage(
  context: vscode.ExtensionContext,
  onDownload?: () => Promise<void>,
  force = false
): Promise<void> {
  try {
    if (!force) {
      const alreadyShown = context.globalState.get<boolean>('macle.welcomeShown');
      if (alreadyShown) return;
    }

    const toolkitCached = isToolkitArchiveCached(context);
    const toolkitExtracted = isToolkitExtracted(context);

    // If toolkit is already cached or extracted, skip download step and go straight to ready/skip
    if (toolkitCached || toolkitExtracted) {
      const choice = await vscode.window.showQuickPick<{ label: string; description: string; type: WelcomeChoice }>(
        [
          {
            label: 'DevToolkit Ready',
            description: toolkitCached
              ? 'Toolkit archive is already cached. Extracting...'
              : 'Toolkit is already extracted and ready to use.',
            type: toolkitCached ? 'download' : 'skip',
          },
          {
            label: 'I already have it installed',
            description: 'Select your existing Macle DevToolkit folder',
            type: 'existing',
          },
          {
            label: 'Skip for now',
            description: 'Skip DevToolkit setup',
            type: 'skip',
          },
        ],
        {
          title: 'Macle Mini Program - Get Started',
          placeHolder: 'The Macle DevToolkit is already available.',
          ignoreFocusOut: true,
        }
      );

      if (!choice) {
        await context.globalState.update('macle.welcomeShown', true);
        return;
      }

      switch (choice.type) {
        case 'download': {
          await context.globalState.update('macle.welcomeShown', true);
          if (onDownload) {
            try {
              await onDownload();
              void vscode.window.showInformationMessage(
                'Macle DevToolkit is ready. You can now compile your uni-app project for Macle.'
              );
            } catch (error) {
              void vscode.window.showErrorMessage(
                `Failed to set up Macle DevToolkit: ${String(error)}`
              );
            }
          }
          break;
        }
        case 'existing': {
          const selected = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Macle Toolkit Folder',
            title: 'Select your existing Macle DevToolkit folder',
          });
          if (!selected?.[0]) {
            await context.globalState.update('macle.welcomeShown', true);
            return;
          }
          await context.globalState.update('macle.toolkit.localPath', selected[0].fsPath);
          await context.globalState.update('macle.welcomeShown', true);
          void vscode.window.showInformationMessage(
            `Macle toolkit path saved: ${selected[0].fsPath}`
          );
          break;
        }
        case 'skip': {
          await context.globalState.update('macle.welcomeShown', true);
          break;
        }
      }
      return;
    }

    // No toolkit cached — show full options
    const choice = await vscode.window.showQuickPick<{ label: string; description: string; type: WelcomeChoice }>(
      [
        {
          label: 'Download DevToolkit',
          description: 'Download and set up the Macle DevToolkit (UI, Engine Compiler, Simulator)',
          type: 'download',
        },
        {
          label: 'I already have it installed',
          description: 'Select your existing Macle DevToolkit folder',
          type: 'existing',
        },
        {
          label: 'Skip for now',
          description: 'Skip DevToolkit setup',
          type: 'skip',
        },
      ],
      {
        title: 'Macle Mini Program - Get Started',
        placeHolder: 'How would you like to set up the Macle DevToolkit?',
        ignoreFocusOut: true,
      }
    );

    if (!choice) {
      await context.globalState.update('macle.welcomeShown', true);
      return;
    }

    switch (choice.type) {
      case 'download': {
        await context.globalState.update('macle.welcomeShown', true);
        if (onDownload) {
          try {
            await onDownload();
            void vscode.window.showInformationMessage(
              'Macle DevToolkit is ready. You can now compile your uni-app project for Macle.'
            );
          } catch (error) {
            void vscode.window.showErrorMessage(
              `Failed to set up Macle DevToolkit: ${String(error)}`
            );
          }
        }
        break;
      }
      case 'existing': {
        const selected = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select Macle Toolkit Folder',
          title: 'Select your existing Macle DevToolkit folder',
        });
        if (!selected?.[0]) {
          await context.globalState.update('macle.welcomeShown', true);
          return;
        }
        await context.globalState.update('macle.toolkit.localPath', selected[0].fsPath);
        await context.globalState.update('macle.welcomeShown', true);
        void vscode.window.showInformationMessage(
          `Macle toolkit path saved: ${selected[0].fsPath}`
        );
        break;
      }
      case 'skip': {
        await context.globalState.update('macle.welcomeShown', true);
        break;
      }
    }
  } catch (error) {
    void vscode.window.showErrorMessage(`Welcome page error: ${String(error)}`);
  }
}

export async function resetWelcomePage(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update('macle.welcomeShown', false);
}
