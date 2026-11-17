const pah = require('path');

module.exports.checkPath = function checkPath(ph) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(
        ph.replace(pah.parse(ph).root, ''));

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${ph}`);
      error.code = 'EINVAL';
      throw error;
    }
  }
};
