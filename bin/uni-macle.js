#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const isBuild = args.includes('build');
const uniArgs = isBuild ? ['build', '-p', 'mp-weixin'] : ['-p', 'mp-weixin'];

const env = {
  ...process.env,
  UNI_PLATFORM: 'mp-weixin',
  UNI_CUSTOM_PLATFORM: 'mp-macle',
  NODE_ENV: isBuild ? 'production' : 'development',
};

const uniBin = path.resolve(process.cwd(), 'node_modules/.bin/uni');
const child = spawn(uniBin, uniArgs, {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
