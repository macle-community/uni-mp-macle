exports.fromCallback = function(func) {
  return Object.defineProperty(function(...args) {
    if (typeof args[args.length - 1] === 'function') {
      return func.apply(this, args);
    } else {
      return new Promise((resv, rej) => {
        func.call(
            this,
            ...args,
            (err, res) => (err !== null) ? rej(err) : resv(res),
        );
      });
    }
  }, 'name', {value: func.name});
};

exports.fromPromise = function(funct) {
  return Object.defineProperty(function(...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== 'function') {
      return funct.apply(this, args);
    } else {
      return funct.apply(this, args.slice(0, -1)).then(r => cb(null, r), cb);
    }
  }, 'name', {value: funct.name});
};
