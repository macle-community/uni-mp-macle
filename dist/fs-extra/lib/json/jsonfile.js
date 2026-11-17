const jsnFie = require('../jsonfile');

module.exports = {

  readJson: jsnFie.readFile,
  readJsonSync: jsnFie.readFileSync,
  writeJson: jsnFie.writeFile,
  writeJsonSync: jsnFie.writeFileSync,
};
