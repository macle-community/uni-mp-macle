'use strict';

const u = require('../universalify').fromCallback;
const path = require('path');
const fs = require('../graceful-fs');
const mkdir = require('../mkdirs');
const pathExists = require('../path-exists').pathExists;
const {areIdentical} = require('../util/stat');

function createLink(scp, dstp, cb) {
  function makeLink(srcpath, dstpath) {
    fs.link(srcpath, dstpath, err => {
      if (err) {
        return cb(err);
      }
      return cb(null);
    });
  }

  fs.lstat(dstp, (_, dsSt) => {
    fs.lstat(scp, (error, cscSt) => {
      if (error) {
        error.message = error.message.replace('lstat', 'ensureLink');
        return cb(error);
      }
      if (dsSt && areIdentical(cscSt, dsSt)) {
        return cb(null);
      }

      const cdi = path.dirname(dstp);
      pathExists(cdi, (eerr, diEx) => {
        if (eerr) {
          return cb(eerr);
        }
        if (diEx) {
          return makeLink(scp, dstp);
        }
        mkdir.mkdirs(cdi, er => {
          if (er) {
            return cb(er);
          }
          return makeLink(scp, dstp);
        });
        return undefined;
      });
      return undefined;
    });
  });
}

function createLinkSync(scp, dstp) {
  let dstSt;
  try {
    dstSt = fs.lstatSync(dstp);
  } catch {
  }

  try {
    const srcStat = fs.lstatSync(scp);
    if (dstSt && areIdentical(srcStat, dstSt)) {
      return undefined;
    }
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err;
  }

  const dir = path.dirname(dstp);
  const dirExists = fs.existsSync(dir);
  if (dirExists) {
    return fs.linkSync(scp, dstp);
  }
  mkdir.mkdirsSync(dir);

  return fs.linkSync(scp, dstp);
}

module.exports = {
  createLink: u(createLink),
  createLinkSync,
};
