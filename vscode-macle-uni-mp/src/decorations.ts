import * as vscode from 'vscode';

interface ConditionalBlock {
  startLine: number;
  includeForMacle: boolean;
  condition: boolean;
  inElse: boolean;
  parentIncludesMacle: boolean;
  initialIncludesMacle: boolean;
}

export function createConditionalDecorations(context: vscode.ExtensionContext): {
  update(editor: vscode.TextEditor): void;
  dispose(): void;
} {
  const macleDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.rangeHighlightBackground'),
    border: '1px solid',
    borderColor: new vscode.ThemeColor('editorInfo.foreground'),
    isWholeLine: true,
    overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  });
  const otherPlatformDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.lineHighlightBackground'),
    opacity: '0.55',
    isWholeLine: true,
  });

  context.subscriptions.push(macleDecoration, otherPlatformDecoration);

  function update(editor: vscode.TextEditor): void {
    const stack: ConditionalBlock[] = [];
    const macle: vscode.DecorationOptions[] = [];
    const other: vscode.DecorationOptions[] = [];

    for (let line = 0; line < editor.document.lineCount; line++) {
      const source = editor.document.lineAt(line).text;
      const match = source.match(
        /^\s*(?:\/\/|<!--|\/\*)\s*#(?:(ifdef|ifndef)\s+MP-MACLE\b|(else|endif)\b)/
      );
      if (!match) continue;

      const kind = match[1] ?? match[2];
      if (kind === 'ifdef' || kind === 'ifndef') {
        const parentIncludesMacle = stack.every((block) => block.includeForMacle);
        const includesMacle = parentIncludesMacle && kind === 'ifdef';
        stack.push({
          startLine: line,
          condition: kind === 'ifdef',
          inElse: false,
          parentIncludesMacle,
          includeForMacle: includesMacle,
          initialIncludesMacle: includesMacle,
        });
        continue;
      }

      if (kind === 'else' && stack.length > 0) {
        const block = stack[stack.length - 1];
        block.inElse = !block.inElse;
        block.includeForMacle =
          block.parentIncludesMacle && (block.inElse ? !block.condition : block.condition);
        continue;
      }

      if (kind === 'endif' && stack.length > 0) {
        const block = stack.pop()!;
        const range = new vscode.Range(
          new vscode.Position(block.startLine, 0),
          editor.document.lineAt(line).range.end
        );
        (block.initialIncludesMacle ? macle : other).push({ range });
      }
    }

    const finalLine = Math.max(0, editor.document.lineCount - 1);
    for (const block of stack) {
      const range = new vscode.Range(
        new vscode.Position(block.startLine, 0),
        editor.document.lineAt(finalLine).range.end
      );
      (block.initialIncludesMacle ? macle : other).push({ range });
    }

    editor.setDecorations(macleDecoration, macle);
    editor.setDecorations(otherPlatformDecoration, other);
  }

  return {
    update,
    dispose() {
      macleDecoration.dispose();
      otherPlatformDecoration.dispose();
    },
  };
}
