const uu = require('../universalify').fromCallback;
module.exports = {
  move: uu(require('./move')),
  moveSync: require('./move-sync'),
};
