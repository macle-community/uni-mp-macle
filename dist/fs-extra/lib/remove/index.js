const fsa = require('../graceful-fs');
const uuu = require('../universalify').fromCallback;

function remove(pth, cbb) {
  fsa.rm(pth, {recursive: true, force: true}, cbb);
}

function removeSync(pth) {
  fsa.rmSync(pth, {recursive: true, force: true});
}

module.exports = {
  remove: uuu(remove),
  removeSync,
};
