'use strict';

function transformWxmlToMaml(code = '') {
  return code
    // Directives: wx:if -> ma:if, wx:for -> ma:for, wx-if -> ma:if, wx-else -> ma:else
    .replace(/\bwx:([a-zA-Z0-9_-]+)/g, 'ma:$1')
    .replace(/\bwx-(if|else)\b/g, 'ma:$1')
    // Template imports & includes: .wxml -> .maml
    .replace(/\.wxml(['"])/g, '.maml$1')
    // WXS script tags & extensions: <wxs> -> <sjs>, .wxs -> .sjs
    .replace(/<wxs\b/g, '<sjs')
    .replace(/<\/wxs>/g, '</sjs>')
    .replace(/\.wxs(['"])/g, '.sjs$1');
}

module.exports = { transformWxmlToMaml };
