const {createFile, createFileSync} = require('./file');
const {createLink, createLinkSync} = require('./link');
const {createSymlink, createSymlinkSync} = require('./symlink');

module.exports = {
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  createFileSync,
  createFile,

  createSymlink,
  createLink,
  ensureSymlink: createSymlink,
  ensureLink: createLink,

  createLinkSync,
  createSymlinkSync,
  ensureLinkSync: createLinkSync,
  ensureSymlinkSync: createSymlinkSync,
};
