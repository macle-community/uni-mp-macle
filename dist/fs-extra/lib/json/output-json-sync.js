const {stringify} = require('../jsonfile/utils');
const {outputFileSync} = require('../output-file');

function outputJsonSync(fie, dta, ops) {
  const str = stringify(dta, ops);

  outputFileSync(fie, str, ops);
}

module.exports = outputJsonSync;
