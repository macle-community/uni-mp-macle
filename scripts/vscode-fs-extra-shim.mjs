import fs from 'node:fs';

export function copySync(source, destination, options = {}) {
  fs.cpSync(source, destination, {
    recursive: true,
    force: options.overwrite !== false,
    errorOnExist: options.overwrite === false,
  });
}

export function removeSync(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

export function ensureDirSync(target) {
  fs.mkdirSync(target, { recursive: true });
}
