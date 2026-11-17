let C = require('constants');

let oCwd = process.cwd;
let c = null;

let p = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!c) {
    c = oCwd.call(process);
  }
  return c;
};
try {
  process.cwd();
} catch (er) {
}

if (typeof process.chdir === 'function') {
  let cd = process.chdir;
  process.chdir = function(d) {
    c = null;
    cd.call(process, d);
  };
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(process.chdir, cd);
  }
}

module.exports = pch;

function handleFparams(
    pLchmod, f, pLutimes, cFix, mFix, cFixSync, mFixSync, sFix, sFixSync) {
  if (Object.prototype.hasOwnProperty.call(C, 'O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    pLchmod(f);
  }

  if (!f.lutimes) {
    pLutimes(f);
  }

  f.chown = cFix(f.chown, f);
  f.fchown = cFix(f.fchown, f);
  f.lchown = cFix(f.lchown, f);

  f.chmod = mFix(f.chmod, f);
  f.fchmod = mFix(f.fchmod, f);
  f.lchmod = mFix(f.lchmod, f);

  f.chownSync = cFixSync(f.chownSync, f);
  f.fchownSync = cFixSync(f.fchownSync, f);
  f.lchownSync = cFixSync(f.lchownSync, f);

  f.chmodSync = mFixSync(f.chmodSync, f);
  f.fchmodSync = mFixSync(f.fchmodSync, f);
  f.lchmodSync = mFixSync(f.lchmodSync, f);

  f.stat = sFix(f.stat, f);
  f.fstat = sFix(f.fstat, f);
  f.lstat = sFix(f.lstat, f);

  f.statSync = sFixSync(f.statSync, f);
  f.fstatSync = sFixSync(f.fstatSync, f);
  f.lstatSync = sFixSync(f.lstatSync, f);

  if (f.chmod && !f.lchmod) {
    f.lchmod = function(p, m, cb) {
      if (cb) {
        process.nextTick(cb);
      }
    };
    f.lchmodSync = function() {
    };
  }
  if (f.chown && !f.lchown) {
    f.lchown = function(p, u, g, cb) {
      if (cb) {
        process.nextTick(cb);
      }
    };
    f.lchownSync = function() {
    };
  }
}

function pLchmod(fs) {
  fs.lchmod = function(path, mode, callback) {
    fs.open(path
        , C.O_WRONLY | C.O_SYMLINK
        , mode
        , function(err, fd) {
          if (err) {
            if (callback) {
              callback(err);
            }
            return;
          }
          fs.fchmod(fd, mode, function(err) {
            fs.close(fd, function(err2) {
              if (callback) {
                callback(err || err2);
              }
            });
          });
        });
  };

  fs.lchmodSync = function(path, mode) {
    let fd = fs.openSync(path, C.O_WRONLY | C.O_SYMLINK, mode);

    let threw = true;
    let ret;
    try {
      ret = fs.fchmodSync(fd, mode);
      threw = false;
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd);
        } catch (er) {
        }
      } else {
        fs.closeSync(fd);
      }
    }
    return ret;
  };
}

function pLutimes(fs) {
  if (Object.prototype.hasOwnProperty.call(C, 'O_SYMLINK') && fs.futimes) {
    fs.lutimes = function(path, at, mt, cb) {
      fs.open(path, C.O_SYMLINK, function(er, fd) {
        if (er) {
          if (cb) {
            cb(er);
          }
          return;
        }
        fs.futimes(fd, at, mt, function(er) {
          fs.close(fd, function(er2) {
            if (cb) {
              cb(er || er2);
            }
          });
        });
      });
    };

    fs.lutimesSync = function(path, at, mt) {
      let fd = fs.openSync(path, C.O_SYMLINK);
      let ret;
      let threw = true;
      try {
        ret = fs.futimesSync(fd, at, mt);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {
          }
        } else {
          fs.closeSync(fd);
        }
      }
      return ret;
    };

  } else if (fs.futimes) {
    fs.lutimes = function(_a, _b, _c, cb) {
      if (cb) {
        process.nextTick(cb);
      }
    };
    fs.lutimesSync = function() {
    };
  }
}

function mFix(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, mode, cb) {
    return orig.call(f, target, mode, function(error) {
      let er = error;
      if (chownErOk(er)) {
        er = null;
      }
      if (cb) {
        cb.apply(this, arguments);
      }
    });
  };
}

function mFixSync(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, mode) {
    try {
      return orig.call(f, target, mode);
    } catch (er) {
      if (!chownErOk(er)) {
        throw er;
      }
    }
  };
}

function cFix(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, uid, gid, cb) {
    return orig.call(f, target, uid, gid, function(error) {
      let er = error;
      if (chownErOk(er)) {
        er = null;
      }
      if (cb) {
        cb.apply(this, arguments);
      }
    });
  };
}

function cFixSync(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, uid, gid) {
    try {
      return orig.call(f, target, uid, gid);
    } catch (er) {
      if (!chownErOk(er)) {
        throw er;
      }
    }
  };
}

function sFix(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, opts, cbVal) {
    let cb = cbVal;
    let options = opts;
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }

    function callback(er, stats) {
      if (stats) {
        if (stats.uid < 0) {
          stats.uid += 0x100000000;
        }
        if (stats.gid < 0) {
          stats.gid += 0x100000000;
        }
      }
      if (cb) {
        cb.apply(this, arguments);
      }
    }

    return options ? orig.call(f, target, options, callback)
        : orig.call(f, target, callback);
  };
}

function sFixSync(orig, f) {
  if (!orig) {
    return orig;
  }
  return function(target, options) {
    let stats = options ? orig.call(f, target, options)
        : orig.call(f, target);
    if (stats) {
      if (stats.uid < 0) {
        stats.uid += 0x100000000;
      }
      if (stats.gid < 0) {
        stats.gid += 0x100000000;
      }
    }
    return stats;
  };
}

function chownErOk(er) {
  if (!er) {
    return true;
  }

  if (er.code === 'ENOSYS') {
    return true;
  }

  let nonroot = !process.getuid || process.getuid() !== 0;
  if (nonroot) {
    if (er.code === 'EINVAL' || er.code === 'EPERM') {
      return true;
    }
  }

  return false;
}

function pch(f) {
  handleFparams(pLchmod, f, pLutimes, cFix, mFix, cFixSync, mFixSync, sFix,
      sFixSync);
  if (p === 'win32') {
    f.rename = typeof f.rename !== 'function' ? f.rename
        : (function(f$rename) {
          function rename(a, b, cb) {
            let start = Date.now();
            let backoff = 0;
            f$rename(a, b, function CB(er) {
              if (er
                  && (er.code === 'EACCES' || er.code === 'EPERM' || er.code ===
                      'EBUSY')
                  && Date.now() - start < 60000) {
                setTimeout(function() {
                  f.stat(b, function(stater, st) {
                    if (stater && stater.code === 'ENOENT') {
                      f$rename(a, b, CB);
                    } else {
                      cb(er);
                    }
                  });
                }, backoff);
                if (backoff < 100) {
                  backoff += 10;
                }
                return;
              }
              if (cb) {
                cb(er);
              }
            });
          }

          if (Object.setPrototypeOf) {
            Object.setPrototypeOf(rename, f$rename);
          }
          return rename;
        })(f.rename);
  }

  f.read = typeof f.read !== 'function' ? f.read
      : (function(f$read) {
        function read(g, b, o, l, p, callback_) {
          let callback;
          if (callback_ && typeof callback_ === 'function') {
            let eagCounter = 0;
            callback = function(er, _, _) {
              if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                eagCounter++;
                return f$read.call(f, g, b, o, l, p, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return f$read.call(f, g, b, o, l, p, callback);
        }

        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(read, f$read);
        }
        return read;
      })(f.read);

  f.readSync = typeof f.readSync !== 'function' ? f.readSync
      : (function(f$readSync) {
        return function(g, b, o, l, p) {
          let eagCounter = 0;
          while (true) {
            try {
              return f$readSync.call(f, g, b, o, l, p);
            } catch (er) {
              if (er.code === 'EAGAIN' && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      })(f.readSync);
}
