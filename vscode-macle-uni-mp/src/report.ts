import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';

interface ReportEntry {
  components?: Array<{ name?: string; attrs?: string[]; doc?: string }>;
}

interface ReportPayload {
  transforms?: Record<string, ReportEntry>;
  apisLineMap?: Record<string, Record<string, number[]>>;
}

interface ReportFinding {
  fileName: string;
  name: string;
  details: string;
  doc: string;
  line?: number;
  kind: 'api' | 'component';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}

function readReport(outputDir: string): ReportPayload | undefined {
  const dataPath = path.join(outputDir, 'macle-report', 'report', 'js', 'data.js');
  if (!fs.existsSync(dataPath)) return undefined;
  const source = fs.readFileSync(dataPath, 'utf8');
  const match = source.match(/^window\.pageData\s*=\s*([\s\S]*?);window\.ideLan=/);
  if (!match) return undefined;
  const parsed: unknown = JSON.parse(match[1]);
  return parsed !== null && typeof parsed === 'object' ? (parsed as ReportPayload) : undefined;
}

function getFindings(payload: ReportPayload): ReportFinding[] {
  const findings: ReportFinding[] = [];
  for (const [fileName, entry] of Object.entries(payload.transforms ?? {})) {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.components)) continue;
    for (const component of entry.components ?? []) {
      if (!component || typeof component !== 'object') continue;
      const name = typeof component.name === 'string' ? component.name : 'Compatibility issue';
      const apiName = name.replace(/^wx\./, '');
      const lines = payload.apisLineMap?.[fileName]?.[apiName];
      findings.push({
        fileName,
        name,
        details:
          (Array.isArray(component.attrs)
            ? component.attrs.filter((value): value is string => typeof value === 'string')
            : []
          ).join(', ') || 'Compatibility issue',
        doc: typeof component.doc === 'string' ? component.doc : '',
        line: Array.isArray(lines) && typeof lines[0] === 'number' ? lines[0] : undefined,
        kind: name.startsWith('wx.') ? 'api' : 'component',
      });
    }
  }
  return findings;
}

function isWithinProject(projectRoot: string, filePath: string): boolean {
  const relative = path.relative(projectRoot, filePath);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function sourceMapPosition(
  outputDir: string,
  projectRoot: string,
  fileName: string,
  generatedLine: number
): { filePath: string; line: number } | undefined {
  const compiledPath = path.resolve(outputDir, fileName);
  if (!isWithinProject(outputDir, compiledPath)) return undefined;
  const mapPath = `${compiledPath}.map`;
  if (!fs.existsSync(mapPath)) return undefined;

  try {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const trace = new TraceMap(map, mapPath);
    const original = originalPositionFor(trace, { line: generatedLine, column: 0 });
    if (!original.source || original.line === null) return undefined;

    const rawSource = original.source.replace(/^file:\/\//, '').replace(/^(?:webpack|vite):\/\//, '');
    const candidates = [
      path.resolve(path.dirname(mapPath), map.sourceRoot ?? '', rawSource),
      path.resolve(projectRoot, rawSource.replace(/^[/\\]+/, '')),
      path.resolve(path.dirname(mapPath), rawSource.replace(/^[/\\]+/, '')),
    ];
    const filePath = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (filePath) return { filePath, line: original.line - 1 };
  } catch {
    return undefined;
  }
  return undefined;
}

function findComponentSource(
  projectRoot: string,
  outputDir: string,
  fileName: string,
  componentName: string
): { filePath: string; line: number } | undefined {
  const relativeVue = fileName.replace(/\.maml$/, '.vue');
  const candidates = [
    path.resolve(projectRoot, relativeVue),
    path.resolve(projectRoot, 'src', relativeVue),
  ];
  for (const filePath of candidates) {
    if (!isWithinProject(projectRoot, filePath) || !fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    const line = lines.findIndex((source) =>
      new RegExp(`<\\s*${componentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s/>])`, 'i').test(source)
    );
    if (line >= 0) return { filePath, line };
  }
  return sourceMapPosition(outputDir, projectRoot, fileName, 1);
}

function resolveFindingPosition(
  finding: ReportFinding,
  projectRoot: string,
  outputDir: string
): { filePath: string; line: number } | undefined {
  if (finding.kind === 'component') {
    return findComponentSource(projectRoot, outputDir, finding.fileName, finding.name);
  }

  if (typeof finding.line === 'number') {
    const mapped = sourceMapPosition(outputDir, projectRoot, finding.fileName, finding.line);
    if (mapped) return mapped;
  }

  const compiledPath = path.resolve(outputDir, finding.fileName);
  if (isWithinProject(outputDir, compiledPath) && fs.existsSync(compiledPath)) {
    return { filePath: compiledPath, line: Math.max(0, (finding.line ?? 1) - 1) };
  }
  return undefined;
}

function renderReport(findings: ReportFinding[], nonce: string): string {
  const rows = findings
    .map(
      (finding, index) => `
        <li>
          <button class="finding" data-index="${index}" type="button">
            <span class="name">${escapeHtml(finding.name)}</span>
            <span class="location">${escapeHtml(finding.fileName)}${finding.line ? `:${finding.line}` : ''}</span>
            <span>${escapeHtml(finding.details)}</span>
          </button>
          ${safeReferenceUrl(finding.doc) ? `<a href="${escapeHtml(safeReferenceUrl(finding.doc)!)}">Reference</a>` : ''}
        </li>`
    )
    .join('');
  const empty = findings.length === 0 ? '<p>No compatibility findings were reported.</p>' : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Macle Compatibility Report</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 1.25rem; }
    h1 { font-size: 1.4rem; }
    ul { list-style: none; padding: 0; }
    li { border-bottom: 1px solid var(--vscode-panel-border); padding: .8rem 0; }
    .finding { display: grid; gap: .3rem; width: 100%; text-align: left; color: inherit; background: transparent; border: 0; padding: .25rem; cursor: pointer; }
    .finding:hover, .finding:focus-visible { background: var(--vscode-list-hoverBackground); outline: 1px solid var(--vscode-focusBorder); }
    .name { font-weight: 600; }
    .location { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family); }
    a { color: var(--vscode-textLink-foreground); }
  </style>
</head>
<body>
  <h1>Macle Compatibility Report</h1>
  <p>${findings.length} finding(s). Select a finding to open its source location.</p>
  ${empty}
  <ul>${rows}</ul>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.finding').forEach((button) => {
      button.addEventListener('click', () => vscode.postMessage({ type: 'open', index: Number(button.dataset.index) }));
    });
  </script>
</body>
</html>`;
}

function safeReferenceUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export async function openCompatibilityReport(
  context: vscode.ExtensionContext,
  projectRoot: string,
  outputDir: string
): Promise<void> {
  let payload: ReportPayload | undefined;
  try {
    payload = readReport(outputDir);
  } catch (error) {
    void vscode.window.showErrorMessage(`Could not read the Macle report: ${String(error)}`);
    return;
  }
  if (!payload) {
    void vscode.window.showInformationMessage(
      'No Macle compatibility report found. Build the project first.'
    );
    return;
  }

  const findings = getFindings(payload);
  const panel = vscode.window.createWebviewPanel(
    'macleCompatibilityReport',
    'Macle Compatibility Report',
    vscode.ViewColumn.One,
    { enableScripts: true, localResourceRoots: [context.extensionUri] }
  );
  const nonce = randomBytes(24).toString('base64');
  panel.webview.html = renderReport(findings, nonce);
  panel.webview.onDidReceiveMessage(async (message: unknown) => {
    if (
      message === null ||
      typeof message !== 'object' ||
      (message as { type?: unknown }).type !== 'open' ||
      !Number.isInteger((message as { index?: unknown }).index)
    ) {
      return;
    }
    const finding = findings[(message as { index: number }).index];
    if (!finding) return;
    const location = resolveFindingPosition(finding, projectRoot, outputDir);
    if (!location) {
      void vscode.window.showWarningMessage(`Could not map ${finding.fileName} to a source file.`);
      return;
    }
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(location.filePath));
    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    const position = new vscode.Position(Math.min(location.line, document.lineCount - 1), 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  });
}
