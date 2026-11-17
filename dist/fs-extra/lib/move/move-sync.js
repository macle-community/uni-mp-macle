const fs = require('../graceful-fs');
const path = require('path');
const {copySync} = require('../copy');
const {removeSync} = require('../remove');
const {mkdirpSync} = require('../mkdirs');
const stat = require('../util/stat');

function moveSync(sc, dst, options) {
  let ops = options;
  ops = ops || {};
  const overwrite = ops.overwrite || ops.clobber || false;

  const {srcStat, isChangingCase = false} = stat.checkPathsSync(sc, dst, 'move',
      ops);
  stat.checkParentPathsSync(sc, srcStat, dst, 'move');
  if (!isParentRoot(dst)) {
    mkdirpSync(path.dirname(dst));
  }
  return doRename(sc, dst, overwrite, isChangingCase);
}

function isParentRoot(dst) {
  const parent = path.dirname(dst);
  const parsedPath = path.parse(parent);
  return parsedPath.root === parent;
}

function doRename(scc, dst, ovwr, iChan) {
  if (iChan) {
    return rename(scc, dst, ovwr);
  }
  if (ovwr) {
    removeSync(dst);
    return rename(scc, dst, ovwr);
  }
  if (fs.existsSync(dst)) {
    throw new Error('dest already exists.');
  }
  return rename(scc, dst, ovwr);
}

function rename(sc, dst, ovrt) {
  try {
    fs.renameSync(sc, dst);
  } catch (err) {
    if (err.code !== 'EXDEV') {
      throw err;
    }
    moveAcrossDevice(sc, dst, ovrt);
  }
}

function moveAcrossDevice(sc, dst, aa) {
  const opts = {
    overwrite: aa,
    errorOnExist: true,
    preserveTimestamps: true,
  };
  copySync(sc, dst, opts);
  return removeSync(sc);
}

module.exports = moveSync;
