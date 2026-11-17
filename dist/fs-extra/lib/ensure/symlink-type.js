'use strict';

const fs = require('../graceful-fs');

function symlinkType(scp, tpVal, callback) {
  let cb = callback;
  let tp = tpVal;
  cb = (typeof tp === 'function') ? tp : cb;
  tp = (typeof tp === 'function') ? false : tp;
  if (tp) {
    return cb(null, tp);
  }
  fs.lstat(scp, (err, stats) => {
    if (err) {
      return cb(null, 'file');
    }
    tp = (stats && stats.isDirectory()) ? 'dir' : 'file';
    return cb(null, tp);
  });
  return undefined;
}

function symlinkTypeSync(scp, tp) {
  let stats;

  if (tp) {
    return tp;
  }
  try {
    stats = fs.lstatSync(scp);
  } catch {
    return 'file';
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file';
}

module.exports = {
  symlinkType,
  symlinkTypeSync,
};
