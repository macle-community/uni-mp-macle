const fss = require('../fs');
const {checkPath} = require('./utils');

const getMode = ops => {
  const defaults = {mode: 0o777};
  if (typeof ops === 'number') {
    return ops;
  }
  return ({...defaults, ...ops}).mode;
};

module.exports.makeDir = async(di, opps) => {
  checkPath(di);

  return fss.mkdir(di, {
    mode: getMode(opps),
    recursive: true,
  });
};

module.exports.makeDirSync = (dr, ops) => {
  checkPath(dr);

  return fss.mkdirSync(dr, {
    mode: getMode(ops),
    recursive: true,
  });
};
