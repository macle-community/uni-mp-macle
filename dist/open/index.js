const path = require('path');
const childProcess = require('child_process');
const {promises: fs, constants: fsConstants} = require('fs');
const defineLazyProperty = require('./define-lazy-prop');

const localXdgOpenPath = path.join(__dirname, 'xdg-open');

const {platform, arch} = process;

const isWs = false;
const isDocker = false;

const getWslDrivesMountPoint = (() => {
  let mountP;
  const defaultMountPoint = '/mnt/';
  return async function() {
    if (mountP) {
      return mountP;
    }
    let isConfigFileExists = false;
    const conFilePath = '/etc/wsl.conf';
    try {
      await fs.access(conFilePath, fsConstants.F_OK);
      isConfigFileExists = true;
    } catch {
    }
    if (!isConfigFileExists) {
      return defaultMountPoint;
    }

    const configContent = await fs.readFile(conFilePath, {encoding: 'utf8'});
    const configPoint = /(?<!#.*)root\s*=\s*(?<mountP>.*)/g.exec(configContent);
    if (!configPoint) {
      return defaultMountPoint;
    }
    mountP = configPoint.groups.mountP.trim();
    mountP = mountP.endsWith('/') ? mountP : `${mountP}/`;

    return mountP;
  };
})();

const open = (target, opt) => {
  if (typeof target !== 'string') {
    throw new TypeError('Expected a `target`');
  }
  return baseOpen({
    ...opt,
    target,
  });
};

const pTryEach = async(arr, mapper) => {
  let latestError;
  for (const item of arr) {
    try {
      return await mapper(item);
    } catch (err) {
      latestError = err;
    }
  }
  throw latestError;
};

const baseOpen = async options => {
  let opt = options;
  opt = {
    wait: false,
    background: false,
    newInstance: false,
    allowNonzeroExitCode: false,
    ...opt,
  };

  if (Array.isArray(opt.app)) {
    return pTryEach(opt.app, singleApp =>
        baseOpen({
          ...opt,
          app: singleApp,
        }),
    );
  }

  let {name: app, arguments: appArguments = []} = opt.app || {};
  appArguments = [...appArguments];

  if (Array.isArray(app)) {
    return pTryEach(app, appN =>
        baseOpen({
          ...opt,
          app: {
            name: appN,
            arguments: appArguments,
          },
        }),
    );
  }

  let command;
  const cliArgs = [];
  const childProcessOptions = {};

  if (platform === 'darwin') {
    command = 'open';
    if (opt.wait) {
      cliArgs.push('--wait-apps');
    }
    if (opt.background) {
      cliArgs.push('--background');
    }
    if (opt.newInstance) {
      cliArgs.push('--new');
    }
    if (app) {
      cliArgs.push('-a', app);
    }
  } else if (platform === 'win32' || (isWs && !isDocker && !app)) {
    const mountP = await getWslDrivesMountPoint();

    command = isWs
        ? `${mountP}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`
        : `${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;
    cliArgs.push('-NoProfile', '-NonInteractive', '–ExecutionPolicy', 'Bypass',
        '-EncodedCommand');
    if (!isWs) {
      childProcessOptions.windowsVerbatimArguments = true;
    }

    const encodedArguments = ['Start'];

    if (opt.wait) {
      encodedArguments.push('-Wait');
    }
    if (app) {
      encodedArguments.push(`"\`"${app}\`""`, '-ArgumentList');
      if (opt.target) {
        appArguments.unshift(opt.target);
      }
    } else if (opt.target) {
      encodedArguments.push(`"${opt.target}"`);
    }
    if (appArguments.length > 0) {
      appArguments = appArguments.map(arg => `"\`"${arg}\`""`);
      encodedArguments.push(appArguments.join(','));
    }

    opt.target = Buffer.from(encodedArguments.join(' '), 'utf16le').
        toString('base64');
  } else {
    if (app) {
      command = app;
    } else {
      const isBundled = !__dirname || __dirname === '/';
      let exeLolXdgOpen = false;
      try {
        await fs.access(localXdgOpenPath, fsConstants.X_OK);
        exeLolXdgOpen = true;
      } catch {
      }
      const useSystemXdgOpen = process.versions.electron || platform ===
          'android' || isBundled || !exeLolXdgOpen;
      command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
    }
    if (appArguments.length > 0) {
      cliArgs.push(...appArguments);
    }
    if (!opt.wait) {
      childProcessOptions.stdio = 'ignore';
      childProcessOptions.detached = true;
    }
  }

  if (opt.target) {
    cliArgs.push(opt.target);
  }

  if (platform === 'darwin' && appArguments.length > 0) {
    cliArgs.push('--args', ...appArguments);
  }

  const subprocess = childProcess.spawn(command, cliArgs, childProcessOptions);

  if (opt.wait) {
    return new Promise((resolve, reject) => {
      subprocess.once('error', reject);
      subprocess.once('close', exitCode => {
        if (!opt.allowNonzeroExitCode && exitCode > 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }

        resolve(subprocess);
      });
    });
  }
  subprocess.unref();
  return subprocess;
};

function detectArchBinary(bin) {
  if (typeof bin === 'string' || Array.isArray(bin)) {
    return bin;
  }
  const {[arch]: archBinary} = bin;
  if (!archBinary) {
    throw new Error(`${arch} is not supported`);
  }
  return archBinary;
}

const openApp = (name, opt) => {
  if (typeof name !== 'string') {
    throw new TypeError('Expected a `name`');
  }
  const {arguments: appArguments = []} = opt || {};
  if (appArguments !== undefined && appArguments !== null &&
      !Array.isArray(appArguments)) {
    throw new TypeError('Expected `appArguments` as Array type');
  }
  return baseOpen({
    ...opt,
    app: {
      name,
      arguments: appArguments,
    },
  });
};

function detectPlatformBin({[platform]: platformBin}, {wsl}) {
  if (wsl && isWs) {
    return detectArchBinary(wsl);
  }
  if (!platformBin) {
    throw new Error(`${platform} is not supported`);
  }
  return detectArchBinary(platformBin);
}

const apps = {};

defineLazyProperty(apps, 'firefox', () =>
    detectPlatformBin(
        {
          darwin: 'firefox',
          win32: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
          linux: 'firefox',
        },
        {
          wsl: '/mnt/c/Program Files/Mozilla Firefox/firefox.exe',
        },
    ),
);

defineLazyProperty(apps, 'chrome', () =>
    detectPlatformBin(
        {
          darwin: 'google chrome',
          win32: 'chrome',
          linux: ['google-chrome', 'chromium', 'google-chrome-stable'],
        },
        {
          wsl: {
            ia32: '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
            x64: [
              '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
              '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
            ],
          },
        },
    ),
);

defineLazyProperty(apps, 'edge', () =>
    detectPlatformBin(
        {
          darwin: 'microsoft edge',
          win32: 'msedge',
          linux: ['microsoft-edge', 'microsoft-edge-dev'],
        },
        {
          wsl: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        },
    ),
);

open.openApp = openApp;
open.apps = apps;

module.exports = open;
