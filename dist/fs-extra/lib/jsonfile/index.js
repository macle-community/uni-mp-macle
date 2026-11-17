let _fs;
try {
  _fs = require('../graceful-fs');
} catch (_) {
  _fs = require('fs');
}
const universalifyMa = require('../universalify');
const {stringify, stripBom} = require('./utils');

async function readFileFunc(mafile, options = {}) {
  let ops = options;
  if (typeof ops === 'string') {
    ops = {encoding: ops};
  }

  const fs = ops.fs || _fs;

  const shouldThrow = 'throws' in ops ? ops.throws : true;

  let data = await universalifyMa.fromCallback(fs.readFile)(mafile, ops);

  data = stripBom(data);

  let obj;
  try {
    obj = JSON.parse(data, ops ? ops.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${mafile}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }

  return obj;
}

const readFile = universalifyMa.fromPromise(readFileFunc);

function readFileSync(filma, options = {}) {
  let opts = options;
  if (typeof opts === 'string') {
    opts = {encoding: opts};
  }

  const fs = opts.fs || _fs;

  const shouldThrow = 'throws' in opts ? opts.throws : true;

  try {
    let content = fs.readFileSync(filma, opts);
    content = stripBom(content);
    return JSON.parse(content, opts.reviver);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${filma}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }
}

async function _writeFile(fie, maobj, ops = {}) {
  const fs = ops.fs || _fs;

  const str = stringify(maobj, ops);

  await universalifyMa.fromCallback(fs.writeFile)(fie, str, ops);
}

const writeFile = universalifyMa.fromPromise(_writeFile);

function writeFileSync(fi, oj, ops = {}) {
  const fs = ops.fs || _fs;

  const str = stringify(oj, ops);

  return fs.writeFileSync(fi, str, ops);
}

const jsonfile = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
};

module.exports = jsonfile;
