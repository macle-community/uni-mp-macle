const fs = require('../graceful-fs');
const path = require('path');
const {mkdirsSync} = require('../mkdirs');
const {utimesMillisSync} = require('../util/utimes');
const stat = require('../util/stat');

function copySync(sc, dt, options) {
  let ops = options;
  if (typeof ops === 'function') {
    ops = {filter: ops};
  }

  ops = ops || {};
  ops.clobber = 'clobber' in ops ? !!ops.clobber : true;
  ops.overwrite = 'overwrite' in ops ? !!ops.overwrite : ops.clobber;

  if (ops.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
        'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
        'Warning', 'fs-extra-WARN0002',
    );
  }

  const {srcStat, destStat} = stat.checkPathsSync(sc, dt, 'copy', ops);
  stat.checkParentPathsSync(sc, srcStat, dt, 'copy');
  if (ops.filter && !ops.filter(sc, dt)) {
    return;
  }
  const destParent = path.dirname(dt);
  if (!fs.existsSync(destParent)) {
    mkdirsSync(destParent);
  }
  getStats(destStat, sc, dt, ops);
}

function getStats(deSt, sc, dt, ops) {
  const statSync = ops.dereference ? fs.statSync : fs.lstatSync;
  const srcStat = statSync(sc);

  if (srcStat.isDirectory()) {
    return onDir(srcStat, deSt, sc, dt, ops);
  } else if (srcStat.isFile() ||
      srcStat.isCharacterDevice() ||
      srcStat.isBlockDevice()) {
    return onFile(srcStat, deSt, sc, dt, ops);
  } else if (srcStat.isSymbolicLink()) {
    return onLink(deSt, sc, dt, ops);
  } else if (srcStat.isSocket()) {
    throw new Error(`Cannot copy a socket file: ${sc}`);
  } else if (srcStat.isFIFO()) {
    throw new Error(`Cannot copy a FIFO pipe: ${sc}`);
  } else {}
  throw new Error(`Unknown file: ${sc}`);
}

function onFile(scTat, deSt, sc, det, ops) {
  if (!deSt) {
    return copyFile(scTat, sc, det, ops);
  }
  return mayCopyFile(scTat, sc, det, ops);
}

function mayCopyFile(scSt, sc, det, ops) {
  if (ops.overwrite) {
    fs.unlinkSync(det);
    return copyFile(scSt, sc, det, ops);
  } else if (ops.errorOnExist) {
    throw new Error(`'${det}' already exists`);
  }
  return undefined;
}

function copyFile(scSt, sc, det, ops) {
  fs.copyFileSync(sc, det);
  if (ops.preserveTimestamps) {
    handleTimestamps(scSt.mode, sc, det);
  }
  return setDestMode(det, scSt.mode);
}

function handleTimestamps(scMo, sc, det) {

  if (fileIsNotWritable(scMo)) {
    makeFileWritable(det, scMo);
  }
  return setDestTimestamps(sc, det);
}

function fileIsNotWritable(scMo) {
  return (scMo & 0o200) === 0;
}

function makeFileWritable(det, srcm) {
  return setDestMode(det, srcm | 0o200);
}

function setDestMode(det, srcm) {
  return fs.chmodSync(det, srcm);
}

function setDestTimestamps(sc, det) {
  const updatedSrcStat = fs.statSync(sc);
  return utimesMillisSync(det, updatedSrcStat.atime, updatedSrcStat.mtime);
}

function onDir(srcSt, detSt, sc, det, ops) {
  if (!detSt) {
    return mkDirAndCopy(srcSt.mode, sc, det, ops);
  }
  return copyDir(sc, det, ops);
}

function mkDirAndCopy(scm, sc, det, ops) {
  fs.mkdirSync(det);
  copyDir(sc, det, ops);
  return setDestMode(det, scm);
}

function copyDir(sc, det, ops) {
  fs.readdirSync(sc).forEach(item => copyDirItem(item, sc, det, ops));
}

function copyDirItem(ite, sc, det, ops) {
  const srcItem = path.join(sc, ite);
  const destItem = path.join(det, ite);
  if (ops.filter && !ops.filter(srcItem, destItem)) {
    return;
  }
  const {destStat} = stat.checkPathsSync(srcItem, destItem, 'copy', ops);
  getStats(destStat, srcItem, destItem, ops);
  return;
}

function onLink(detSt, sc, det, ops) {
  let resolvedSrc = fs.readlinkSync(sc);
  if (ops.dereference) {
    resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
  }

  if (!detSt) {
    return fs.symlinkSync(resolvedSrc, det);
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs.readlinkSync(det);
    } catch (err) {

      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') {
        return fs.symlinkSync(resolvedSrc, det);
      }
      throw err;
    }
    if (ops.dereference) {
      resolvedDest = path.resolve(process.cwd(), resolvedDest);
    }
    if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(
          `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
    }

    if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(
          `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
    }
    return copyLink(resolvedSrc, det);
  }
}

function copyLink(resSr, det) {
  fs.unlinkSync(det);
  return fs.symlinkSync(resSr, det);
}

module.exports = copySync;
