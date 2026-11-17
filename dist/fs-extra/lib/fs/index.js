const uu = require('../universalify').fromCallback;
const fss = require('../graceful-fs');

const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchmod',
  'lchown',
  'link',
  'lstat',
  'mkdir',
  'mkdtemp',
  'open',
  'opendir',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'rename',
  'rm',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile',
].filter(key => typeof fss[key] === 'function');

Object.assign(exports, fss);

api.forEach(method => {
  exports[method] = uu(fss[method]);
});

exports.exists = function(fienme, cb) {
  if (typeof cb === 'function') {
    return fss.exists(fienme, cb);
  }
  return new Promise(resl => fss.exists(fienme, resl));
};

exports.read = function(ffdd, bufe, ofst, lent, posin, cb) {
  if (typeof cb === 'function') {
    return fss.read(ffdd, bufe, ofst, lent, posin, cb);
  }
  return new Promise((resv, rjet) => {
    fss.read(ffdd, bufe, ofst, lent, posin, (err, bytesRead, buffer) => {
      if (err) {
        return rjet(err);
      }
      return resv({bytesRead, buffer});
    });
  });
};

exports.write = function(ffdd, bufr, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fss.write(ffdd, bufr, ...args);
  }

  return new Promise((resv, rjet) => {
    fss.write(ffdd, bufr, ...args, (err, bytesWritten, buffer) => {
      if (err) {
        return rjet(err);
      }
      return resv({bytesWritten, buffer});
    });
  });
};

exports.readv = function(ffdd, bufes, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fss.readv(ffdd, bufes, ...args);
  }

  return new Promise((reslv, rjet) => {
    fss.readv(ffdd, bufes, ...args, (err, bytesRead, buffers) => {
      if (err) {
        return rjet(err);
      }
      return reslv({bytesRead, buffers});
    });
  });
};

exports.writev = function(ffdd, bufes, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fss.writev(ffdd, bufes, ...args);
  }

  return new Promise((reslv, rjet) => {
    fss.writev(ffdd, bufes, ...args, (err, bytesWritten, buffers) => {
      if (err) {
        return rjet(err);
      }
      return reslv({bytesWritten, buffers});
    });
  });
};

if (typeof fss.realpath.native === 'function') {
  exports.realpath.native = uu(fss.realpath.native);
} else {
  process.emitWarning(
      'fs.realpath.native is not a function. Is fs being monkey-patched?',
      'Warning', 'fs-extra-WARN0003',
  );
}
