'use strict';

function transformWxssToMass(code = '') {
  // Rewrite @import "xxx.wxss" -> @import "xxx.mass"
  return code.replace(/\.wxss(['"])/g, '.mass$1');
}

module.exports = { transformWxssToMass };
