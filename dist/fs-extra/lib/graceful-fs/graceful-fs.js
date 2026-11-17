const fs = require('fs');
const polyfills = require('./polyfills.js');
const legacy = require('./legacy-streams.js');
const clone = require('./clone.js');

const util = require('util');

let gracefulQ;
let previousSb;

if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQ = Symbol.for('graceful-fs.queue');
  previousSb = Symbol.for('graceful-fs.previous');
} else {
  gracefulQ = '___graceful-fs.queue';
  previousSb = '___graceful-fs.previous';
}

function noop() {}

function publishQueue(ctx, q) {
  Object.defineProperty(ctx, gracefulQ, {
    get: function () {
      return q;
    }
  });
}

let debug = noop;
if (util.debuglog) {
  debug = util.debuglog('gfs4');
} else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  debug = function (...args) {
    const msg = util.format.apply(util, args);
    msg = `GFS4: ${msg.split(/\n/).join('\nGFS4: ')}`;
  };
}

if (!fs[gracefulQ]) {
  const queue = global[gracefulQ] || [];
  publishQueue(fs, queue);

  fs.close = (function (fsClose) {
    function close(fileDescriptor, callback) {
      return fsClose.call(fs, fileDescriptor, function (err, ...args) {
        if (!err) {
          resetQueue();
        }
        if (typeof callback === 'function') {
          callback.apply(this, args);
        }
      });
    }
    Object.defineProperty(close, previousSb, {
      value: fsClose
    });
    return close;
  })(fs.close);

  fs.closeSync = (function (fsCloseSync) {
    function closeSync(fileDescriptor, ...args) {
      fsCloseSync.apply(fs, [fileDescriptor, ...args]);
      resetQueue();
    }
    Object.defineProperty(closeSync, previousSb, {
      value: fsCloseSync
    });
    return closeSync;
  })(fs.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', () => {
      debug(fs[gracefulQ]);
      require('assert').equal(fs[gracefulQ].length, 0);
    });
  }
}

if (!global[gracefulQ]) {
  publishQueue(global, fs[gracefulQ]);
}

module.exports = patch(clone(fs));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
  module.exports = patch(fs);
  fs.__patched = true;
}

function patch(fsModule) {
  polyfills(fsModule);
  fsModule.gracefulify = patch;

  fsModule.createReadStream = createReadStream;
  fsModule.createWriteStream = createWriteStream;
  const fs$readFile = fsModule.readFile;
  fsModule.readFile = readFile;
  function readFile(filePath, fileOptions, callback) {
    let cb = callback;
    let options = fileOptions;
    if (typeof fileOptions === 'function') {
      cb = fileOptions;
      options = null;
    }
    return goReadFile(filePath, options, cb);
    function goReadFile(fp, fo, cbFunc, startTime) {
      return fs$readFile(fp, fo, function (err, ...args) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([goReadFile, [fp, fo, cbFunc], err, startTime || Date.now(), Date.now()]);
        } else {
          if (typeof cbFunc === 'function') {
            cbFunc.apply(this, args);
          }
        }
      });
    }
  }

  const fs$writeFile = fsModule.writeFile;
  fsModule.writeFile = writeFile;
  function writeFile(filePath, fileData, fileOptions, callback) {
    let cb = callback;
    let options = fileOptions;
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }
    return goWriteFile(filePath, fileData, options, cb);
    function goWriteFile(fp, fd, fo, cbFunc, startTime) {
      return fs$writeFile(fp, fd, fo, function (err, ...args) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([
            goWriteFile,
            [fp, fd, fo, cbFunc],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        } else {
          if (typeof cbFunc === 'function') {
            cbFunc.apply(this, args);
          }
        }
      });
    }
  }

  const fs$appendFile = fsModule.appendFile;
  if (fs$appendFile) {
    fsModule.appendFile = appendFile;
  }
  function appendFile(filePath, fileData, fileOptions, callback) {
    let cb = callback;
    let options = fileOptions;
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }
    return goAppendFile(filePath, fileData, options, cb);
    function goAppendFile(fp, fd, fo, cbFunc, startTime) {
      return fsAppendFile(fp, fd, fo, function (err, ...args) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([
            goAppendFile,
            [fp, fd, fo, cbFunc],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        } else {
          if (typeof cbFunc === 'function') {
            cbFunc.apply(this, args);
          }
        }
      });
    }
  }

  const fs$copyFile = fsModule.copyFile;
  if (fs$copyFile) {
    fsModule.copyFile = copyFile;
  }
  function copyFile(source, destination, flags, callback) {
    let cb = callback;
    let fileFlags = flags;
    if (typeof fileFlags === 'function') {
      cb = fileFlags;
      fileFlags = 0;
    }
    return goCopyFile(source, destination, fileFlags, cb);

    function goCopyFile(src, dst, fl, cbFunc, startTime) {
      return fs$copyFile(src, dst, fl, function (err, ...args) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([goCopyFile, [src, dst, fl, cbFunc], err, startTime || Date.now(), Date.now()]);
        } else {
          if (typeof cbFunc === 'function') {
            cbFunc.apply(this, args);
          }
        }
      });
    }
  }

  const fs$readdir = fsModule.readdir;
  fsModule.readdir = readdir;
  const noReaddirOptionVersions = /^v[0-5]\./;
  function readdir(filePath, fileOptions, callback) {
    let cb = callback;
    let options = fileOptions;
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }
    const goReaddir = noReaddirOptionVersions.test(process.version)
      ? function goReaddir(fp, fo, cback, startTime) {
          return fs$readdir(fp, fsReaddirCallback(fp, fo, cback, startTime));
        }
      : function goReaddir(fp, fo, cback, startTime) {
          return fs$readdir(fp, fo, fsReaddirCallback(fp, fo, cback, startTime));
        };
    return goReaddir(filePath, fileOptions, cb);
    function fsReaddirCallback(fp, fo, cback, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) {
          enqueue([goReaddir, [fp, fo, cback], err, startTime || Date.now(), Date.now()]);
        } else {
          if (files && files.sort) {
            files.sort();
          }
          if (typeof cback === 'function') {
            cback.call(this, err, files);
          }
        }
      };
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    const legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  const fs$ReadStream = fsModule.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = readStreamOpen;
  }

  const fs$WriteStream = fsModule.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = writeStreamOpen;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream;
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream;
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  const FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream;
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  const FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream;
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream(filePath, fileOptions, ...args) {
    if (this instanceof ReadStream) {
      return (fsReadStream.apply(this, [filePath, fileOptions, ...args]), this);
    } else {
      return ReadStream.apply(Object.create(ReadStream.prototype), [filePath, fileOptions, ...args]);
    }
  }

  function readStreamOpen() {
    const that = this;
    open(that.path, that.flags, that.mode, (error, fileDescriptor) => {
      if (error) {
        if (that.autoClose) {
          that.destroy();
        }
        that.emit('error', error);
      } else {
        that.fd = fileDescriptor;
        that.emit('open', fileDescriptor);
        that.read();
      }
    });
  }

  function WriteStream(a, b, ...args) {
    if (this instanceof WriteStream) {
      return (fs$WriteStream.apply(this, [a, b, ...args]), this);
    } else {
      return WriteStream.apply(Object.create(WriteStream.prototype), [a, b, ...args]);
    }
  }

  function writeStreamOpen() {
    const self = this;
    open(self.path, self.flags, self.mode, (error, fileDescriptor) => {
      if (error) {
        self.destroy();
        self.emit('error', error);
      } else {
        self.fd = fileDescriptor;
        self.emit('open', fileDescriptor);
      }
    });
  }

  function createReadStream(a, b) {
    return new fsModule.ReadStream(a, b);
  }

  function createWriteStream(filePath, options) {
    return new fsModule.WriteStream(filePath, options);
  }

  const fs$open = fsModule.open;
  fsModule.open = open;
  function open(filePath, flags, mode, callback) {
    let cb = callback;
    let fileMode = mode;
    if (typeof fileMode === 'function') {
      cb = fileMode;
      fileMode = null;
    }

    return goOpen(filePath, flags, fileMode, cb);

    function goOpen(fp, fl, md, cback, startTime) {
      return fs$open(fp, fl, md, function (error, fileDescriptor, ...args) {
        if (error && (error.code === 'EMFILE' || error.code === 'ENFILE')) {
          enqueue([goOpen, [fp, fl, md, cback], error, startTime || Date.now(), Date.now()]);
        } else {
          if (typeof cback === 'function') {
            cback.apply(this, [error, fileDescriptor, ...args]);
          }
        }
      });
    }
  }

  return fs;
}

function enqueue(element) {
  debug('ENQUEUE', element[0].name, element[1]);
  fs[gracefulQ].push(element);
  retry();
}

let retryTimer;

function resetQueue() {
  const currentTime = Date.now();
  for (let i = 0; i < fs[gracefulQ].length; ++i) {
    if (fs[gracefulQ][i].length > 2) {
      fs[gracefulQ][i][3] = currentTime;
      fs[gracefulQ][i][4] = currentTime;
    }
  }
  retry();
}

function retry() {
  clearTimeout(retryTimer);
  retryTimer = undefined;

  if (fs[gracefulQ].length === 0) {
    return;
  }

  const element = fs[gracefulQ].shift();
  const functionToCall = element[0];
  const argumentsToPass = element[1];
  const error = element[2];
  const startTime = element[3];
  const lastTime = element[4];

  if (startTime === undefined) {
    debug('RETRY', functionToCall.name, argumentsToPass);
    functionToCall.apply(null, argumentsToPass);
  } else if (Date.now() - startTime >= 60000) {
    debug('TIMEOUT', functionToCall.name, argumentsToPass);
    const callback = argumentsToPass.pop();
    if (typeof callback === 'function') {
      callback.call(null, error);
    }
  } else {
    const timeSinceLastAttempt = Date.now() - lastTime;
    const timeSinceStart = Math.max(lastTime - startTime, 1);
    const desiredDelay = Math.min(timeSinceStart * 1.2, 100);

    if (timeSinceLastAttempt >= desiredDelay) {
      debug('RETRY', functionToCall.name, argumentsToPass);
      functionToCall.apply(null, argumentsToPass.concat([startTime]));
    } else {
      fs[gracefulQ].push(element);
    }
  }

  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0);
  }
}
