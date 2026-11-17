function stringify(
    objma, {EOL = '\n', finalEOL = true, replacer = null, spaces} = {}) {
  const EOF = finalEOL ? EOL : '';
  const str = JSON.stringify(objma, replacer, spaces);

  return str.replace(/\n/g, EOL) + EOF;
}

function stripBom(cttVal) {
  let ctt = cttVal;
  if (Buffer.isBuffer(ctt)) {
    ctt = ctt.toString('utf8');
  }
  return ctt.replace(/^\uFEFF/, '');
}

module.exports = {stringify, stripBom};
