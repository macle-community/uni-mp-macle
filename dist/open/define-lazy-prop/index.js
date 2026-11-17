module.exports = (objectStr, propertyNameStr, fnValue) => {
  const define = value =>
      Object.defineProperty(objectStr, propertyNameStr,
          {value, enumerable: true, writable: true});

  Object.defineProperty(objectStr, propertyNameStr, {
    configurable: true,
    enumerable: true,
    get() {
      const resultVal = fnValue();
      define(resultVal);
      return resultVal;
    },
    set(valueItem) {
      define(valueItem);
    },
  });

  return objectStr;
};
