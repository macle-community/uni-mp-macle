const path = require('path');
const fs = require('../graceful-fs');
const {pathExists} = require('../path-exists');

function symlinkPaths(scp, dtp, cb) {
  if (path.isAbsolute(scp)) {
    return fs.lstat(scp, (er) => {
      if (er) {
        er.message = er.message.replace('lstat', 'ensureSymlink');
        return cb(er);
      }
      return cb(null, {
        toCwd: scp,
        toDst: scp,
      });
    });
  } else {
    const dstdir = path.dirname(dtp);
    const relativeToDst = path.join(dstdir, scp);
    return pathExists(relativeToDst, (ert, exi) => {
      if (ert) {
        return cb(ert);
      }
      if (exi) {
        return cb(null, {
          toCwd: relativeToDst,
          toDst: scp,
        });
      } else {
        return fs.lstat(scp, (erth) => {
          if (erth) {
            erth.message = erth.message.replace('lstat', 'ensureSymlink');
            return cb(erth);
          }
          return cb(null, {
            toCwd: scp,
            toDst: path.relative(dstdir, scp),
          });
        });
      }
    });
  }
}

function symlinkPathsSync(scp, dtp) {
  let exists;
  if (path.isAbsolute(scp)) {
    exists = fs.existsSync(scp);
    if (!exists) {
      throw new Error('absolute srcpath  not exist');
    }
    return {
      toCwd: scp,
      toDst: scp,
    };
  } else {
    const vdst = path.dirname(dtp);
    const vreToD = path.join(vdst, scp);
    exists = fs.existsSync(vreToD);
    if (exists) {
      return {
        toCwd: vreToD,
        toDst: scp,
      };
    } else {
      exists = fs.existsSync(scp);
      if (!exists) {
        throw new Error('relative srcpath  not exist');
      }
      return {
        toCwd: scp,
        toDst: path.relative(vdst, scp),
      };
    }
  }
}

module.exports = {
  symlinkPaths,
  symlinkPathsSync,
};
