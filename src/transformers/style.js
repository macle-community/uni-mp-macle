'use strict';

function transformWxssToMass(code = '') {
  if (typeof code !== 'string') return '';

  return code
    .replace(/(@import\s+(?:url\(\s*)?["'])([^"']*?)\.wxss(?=["'])/gi, '$1$2.mass')
    .replace(/(@import\s+)([^"'()[;\s]+\.wxss)(?=\s*;)/gi, (_match, prefix, importPath) => `${prefix}${importPath.replace(/\.wxss$/i, '.mass')}`)
    .replace(/(url\(\s*["']?[^)"']*?)\.wxss(?=["']?\s*\))/gi, '$1.mass');
}

module.exports = { transformWxssToMass };
