'use strict';

function transformWxmlToMaml(code = '') {
  if (typeof code !== 'string') return '';

  let result = '';
  let index = 0;

  while (index < code.length) {
    if (code.startsWith('<!--', index)) {
      const end = code.indexOf('-->', index + 4);
      if (end === -1) {
        result += code.slice(index);
        break;
      }
      result += code.slice(index, end + 3);
      index = end + 3;
      continue;
    }

    if (code.startsWith('{{', index)) {
      const end = code.indexOf('}}', index + 2);
      if (end === -1) {
        result += code.slice(index);
        break;
      }
      result += code.slice(index, end + 2);
      index = end + 2;
      continue;
    }

    if (code[index] === '<') {
      const end = code.indexOf('>', index + 1);
      if (end === -1) {
        result += code.slice(index);
        break;
      }

      let tag = code.slice(index, end + 1);
      tag = tag
        .replace(/\bwx:([a-zA-Z0-9_-]+)/g, 'ma:$1')
        .replace(/\bwx-([a-zA-Z0-9_-]+)\b/g, 'ma-$1')
        .replace(/\.wxml(?=(?:["']))/g, '.maml')
        .replace(/<wxs\b/gi, '<sjs')
        .replace(/<\/wxs\s*>/gi, '</sjs>')
        .replace(/\.wxs(?=(?:["']))/g, '.sjs');

      result += tag;
      index = end + 1;
      continue;
    }

    const nextTag = code.indexOf('<', index);
    const nextComment = code.indexOf('<!--', index);
    const nextInterpolation = code.indexOf('{{', index);
    const candidates = [nextTag, nextComment, nextInterpolation].filter((position) => position >= 0);
    const next = candidates.length > 0 ? Math.min(...candidates) : code.length;

    if (next === index) continue;
    result += code.slice(index, next);
    index = next;
  }

  return result;
}

module.exports = { transformWxmlToMaml };
