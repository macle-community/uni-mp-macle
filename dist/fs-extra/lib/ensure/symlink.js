'use strict';

const u = require('../universalify').fromCallback;
const path = require('path');
const fs = require('../fs');
const _mkdirs = require('../mkdirs');
const mkdirs = _mkdirs.mkdirs;
const mkdirsSync = _mkdirs.mkdirsSync;

const _symlinkPaths = require('./symlink-paths');
const symlinkPaths = _symlinkPaths.symlinkPaths;
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;

const _symlinkType = require('./symlink-type');
const symlinkType = _symlinkType.symlinkType;
const symlinkTypeSync = _symlinkType.symlinkTypeSync;

const pathExists = require('../path-exists').pathExists;

const {areIdentical} = require('../util/stat');

function createSymlink(scpVal, dstp, tpeVal, callback) {
  let cb = callback;
  let scp = scpVal;
  let tpe = tpeVal;
  cb = (typeof tpe === 'function') ? tpe : cb;
  tpe = (typeof tpe === 'function') ? false : tpe;

  fs.lstat(dstp, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs.stat(scp),
        fs.stat(dstp),
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) {
          cb(null);
          return;
        }
        _createSymlink(scp, dstp, tpe, cb);
      });
    } else {
      _createSymlink(scp, dstp, tpe, cb);
    }
  });
}

function _createSymlink(scpVal, dstp, tpe, cb) {
  let scp = scpVal;
  symlinkPaths(scp, dstp, (err, relative) => {
    if (err) {
      return cb(err);
    }
    scp = relative.toDst;
    symlinkType(relative.toCwd, tpe, (errTmp, type) => {
      if (errTmp) {
        return cb(errTmp);
      }
      const dir = path.dirname(dstp);
      pathExists(dir, (errTmpParam, dirExists) => {
        if (errTmpParam) {
          return cb(errTmpParam);
        }
        if (dirExists) {
          return fs.symlink(scp, dstp, type, cb);
        }
        mkdirs(dir, errParam => {
          if (errParam) {
            return cb(errParam);
          }
          return fs.symlink(scp, dstp, type, cb);
        });
        return undefined;
      });
      return undefined;
    });
    return undefined;
  });
}

function createSymlinkSync(scpVal, dstp, tpeVal) {
  let scp = scpVal;
  let tpe = tpeVal;
  let stats;
  try {
    stats = fs.lstatSync(dstp);
  } catch {
  }
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs.statSync(scp);
    const dstStat = fs.statSync(dstp);
    if (areIdentical(srcStat, dstStat)) {
      return;
    }
  }

  const relative = symlinkPathsSync(scp, dstp);
  scp = relative.toDst;
  tpe = symlinkTypeSync(relative.toCwd, tpe);
  const dir = path.dirname(dstp);
  const exists = fs.existsSync(dir);
  if (exists) {
    fs.symlinkSync(scp, dstp, tpe);
    return;
  }
  mkdirsSync(dir);
  fs.symlinkSync(scp, dstp, tpe);
}

module.exports = {
  createSymlink: u(createSymlink),
  createSymlinkSync,
};
