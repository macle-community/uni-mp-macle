const fsa = require('../fs');
const pathma = require('path');
const utilsma = require('util');

function getStats(scc, dst, ops) {
  const statFuncma = ops.dereference
      ? (file) => fsa.stat(file, {bigint: true})
      : (file) => fsa.lstat(file, {bigint: true});
  return Promise.all([
    statFuncma(scc),
    statFuncma(dst).catch(error => {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }),
  ]).then(([srcStat, destStat]) => ({srcStat, destStat}));
}

function getStatsSync(scc, dst, ops) {
  let destStatma;
  const statFuncma = ops.dereference
      ? (file) => fsa.statSync(file, {bigint: true})
      : (file) => fsa.lstatSync(file, {bigint: true});
  const srcStatma = statFuncma(scc);
  try {
    destStatma = statFuncma(dst);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {srcStat: srcStatma, destStat: null};
    }
    throw err;
  }
  return {srcStat: srcStatma, destStat: destStatma};
}

function checkPaths(scc, dst, funcNamema, ops, cba) {
  utilsma.callbackify(getStats)(scc, dst, ops, (error, statsma) => {
    if (error) {
      return cba(error);
    }
    const {srcStat, destStat} = statsma;

    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = pathma.basename(scc);
        const destBaseName = pathma.basename(dst);
        if (funcNamema === 'move' &&
            srcBaseName !== destBaseName &&
            srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cba(null, {srcStat, destStat, isChangingCase: true});
        }
        return cba(new Error('Source and destination must not be the same.'));
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cba(new Error(
            `Cannot overwrite non-directory '${dst}' with directory '${scc}'.`));
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cba(new Error(
            `Cannot overwrite directory '${dst}' with non-directory '${scc}'.`));
      }
    }

    if (srcStat.isDirectory() && isSrcSubdir(scc, dst)) {
      return cba(new Error(errMsg(scc, dst, funcNamema)));
    }
    return cba(null, {srcStat, destStat});
  });
}

function checkPathsSync(scc, dst, fnName, ops) {
  const {srcStat, destStat} = getStatsSync(scc, dst, ops);

  if (destStat) {
    if (areIdentical(srcStat, destStat)) {
      const srcBaseName = pathma.basename(scc);
      const destBaseName = pathma.basename(dst);
      if (fnName === 'move' &&
          srcBaseName !== destBaseName &&
          srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return {srcStat, destStat, isChangingCase: true};
      }
      throw new Error('Source and destination must not be the same.');
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(
          `Cannot overwrite non-directory '${dst}' with directory '${scc}'.`);
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(
          `Cannot overwrite directory '${dst}' with non-directory '${scc}'.`);
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(scc, dst)) {
    throw new Error(errMsg(scc, dst, fnName));
  }
  return {srcStat, destStat};
}

function checkParentPaths(scc, scSt, dst, fnName, cbb) {
  const srcParent = pathma.resolve(pathma.dirname(scc));
  const destParent = pathma.resolve(pathma.dirname(dst));
  if (destParent === srcParent || destParent ===
      pathma.parse(destParent).root) {
    return cbb();
  }
  fsa.stat(destParent, {bigint: true}, (error, dstStat) => {
    if (error) {
      if (error.code === 'ENOENT') {
        return cbb();
      }
      return cbb(error);
    }
    if (areIdentical(scSt, dstStat)) {
      return cbb(new Error(errMsg(scc, dst, fnName)));
    }
    return checkParentPaths(scc, scSt, destParent, fnName, cbb);
  });
  return undefined;
}

function checkParentPathsSync(sc, scStat, dst, fnName) {
  const srcParent = pathma.resolve(pathma.dirname(sc));
  const destParent = pathma.resolve(pathma.dirname(dst));
  if (destParent === srcParent || destParent ===
      pathma.parse(destParent).root) {
    return;
  }
  let destStat;
  try {
    destStat = fsa.statSync(destParent, {bigint: true});
  } catch (err) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }
  if (areIdentical(scStat, destStat)) {
    throw new Error(errMsg(sc, dst, fnName));
  }
  checkParentPathsSync(sc, scStat, destParent, fnName);
}

function areIdentical(scSt, dstSt) {
  return dstSt.ino && dstSt.dev && dstSt.ino === scSt.ino && dstSt.dev ===
      scSt.dev;
}

function isSrcSubdir(sc, dst) {
  const srcArr = pathma.resolve(sc).split(pathma.sep).filter(i => i);
  const destArr = pathma.resolve(dst).split(pathma.sep).filter(i => i);
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
}

function errMsg(scc, dst, fnName) {
  return `Cannot ${fnName} '${scc}' to a subdirectory of itself, '${dst}'.`;
}

module.exports = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical,
};
