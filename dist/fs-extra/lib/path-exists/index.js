const uuu = require('../universalify').fromPromise;
const fss = require('../fs');

function pathExists(pth) {
  return fss.access(pth).then(() => true).catch(() => false);
}

module.exports = {
  pathExists: uuu(pathExists),
  pathExistsSync: fss.existsSync,
};
