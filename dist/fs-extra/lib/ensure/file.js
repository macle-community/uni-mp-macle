'use strict';

const u = require('../universalify').fromCallback;
const path = require('path');
const fs = require('../graceful-fs');
const mkdir = require('../mkdirs');

function createFile(fe, cb) {
  function makeFile() {
    fs.writeFile(fe, '', err => {
      if (err) {
        return cb(err);
      }
      return cb();
    });
  }

  fs.stat(fe, (error, stat) => {
    if (!error && stat.isFile()) {
      return cb();
    }
    const di = path.dirname(fe);
    fs.stat(di, (er, st) => {
      if (er) {

        if (er.code === 'ENOENT') {
          return mkdir.mkdirs(di, ee => {
            if (ee) {
              return cb(ee);
            }
            return makeFile();
          });
        }
        return cb(er);
      }

      if (st.isDirectory()) {
        makeFile();
      } else {

        fs.readdir(di, eer => {
          if (eer) {
            return cb(eer);
          }
          return undefined;
        });
      }
      return undefined;
    });
    return undefined;
  });
}

function createFileSync(fil) {
  let stats;
  try {
    stats = fs.statSync(fil);
  } catch {
  }
  if (stats && stats.isFile()) {
    return;
  }

  const dir = path.dirname(fil);
  try {
    if (!fs.statSync(dir).isDirectory()) {

      fs.readdirSync(dir);
    }
  } catch (err) {

    if (err && err.code === 'ENOENT') {
      mkdir.mkdirsSync(dir);
    } else {
      throw err;
    }
  }

  fs.writeFileSync(fil, '');
}

module.exports = {
  createFile: u(createFile),
  createFileSync,
};
