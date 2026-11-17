import * as vscode from 'vscode';
import { transformSync, type NodePath, type PluginObj, types as BabelTypes } from '@babel/core';
import type { ParserPlugin } from '@babel/parser';
import { getMacleComponentDocUrl } from '../../src/component-docs';
import { apis, components } from '../../src/rules';

interface DiagnosticDetails {
  kind: 'api' | 'component';
  name: string;
  doc: string;
}

type CallNode = BabelTypes.CallExpression | BabelTypes.OptionalCallExpression;
type MemberNode = BabelTypes.MemberExpression | BabelTypes.OptionalMemberExpression;

function disabledLines(text: string): Set<number> {
  const disabled = new Set<number>();
  const stack: Array<{ include: boolean; inElse: boolean }> = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (stack.some((item) => item.include === item.inElse)) disabled.add(index);

    const directive = line.match(
      /^\s*(?:\/\/|<!--|\/\*)\s*#(?:(ifdef|ifndef)\s+MP-MACLE\b|(else|endif)\b)/
    );
    if (!directive) return;

    const kind = directive[1] ?? directive[2];
    if (kind === 'ifdef' || kind === 'ifndef') {
      stack.push({ include: kind === 'ifdef', inElse: false });
    } else if (kind === 'else' && stack.length > 0) {
      stack[stack.length - 1].inElse = true;
    } else if (kind === 'endif') {
      stack.pop();
    }
  });

  return disabled;
}

function scriptBlocks(document: vscode.TextDocument, text: string): Array<{ source: string; offset: number }> {
  if (document.languageId !== 'vue') return [{ source: text, offset: 0 }];

  const blocks: Array<{ source: string; offset: number }> = [];
  const expression = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
  for (const match of text.matchAll(expression)) {
    const openingTag = match[0].indexOf('>');
    blocks.push({
      source: match[1],
      offset: (match.index ?? 0) + openingTag + 1,
    });
  }
  return blocks;
}

function addDiagnostic(
  collection: vscode.DiagnosticCollection,
  document: vscode.TextDocument,
  range: vscode.Range,
  message: string,
  details: DiagnosticDetails
): void {
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
  diagnostic.source = 'Macle';
  diagnostic.code = `${details.kind === 'api' ? 'unsupported-api' : 'unsupported-component'}:${details.name}`;

  const existing = collection.get(document.uri) ?? [];
  collection.set(document.uri, [...existing, diagnostic]);
}

function scanScript(
  document: vscode.TextDocument,
  block: { source: string; offset: number },
  disabled: Set<number>,
  collection: vscode.DiagnosticCollection
): void {
  const inspectCall = (astPath: NodePath<CallNode>): void => {
    const callee = astPath.node.callee;
    if (
      callee.type !== 'MemberExpression' &&
      callee.type !== 'OptionalMemberExpression'
    ) {
      return;
    }

    const member = callee as MemberNode;
    if (member.object.type !== 'Identifier') return;
    const objectName = member.object.name;
    if ((objectName !== 'uni' && objectName !== 'wx') || astPath.scope.hasBinding(objectName)) {
      return;
    }

    const apiName =
      !member.computed && member.property.type === 'Identifier'
        ? member.property.name
        : member.computed && member.property.type === 'StringLiteral'
          ? member.property.value
          : undefined;
    const rule = apiName ? apis[apiName] : undefined;
    if (!apiName || rule?.status !== 2 || !member.property.loc) return;

    const start = document.positionAt(block.offset + member.property.start!);
    const end = document.positionAt(block.offset + member.property.end!);
    if (disabled.has(start.line)) return;

    const explanation =
      typeof rule.body?.msg === 'string'
        ? rule.body.msg
        : typeof rule.desc === 'string'
          ? rule.desc
          : 'This API is not supported by Macle.';
    addDiagnostic(
      collection,
      document,
      new vscode.Range(start, end),
      `${apiName}: ${explanation}`,
      {
        kind: 'api',
        name: apiName,
        doc: rule.url?.target || rule.url?.original || '',
      }
    );
  };

  const scanWithPlugins = (parserPlugins: ParserPlugin[]): void => {
    transformSync(block.source, {
      babelrc: false,
      configFile: false,
      filename: 'macle-diagnostics.js',
      parserOpts: { plugins: parserPlugins, sourceType: 'unambiguous' },
      plugins: [
        (): PluginObj => ({
          visitor: {
            CallExpression: inspectCall,
            OptionalCallExpression: inspectCall,
          },
        }),
      ],
    });
  };

  try {
    scanWithPlugins(['typescript', 'jsx', 'decorators-legacy']);
  } catch {
    try {
      scanWithPlugins(['jsx', 'decorators-legacy']);
    } catch {
      return;
    }
  }
}

function templateRanges(text: string): Array<{ start: number; end: number }> {
  const tags = /<\/?template\b[^>]*>/gi;
  const ranges: Array<{ start: number; end: number }> = [];
  const stack: number[] = [];

  for (const match of text.matchAll(tags)) {
    const tag = match[0];
    const index = match.index ?? 0;
    if (tag.startsWith('</')) {
      const start = stack.pop();
      if (start !== undefined && stack.length === 0) {
        ranges.push({ start, end: index });
      }
    } else if (!/\/\s*>$/.test(tag)) {
      if (stack.length === 0) stack.push(index + tag.length);
      else stack.push(index + tag.length);
    }
  }
  return ranges;
}

export function vueSectionAt(
  text: string,
  offset: number
): 'template' | 'script' | 'style' | undefined {
  const stack: Array<'template' | 'script' | 'style'> = [];
  const tags = /<\/?(template|script|style)\b[^>]*>/gi;
  for (const match of text.slice(0, offset).matchAll(tags)) {
    const tag = match[1].toLowerCase() as 'template' | 'script' | 'style';
    if (match[0].startsWith('</')) {
      const index = stack.lastIndexOf(tag);
      if (index >= 0) stack.splice(index, 1);
    } else if (!/\/\s*>$/.test(match[0])) {
      stack.push(tag);
    }
  }
  return stack[stack.length - 1];
}

function scanComponents(
  document: vscode.TextDocument,
  text: string,
  disabled: Set<number>,
  collection: vscode.DiagnosticCollection
): void {
  const ranges =
    document.languageId === 'vue'
      ? templateRanges(text)
      : [{ start: 0, end: text.length }];

  for (const range of ranges) {
    const source = text
      .slice(range.start, range.end)
      .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '));
    const expression = /<\s*([A-Za-z][\w.-]*)(?=[\s/>])/g;
    for (const match of source.matchAll(expression)) {
      const componentName = match[1].toLowerCase();
      const rule = components[componentName];
      if (rule?.status !== 2) continue;
      const startOffset = range.start + (match.index ?? 0) + match[0].lastIndexOf(componentName);
      const start = document.positionAt(startOffset);
      if (disabled.has(start.line)) continue;
      const end = document.positionAt(startOffset + componentName.length);
      const explanation =
        typeof rule.name === 'string' ? rule.name : `${componentName} is not supported by Macle.`;
      addDiagnostic(
        collection,
        document,
        new vscode.Range(start, end),
        `${componentName}: ${explanation}`,
        {
          kind: 'component',
          name: componentName,
          doc: getMacleComponentDocUrl(componentName),
        }
      );
    }
  }
}

export function getDiagnosticDetails(diagnostic: vscode.Diagnostic): DiagnosticDetails | undefined {
  if (typeof diagnostic.code !== 'string') return undefined;
  const [code, name] = diagnostic.code.split(':', 2);
  if (!name) return undefined;
  const kind = code === 'unsupported-api' ? 'api' : code === 'unsupported-component' ? 'component' : undefined;
  if (!kind) return undefined;
  const rule = kind === 'api' ? apis[name] : components[name];
  if (!rule) return undefined;
  return {
    kind,
    name,
    doc:
      kind === 'component'
        ? getMacleComponentDocUrl(name)
        : rule.url?.target || rule.url?.original || '',
  };
}

export function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  if (!['vue', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact'].includes(document.languageId)) {
    collection.delete(document.uri);
    return;
  }

  const text = document.getText();
  collection.delete(document.uri);
  const disabled = disabledLines(text);
  for (const block of scriptBlocks(document, text)) {
    scanScript(document, block, disabled, collection);
  }
  if (document.languageId === 'vue') scanComponents(document, text, disabled, collection);
}

export function codeActionProvider(): vscode.CodeActionProvider {
  return {
    provideCodeActions(document, _range, context) {
      const actions: vscode.CodeAction[] = [];
      for (const diagnostic of context.diagnostics) {
        const details = getDiagnosticDetails(diagnostic);
        if (!details) continue;

        const openDocs = new vscode.CodeAction(
          `Open reference for ${details.name}`,
          vscode.CodeActionKind.QuickFix
        );
        if (details.doc) {
          openDocs.command = {
            command: 'vscode.open',
            title: 'Open reference',
            arguments: [vscode.Uri.parse(details.doc)],
          };
          openDocs.diagnostics = [diagnostic];
          actions.push(openDocs);
        }

        const firstLine = document.lineAt(diagnostic.range.start.line);
        const lastLine = document.lineAt(diagnostic.range.end.line);
        const original = document.getText(
          new vscode.Range(firstLine.range.start, lastLine.range.end)
        );
        const indent = firstLine.text.match(/^\s*/)?.[0] ?? '';
        const section =
          document.languageId === 'vue'
            ? vueSectionAt(document.getText(), document.offsetAt(diagnostic.range.start))
            : undefined;
        const commentType = section === 'template' ? 'html' : section === 'style' ? 'css' : 'js';
        const openMarker = commentType === 'html' ? '<!-- #ifndef MP-MACLE -->' : commentType === 'css' ? '/* #ifndef MP-MACLE */' : '// #ifndef MP-MACLE';
        const closeMarker = commentType === 'html' ? '<!-- #endif -->' : commentType === 'css' ? '/* #endif */' : '// #endif';
        const wrap = new vscode.CodeAction(
          'Wrap in #ifndef MP-MACLE',
          vscode.CodeActionKind.QuickFix
        );
        wrap.diagnostics = [diagnostic];
        wrap.isPreferred = true;
        wrap.edit = new vscode.WorkspaceEdit();
        wrap.edit.replace(
          document.uri,
          new vscode.Range(firstLine.range.start, lastLine.range.end),
          `${indent}${openMarker}\n${original}\n${indent}${closeMarker}`
        );
        actions.push(wrap);
      }
      return actions;
    },
  };
}
