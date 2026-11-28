import fs from 'node:fs';
import path from 'node:path';
import { MACLE_UI_LIBRARY_COMPONENTS } from '../../src/component-docs';

interface PageEntry {
  path?: unknown;
  style?: unknown;
}

interface PageReference {
  entry: PageEntry;
  sourcePath: string;
}

interface PagesConfiguration {
  pages?: unknown;
  subPackages?: unknown;
  [key: string]: unknown;
}

interface PageUpdate {
  sourcePath: string;
  components: Record<string, string>;
}

export interface MauiLibraryPlan {
  kind: 'uni-app' | 'pure-macle';
  pagesJsonPath: string;
  outputDirectory: string;
  updates: PageUpdate[];
  missingEntries: string[];
}

export interface MauiCopyResult {
  copiedFiles: number;
  skippedConflicts: number;
  skippedSymlinks: number;
  configuredPages: number;
  missingEntries: string[];
  registrationConflicts: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolveProjectConfig(root: string): { kind: 'uni-app' | 'pure-macle'; filePath: string } | undefined {
  for (const candidate of ['pages.json', 'src/pages.json']) {
    const filePath = path.join(root, candidate);
    if (fs.existsSync(filePath)) return { kind: 'uni-app', filePath };
  }
  const appJsonPath = path.join(root, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    return { kind: 'pure-macle', filePath: appJsonPath };
  }
  return undefined;
}

function isWithin(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function pageEntries(configuration: PagesConfiguration, kind: 'uni-app' | 'pure-macle'): PageReference[] {
  const result: PageReference[] = [];
  if (Array.isArray(configuration.pages)) {
    for (const entry of configuration.pages) {
      if (kind === 'pure-macle' && typeof entry === 'string') {
        result.push({ entry: { path: entry }, sourcePath: entry });
      } else if (isRecord(entry) && typeof entry.path === 'string') {
        result.push({ entry: entry as PageEntry, sourcePath: entry.path });
      }
    }
  }
  const subPackages = configuration.subPackages;
  if (Array.isArray(subPackages)) {
    for (const subPackage of subPackages) {
      if (!isRecord(subPackage) || !Array.isArray(subPackage.pages)) continue;
      const packageRoot = typeof subPackage.root === 'string' ? subPackage.root : '';
      for (const entry of subPackage.pages) {
        if (kind === 'pure-macle' && typeof entry === 'string') {
          result.push({
            entry: { path: entry },
            sourcePath: path.posix.join(packageRoot, entry),
          });
        } else if (isRecord(entry) && typeof entry.path === 'string') {
          result.push({
            entry: entry as PageEntry,
            sourcePath: path.posix.join(packageRoot, entry.path),
          });
        }
      }
    }
  }
  return result;
}

function referencedMauiTags(source: string, isRawMarkup = false): Set<string> {
  const tags = new Set<string>();
  const expression = /<\/?\s*(maui-[a-z][\w-]*)\b/gi;
  if (isRawMarkup) {
    const markup = source
      .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '))
      .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, ' '));
    for (const match of markup.matchAll(expression)) {
      tags.add(match[1].toLowerCase());
    }
    return tags;
  }
  const templates = source.matchAll(/<template\b[^>]*>([\s\S]*?)<\/template\s*>/gi);
  for (const template of templates) {
    const markup = template[1]
      .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '))
      .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, ' '));
    for (const match of markup.matchAll(expression)) {
      tags.add(match[1].toLowerCase());
    }
  }
  return tags;
}

function componentEntryPath(distDirectory: string, tag: string): string | undefined {
  const component = tag.slice('maui-'.length);
  const candidates =
    component === 'row' || component === 'col'
      ? [`${component}/index`, `layout/${component}/index`, 'layout/index']
      : [`${component}/index`];

  for (const candidate of candidates) {
    const basePath = path.resolve(distDirectory, candidate);
    if (!isWithin(distDirectory, basePath)) continue;
    for (const extension of ['', '.js', '.json', '.maml', '.wxml']) {
      if (fs.existsSync(`${basePath}${extension}`)) return candidate;
    }
  }
  return undefined;
}

function componentEntryFile(distDirectory: string, entryPath: string): string | undefined {
  for (const extension of ['', '.js', '.json', '.maml', '.wxml']) {
    const candidate = path.resolve(distDirectory, `${entryPath}${extension}`);
    if (fs.existsSync(candidate) && fs.lstatSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

export function createMauiLibraryPlan(
  projectRoot: string,
  selectedLibraryDirectory: string,
  targetFolder: string
): MauiLibraryPlan {
  const selected = path.resolve(selectedLibraryDirectory);
  const selectedDist = path.basename(selected).toLowerCase() === 'dist'
    ? selected
    : path.join(selected, 'dist');
  if (
    !fs.existsSync(selectedDist) ||
    fs.lstatSync(selectedDist).isSymbolicLink() ||
    !fs.statSync(selectedDist).isDirectory()
  ) {
    throw new Error('The selected folder must contain the MAUI library dist directory (or be dist itself).');
  }

  const normalizedTarget = targetFolder.trim();
  if (
    normalizedTarget.length === 0 ||
    path.isAbsolute(normalizedTarget) ||
    normalizedTarget.split(/[\\/]+/).some((part) => part === '..')
  ) {
    throw new Error('The MAUI target folder must be a non-empty relative path inside the project.');
  }

  const projectConfig = resolveProjectConfig(projectRoot);
  if (!projectConfig) {
    throw new Error('Could not find pages.json (uni-app) or app.json (Pure Macle) in the project.');
  }
  const pagesJsonPath = projectConfig.filePath;
  const configuration: unknown = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf8'));
  if (!isRecord(configuration)) throw new Error(`${path.basename(pagesJsonPath)} must contain a JSON object.`);
  const pagesConfiguration = configuration as PagesConfiguration;
  const configRoot = path.dirname(pagesJsonPath);
  const outputDirectory = path.resolve(projectRoot, normalizedTarget);
  if (
    outputDirectory === path.resolve(projectRoot) ||
    !isWithin(projectRoot, outputDirectory)
  ) {
    throw new Error('The MAUI target folder must be inside the project.');
  }
  if (isWithin(selectedDist, outputDirectory) || isWithin(outputDirectory, selectedDist)) {
    throw new Error('The selected library dist and target folder must not overlap.');
  }

  const entryPaths = new Map<string, string>();
  const missingEntries = new Set<string>();
  const updates: PageUpdate[] = [];

  for (const page of pageEntries(pagesConfiguration, projectConfig.kind)) {
    const pageSourcePath =
      projectConfig.kind === 'pure-macle'
        ? ['.maml', '.wxml']
            .map((ext) => path.resolve(configRoot, `${page.sourcePath}${ext}`))
            .find((candidate) => isWithin(projectRoot, candidate) && fs.existsSync(candidate))
        : path.resolve(configRoot, `${page.sourcePath}.vue`);
    if (!pageSourcePath || !isWithin(projectRoot, pageSourcePath) || !fs.existsSync(pageSourcePath)) continue;

    const usedTags = referencedMauiTags(
      fs.readFileSync(pageSourcePath, 'utf8'),
      projectConfig.kind === 'pure-macle'
    );
    if (usedTags.size === 0) continue;

    const registrations: Record<string, string> = {};
    for (const tag of usedTags) {
      if (!MACLE_UI_LIBRARY_COMPONENTS.includes(tag)) {
        missingEntries.add(tag);
        continue;
      }
      let entryPath = entryPaths.get(tag);
      if (!entryPath) {
        entryPath = componentEntryPath(selectedDist, tag);
        if (entryPath) entryPaths.set(tag, entryPath);
      }
      if (!entryPath) {
        missingEntries.add(tag);
        continue;
      }
      const sourceEntryFile = componentEntryFile(selectedDist, entryPath);
      if (!sourceEntryFile) {
        missingEntries.add(tag);
        continue;
      }
      const targetEntryFile = path.resolve(outputDirectory, path.relative(selectedDist, sourceEntryFile));
      if (
        fs.existsSync(targetEntryFile) &&
        (!fs.lstatSync(targetEntryFile).isFile() ||
          !fs.readFileSync(sourceEntryFile).equals(fs.readFileSync(targetEntryFile)))
      ) {
        missingEntries.add(tag);
        continue;
      }
      registrations[tag] = `/${path.posix.join(
        path.relative(projectRoot, outputDirectory).split(path.sep).join('/'),
        entryPath
      )}`;
    }

    if (Object.keys(registrations).length > 0) {
      updates.push({ sourcePath: page.sourcePath, components: registrations });
    }
  }

  return {
    kind: projectConfig.kind,
    pagesJsonPath,
    outputDirectory,
    updates,
    missingEntries: [...missingEntries].sort(),
  };
}

function copyMissingFiles(
  sourceDirectory: string,
  outputDirectory: string,
  projectRoot: string
): Pick<MauiCopyResult, 'copiedFiles' | 'skippedConflicts' | 'skippedSymlinks'> {
  let copiedFiles = 0;
  let skippedConflicts = 0;
  let skippedSymlinks = 0;
  const pending: Array<[string, string]> = [[sourceDirectory, outputDirectory]];

  while (pending.length > 0) {
    const [source, target] = pending.pop()!;
    ensureDirectory(projectRoot, target);

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      if (entry.isSymbolicLink()) {
        skippedSymlinks++;
      } else if (entry.isDirectory()) {
        pending.push([sourcePath, targetPath]);
      } else if (entry.isFile()) {
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
          copiedFiles++;
        } else if (
          !fs.statSync(targetPath).isFile() ||
          !fs.readFileSync(sourcePath).equals(fs.readFileSync(targetPath))
        ) {
          skippedConflicts++;
        }
      }
    }
  }

  return { copiedFiles, skippedConflicts, skippedSymlinks };
}

function ensureDirectory(projectRoot: string, directory: string): void {
  const relative = path.relative(projectRoot, directory);
  if (!isWithin(projectRoot, directory)) {
    throw new Error(`Refusing to copy MAUI files outside the project: ${directory}`);
  }
  let current = projectRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (fs.existsSync(current)) {
      const stats = fs.lstatSync(current);
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw new Error(`MAUI target path contains a non-directory or symbolic link: ${current}`);
      }
    } else {
      fs.mkdirSync(current);
    }
  }
}

function writeJsonAtomically(filePath: string, value: unknown): void {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    throw error;
  }
}

export function installMauiLibrary(
  projectRoot: string,
  selectedLibraryDirectory: string,
  targetFolder: string
): MauiCopyResult {
  const plan = createMauiLibraryPlan(projectRoot, selectedLibraryDirectory, targetFolder);
  const selected = path.resolve(selectedLibraryDirectory);
  const sourceDist =
    path.basename(selected).toLowerCase() === 'dist' ? selected : path.join(selected, 'dist');
  const copied = copyMissingFiles(sourceDist, plan.outputDirectory, projectRoot);

  const registrationConflicts = new Set<string>();
  if (plan.kind === 'pure-macle') {
    const configRoot = path.dirname(plan.pagesJsonPath);
    for (const update of plan.updates) {
      const pageJsonPath = path.resolve(configRoot, `${update.sourcePath}.json`);
      if (!isWithin(projectRoot, pageJsonPath)) continue;
      let pageJson: Record<string, unknown> = {};
      if (fs.existsSync(pageJsonPath)) {
        const parsed: unknown = JSON.parse(fs.readFileSync(pageJsonPath, 'utf8'));
        if (!isRecord(parsed)) {
          throw new Error(`${path.relative(projectRoot, pageJsonPath)} must contain a JSON object.`);
        }
        pageJson = parsed;
      }
      const usingComponents = isRecord(pageJson.usingComponents) ? pageJson.usingComponents : {};
      let changed = false;
      for (const [name, componentPath] of Object.entries(update.components)) {
        if (usingComponents[name] === undefined) {
          usingComponents[name] = componentPath;
          changed = true;
        } else if (usingComponents[name] !== componentPath) {
          registrationConflicts.add(name);
        }
      }
      if (changed) {
        pageJson.usingComponents = usingComponents;
        ensureDirectory(projectRoot, path.dirname(pageJsonPath));
        writeJsonAtomically(pageJsonPath, pageJson);
      }
    }
    return {
      ...copied,
      configuredPages: plan.updates.length,
      missingEntries: plan.missingEntries,
      registrationConflicts: [...registrationConflicts].sort(),
    };
  }

  const configuration: unknown = JSON.parse(fs.readFileSync(plan.pagesJsonPath, 'utf8'));
  if (!isRecord(configuration)) throw new Error('pages.json changed and is no longer a JSON object.');

  const updatesByPath = new Map(plan.updates.map((update) => [update.sourcePath, update]));
  let configurationChanged = false;
  for (const page of pageEntries(configuration as PagesConfiguration, plan.kind)) {
    const update = updatesByPath.get(page.sourcePath);
    if (!update) continue;
    const entry = page.entry;
    const style = isRecord(entry.style) ? entry.style : {};
    const usingComponents = isRecord(style.usingComponents) ? style.usingComponents : {};
    for (const [name, componentPath] of Object.entries(update.components)) {
      if (usingComponents[name] === undefined) {
        usingComponents[name] = componentPath;
        configurationChanged = true;
      } else if (usingComponents[name] !== componentPath) {
        registrationConflicts.add(name);
      }
    }
    if (Object.keys(usingComponents).length > 0) {
      if (style.usingComponents !== usingComponents || entry.style !== style) {
        configurationChanged = true;
      }
      style.usingComponents = usingComponents;
      entry.style = style;
    }
  }

  if (configurationChanged) writeJsonAtomically(plan.pagesJsonPath, configuration);
  return {
    ...copied,
    configuredPages: plan.updates.length,
    missingEntries: plan.missingEntries,
    registrationConflicts: [...registrationConflicts].sort(),
  };
}
