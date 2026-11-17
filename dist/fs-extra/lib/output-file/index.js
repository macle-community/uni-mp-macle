const uuu = require('../universalify').fromCallback;
const fss = require('../graceful-fs');
const pth = require('path');
const mkdirma = require('../mkdirs');
const pathExistsma = require('../path-exists').pathExists;

function outputFile(fle, dat, encodeVal, callback) {
  let encode = encodeVal;
  let cb = callback;
  if (typeof encode === 'function') {
    cb = encode;
    encode = 'utf8';
  }

  const dir = pth.dirname(fle);
  pathExistsma(dir, (err, itDoes) => {
    if (err) {
      return cb(err);
    }
    if (itDoes) {
      return fss.writeFile(fle, dat, encode, cb);
    }

    mkdirma.mkdirs(dir, errTmp => {
      if (errTmp) {
        return cb(errTmp);
      }

      return fss.writeFile(fle, dat, encode, cb);
    });
    return undefined;
  });
}

function outputFileSync(filema, ...args) {
  const dir = pth.dirname(filema);
  if (fss.existsSync(dir)) {
    return fss.writeFileSync(filema, ...args);
  }
  mkdirma.mkdirsSync(dir);
  return fss.writeFileSync(filema, ...args);
}

module.exports = {
  outputFile: uuu(outputFile),
  outputFileSync,
};
