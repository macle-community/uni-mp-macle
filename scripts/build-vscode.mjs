import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionDir = path.join(rootDir, 'vscode-macle-uni-mp');
const extensionLibDir = path.join(extensionDir, 'lib');

const wasmSource = path.join(
  extensionDir,
  'node_modules',
  'libarchive-wasm',
  'dist',
  'libarchive.wasm'
);
if (fs.existsSync(wasmSource)) {
  fs.mkdirSync(extensionLibDir, { recursive: true });
  fs.copyFileSync(wasmSource, path.join(extensionLibDir, 'libarchive.wasm'));
  fs.copyFileSync(wasmSource, path.join(extensionDir, 'libarchive.wasm'));
}

await build({
  entryPoints: [path.join(extensionDir, 'src', 'extension.ts')],
  outfile: path.join(extensionLibDir, 'extension.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode', '@babel/preset-typescript/package.json'],
});

await build({
  entryPoints: [path.join(rootDir, 'src', 'index.ts')],
  outfile: path.join(extensionLibDir, 'macle-uni-mp.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vite', '@babel/preset-typescript/package.json'],
  plugins: [
    {
      name: 'vscode-fs-extra-shim',
      setup(buildContext) {
        buildContext.onResolve({ filter: /^@macle\/fs-extra$/ }, () => ({
          path: path.join(rootDir, 'scripts', 'vscode-fs-extra-shim.mjs'),
        }));
      },
    },
  ],
});
