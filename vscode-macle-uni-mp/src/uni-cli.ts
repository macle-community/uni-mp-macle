import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

export interface UniCli {
  command: string;
  argsPrefix: string[];
  shell: boolean;
}

export function resolveUniCli(projectRoot: string): UniCli | undefined {
  const commandName = process.platform === 'win32' ? 'uni.cmd' : 'uni';
  const localCommand = path.join(projectRoot, 'node_modules', '.bin', commandName);
  if (fs.existsSync(localCommand)) {
    return {
      command: localCommand,
      argsPrefix: [],
      shell: process.platform === 'win32',
    };
  }

  try {
    const projectRequire = createRequire(path.join(projectRoot, 'package.json'));
    const cliScript = projectRequire.resolve('@dcloudio/vite-plugin-uni/bin/uni.js');
    return {
      command: process.execPath,
      argsPrefix: [cliScript],
      shell: false,
    };
  } catch {
    return undefined;
  }
}
