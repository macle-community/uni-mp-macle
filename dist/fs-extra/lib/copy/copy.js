const fs = require('../graceful-fs');
const path = require('path');
const {mkdirs} = require('../mkdirs');
const {pathExists} = require('../path-exists');
const {utimesMillis} = require('../util/utimes');
const stat = require('../util/stat');

function copy(sc, det, options, cbaVal) {
  let ops = options;
  let cba = cbaVal;
  if (typeof ops === 'function' && !cba) {
    cba = ops;
    ops = {};
  } else if (typeof ops === 'function') {
    ops = {filter: ops};
  }

  cba = cba || function() {
  };
  ops = ops || {};

  ops.clobber = 'clobber' in ops ? !!ops.clobber : true;
  ops.overwrite = 'overwrite' in ops ? !!ops.overwrite : ops.clobber;

  if (ops.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
        'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n',
    );
  }

  stat.checkPaths(sc, det, 'copy', ops, (err, stats) => {
    if (err) {
      return cba(err);
    }
    const {srcStat, destStat} = stats;
    stat.checkParentPaths(sc, srcStat, det, 'copy', errFunc => {
      if (errFunc) {
        return cba(errFunc);
      }
      runFilter(sc, det, ops, (errParam, include) => {
        if (errParam) {
          return cba(errParam);
        }
        if (!include) {
          return cba();
        }

        return checkParentDir(destStat, sc, det, ops, cba);
      });
      return undefined;
    });
    return undefined;
  });
}

function checkParentDir(detSt, sc, det, ops, cba) {
  const destParent = path.dirname(det);
  pathExists(destParent, (err, dirExists) => {
    if (err) {
      return cba(err);
    }
    if (dirExists) {
      return getStats(detSt, sc, det, ops, cba);
    }
    mkdirs(destParent, errParam => {
      if (errParam) {
        return cba(errParam);
      }
      return getStats(detSt, sc, det, ops, cba);
    });
    return undefined;
  });
}

function runFilter(sc, det, ops, cba) {
  if (!ops.filter) {
    cba(null, true);
    return;
  }
  Promise.resolve(ops.filter(sc, det)).
      then(include => cba(null, include), error => cba(error));
}

function getStats(detSt, sc, det, ops, cba) {
  const statTmp = ops.dereference ? fs.stat : fs.lstat;
  statTmp(sc, (err, srcStat) => {
    if (err) {
      return cba(err);
    }

    if (srcStat.isDirectory()) {
      return onDir(srcStat, detSt, sc, det, ops, cba);
    } else if (srcStat.isFile() ||
        srcStat.isCharacterDevice() ||
        srcStat.isBlockDevice()) {
      return onFile(srcStat, detSt, sc, det, ops, cba);
    } else if (srcStat.isSymbolicLink()) {
      return onLink(detSt, sc, det, ops, cba);
    } else if (srcStat.isSocket()) {
      return cba(new Error(`Cannot copy a socket file: ${sc}`));
    } else if (srcStat.isFIFO()) {
      return cba(new Error(`Cannot copy a FIFO pipe: ${sc}`));
    } else {}
    return cba(new Error(`Unknown file: ${sc}`));
  });
}

function onFile(scSt, detSt, sc, det, ops, cba) {
  if (!detSt) {
    return copyFile(scSt, sc, det, ops, cba);
  }
  return mayCopyFile(scSt, sc, det, ops, cba);
}

function mayCopyFile(scSt, sc, det, ops, cba) {
  if (ops.overwrite) {
    fs.unlink(det, err => {
      if (err) {
        return cba(err);
      }
      return copyFile(scSt, sc, det, ops, cba);
    });
  } else if (ops.errorOnExist) {
    return cba(new Error(`'${det}' already exists`));
  } else {
    return cba();
  }
  return undefined;
}

function copyFile(scSt, sc, det, ops, cba) {
  fs.copyFile(sc, det, err => {
    if (err) {
      return cba(err);
    }
    if (ops.preserveTimestamps) {
      return handleTimestampsAndMode(scSt.mode, sc, det, cba);
    }
    return setDestMode(det, scSt.mode, cba);
  });
}

function handleTimestampsAndMode(scm, sc, det, cba) {

  if (fileIsNotWritable(scm)) {
    return makeFileWritable(det, scm, err => {
      if (err) {
        return cba(err);
      }
      return setDestTimestampsAndMode(scm, sc, det, cba);
    });
  }
  return setDestTimestampsAndMode(scm, sc, det, cba);
}

function fileIsNotWritable(scm) {
  return (scm & 0o200) === 0;
}

function makeFileWritable(det, scm, cba) {
  return setDestMode(det, scm | 0o200, cba);
}

function setDestTimestampsAndMode(scm, sc, det, cba) {
  setDestTimestamps(sc, det, err => {
    if (err) {
      return cba(err);
    }
    return setDestMode(det, scm, cba);
  });
}

function setDestMode(det, scm, cba) {
  return fs.chmod(det, scm, cba);
}

function setDestTimestamps(sc, det, cba) {
  fs.stat(sc, (err, updatedSrcStat) => {
    if (err) {
      return cba(err);
    }
    return utimesMillis(det, updatedSrcStat.atime, updatedSrcStat.mtime, cba);
  });
}

function onDir(scSt, detSt, sc, det, ops, cba) {
  if (!detSt) {
    return mkDirAndCopy(scSt.mode, sc, det, ops, cba);
  }
  return copyDir(sc, det, ops, cba);
}

function mkDirAndCopy(scm, sc, det, ops, cba) {
  fs.mkdir(det, err => {
    if (err) {
      return cba(err);
    }
    copyDir(sc, det, ops, errParam => {
      if (errParam) {
        return cba(errParam);
      }
      return setDestMode(det, scm, cba);
    });
    return undefined;
  });
  return undefined;
}

function copyDir(sc, det, ops, cba) {
  fs.readdir(sc, (err, items) => {
    if (err) {
      return cba(err);
    }
    return copyDirItems(items, sc, det, ops, cba);
  });
}

function copyDirItems(its, sc, det, ops, cba) {
  const item = its.pop();
  if (!item) {
    return cba();
  }
  return copyDirItem(its, item, sc, det, ops, cba);
}

function copyDirItem(its, ite, sc, det, ops, cnba) {
  const srcItem = path.join(sc, ite);
  const destItem = path.join(det, ite);
  runFilter(srcItem, destItem, ops, (err, include) => {
    if (err) {
      return cnba(err);
    }
    if (!include) {
      return copyDirItems(its, sc, det, ops, cnba);
    }

    stat.checkPaths(srcItem, destItem, 'copy', ops, (errParam, stats) => {
      if (errParam) {
        return cnba(errParam);
      }
      const {destStat} = stats;
      getStats(destStat, srcItem, destItem, ops, errFunc => {
        if (errFunc) {
          return cnba(errFunc);
        }
        return copyDirItems(its, sc, det, ops, cnba);
      });
      return undefined;
    });
    return undefined;
  });
}

function onLink(detSt, sc, det, ops, cba) {
  fs.readlink(sc, (err, resolvedSrcVal) => {
    let resolvedSrc = resolvedSrcVal;
    if (err) {
      return cba(err);
    }
    if (ops.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
    }

    if (!detSt) {
      return fs.symlink(resolvedSrc, det, cba);
    } else {
      fs.readlink(det, (errParam, resolvedDestVal) => {
        let resolvedDest = resolvedDestVal;
        if (errParam) {
          if (errParam.code === 'EINVAL' || errParam.code === 'UNKNOWN') {
            return fs.symlink(resolvedSrc, det, cba);
          }
          return cba(errParam);
        }
        if (ops.dereference) {
          resolvedDest = path.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cba(new Error(
              `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
        }

        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cba(new Error(
              `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
        }
        return copyLink(resolvedSrc, det, cba);
      });
    }
    return undefined;
  });
}

function copyLink(resS, det, cba) {
  fs.unlink(det, err => {
    if (err) {
      return cba(err);
    }
    return fs.symlink(resS, det, cba);
  });
}

module.exports = copy;
