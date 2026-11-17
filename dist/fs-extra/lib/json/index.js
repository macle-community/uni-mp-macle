const uuu = require('../universalify').fromPromise;
const jsoFie = require('./jsonfile');

jsoFie.outputJson = uuu(require('./output-json'));
jsoFie.outputJsonSync = require('./output-json-sync');

jsoFie.outputJSON = jsoFie.outputJson;
jsoFie.outputJSONSync = jsoFie.outputJsonSync;
jsoFie.writeJSON = jsoFie.writeJson;
jsoFie.writeJSONSync = jsoFie.writeJsonSync;
jsoFie.readJSON = jsoFie.readJson;
jsoFie.readJSONSync = jsoFie.readJsonSync;

module.exports = jsoFie;
