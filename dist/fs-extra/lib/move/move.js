const fs = require('../graceful-fs');
const path = require('path');
const {copy} = require('../copy');
const {remove} = require('../remove');
const {mkdirp} = require('../mkdirs');
const {pathExists} = require('../path-exists');
const stat = require('../util/stat');

function move(sc, dst, options, cbaVal) {
  let cba = cbaVal;
  let ops = options;
  if (typeof ops === 'function') {
    cba = ops;
    ops = {};
  }

  ops = ops || {};

  const overwrite = ops.overwrite || ops.clobber || false;

  stat.checkPaths(sc, dst, 'move', ops, (error, sta) => {
    if (error) {
      return cba(error);
    }
    const {srcStat, isChangingCase = false} = sta;
    stat.checkParentPaths(sc, srcStat, dst, 'move', errVal => {
      if (errVal) {
        return cba(errVal);
      }
      if (isParentRoot(dst)) {
        return doRename(sc, dst, overwrite, isChangingCase, cba);
      }
      mkdirp(path.dirname(dst), eerr => {
        if (eerr) {
          return cba(eerr);
        }
        return doRename(sc, dst, overwrite, isChangingCase, cba);
      });
      return undefined;
    });
    return undefined;
  });
}

function isParentRoot(dst) {
  const parent = path.dirname(dst);
  const parsedPath = path.parse(parent);
  return parsedPath.root === parent;
}

function doRename(sc, dst, ovte, scgi, cbb) {
  if (scgi) {
    return rename(sc, dst, ovte, cbb);
  }
  if (ovte) {
    return remove(dst, err => {
      if (err) {
        return cbb(err);
      }
      return rename(sc, dst, ovte, cbb);
    });
  }
  pathExists(dst, (eerr, dstE) => {
    if (eerr) {
      return cbb(eerr);
    }
    if (dstE) {
      return cbb(new Error('dest already exists.'));
    }
    return rename(sc, dst, ovte, cbb);
  });
  return undefined;
}

function rename(scc, dst, ovte, cbb) {
  fs.rename(scc, dst, err => {
    if (!err) {
      return cbb();
    }
    if (err.code !== 'EXDEV') {
      return cbb(err);
    }
    return moveAcrossDevice(scc, dst, ovte, cbb);
  });
}

function moveAcrossDevice(sc, dst, ove, cbb) {
  const opts = {
    overwrite: ove,
    errorOnExist: true,
    preserveTimestamps: true,
  };
  copy(sc, dst, opts, err => {
    if (err) {
      return cbb(err);
    }
    return remove(sc, cbb);
  });
}

module.exports = move;
