const uModule = require('../universalify').fromCallback;
module.exports = {
  copy: uModule(require('./copy')),
  copySync: require('./copy-sync'),
};
