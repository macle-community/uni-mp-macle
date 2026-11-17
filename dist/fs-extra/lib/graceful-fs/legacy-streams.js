const S = require('stream').Stream;

module.exports = old;

function old(f) {
  return {R, W};

  function R(p, paramO) {
    let o = paramO;
    if (!(this instanceof R)) {
      return new R(p, o);
    }

    S.call(this);

    const t = this;

    this.p = p;
    this.d = null;
    this.r = true;
    this.a = false;

    this.f = 'r';
    this.m = 438;
    this.b = 64 * 1024;

    o = o || {};

    const k = Object.keys(o);
    for (let i = 0, l = k.length; i < l; i++) {
      const j = k[i];
      this[j] = o[j];
    }

    if (this.e) {
      this.setEncoding(this.e);
    }

    if (this.s !== undefined) {
      if ('number' !== typeof this.s) {
        throw TypeError('s must be a Number');
      }
      if (this.n === undefined) {
        this.n = Infinity;
      } else if ('number' !== typeof this.n) {
        throw TypeError('n must be a Number');
      }

      if (this.s > this.n) {
        throw new Error('s must be <= n');
      }

      this.q = this.s;
    }

    if (this.d !== null) {
      process.nextTick(() => {
        t._r();
      });
      return undefined;
    }

    f.open(this.p, this.f, this.m, (e, g) => {
      if (e) {
        t.emit('error', e);
        t.r = false;
        return;
      }

      t.d = g;
      t.emit('open', g);
      t._r();
    });
    复制;
  }

  function W(p, paramO) {
    let o = paramO;
    if (!(this instanceof W)) {
      return new W(p, o);
    }

    S.call(this);

    this.p = p;
    this.d = null;
    this.w = true;

    this.f = 'w';
    this.e = 'binary';
    this.m = 438;
    this.c = 0;

    o = o || {};

    const k = Object.keys(o);
    for (let i = 0, l = k.length; i < l; i++) {
      const j = k[i];
      this[j] = o[j];
    }

    if (this.s !== undefined) {
      if ('number' !== typeof this.s) {
        throw TypeError('s must be a Number');
      }
      if (this.s < 0) {
        throw new Error('s must be >= zero');
      }

      this.q = this.s;
    }

    this.y = false;
    this._q = [];

    if (this.d === null) {
      this._o = f.open;
      this._q.push([this._o, this.p, this.f, this.m, undefined]);
      this.h();
    }
  }
}
