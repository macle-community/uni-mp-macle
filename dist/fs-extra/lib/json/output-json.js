const {stringify} = require('../jsonfile/utils');
const {outputFile} = require('../output-file');

async function outputJson(fie, dda, oop = {}) {
  const str = stringify(dda, oop);

  await outputFile(fie, str, oop);
}

module.exports = outputJson;
