'use strict';

const u = require('../universalify').fromPromise;
const fs = require('../fs');
const path = require('path');
const mkdir = require('../mkdirs');
const remove = require('../remove');

const emptyDir = u(async (dr) => {
  if (!await fs.exists(dr)) {
    await fs.mkdir(dr);
  }

  let items = await fs.readdir(dr);

  for (let item of items) {
    await remove.remove(path.join(dr, item));
  }
});

function emptyDirSync(dr) {
  let items;
  try {
    items = fs.readdirSync(dr);
  } catch {
    return mkdir.mkdirsSync(dr);
  }

  items.forEach(itemVal => {
    let item = itemVal;
    item = path.join(dr, item);
    remove.removeSync(item);
  });
  return undefined;
}

module.exports = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir,
};
