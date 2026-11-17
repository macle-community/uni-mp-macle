'use strict';

module.exports = duplicate;

let getAncestor = Object.getPrototypeOf || function(source) {
  return source.__proto__;
};

function duplicate(source) {
  if (source === null || typeof source !== 'object') {
    return source;
  }

  let replica = {};
  if (source instanceof Object) {
    replica = {__proto__: getAncestor(source)};
  } else {
    replica = Object.create(null);
  }

  Object.getOwnPropertyNames(source).forEach(key => {
    Object.defineProperty(replica, key,
        Object.getOwnPropertyDescriptor(source, key));
  });

  return replica;
}
