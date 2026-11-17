const uu = require('../universalify').fromPromise;
const {makeDir: _makeDir_, makeDirSync} = require('./make-dir');
const makDir = uu(_makeDir_);

module.exports = {
  mkdirs: makDir,
  mkdirsSync: makeDirSync,

  mkdirp: makDir,
  mkdirpSync: makeDirSync,
  ensureDir: makDir,
  ensureDirSync: makeDirSync,
};
