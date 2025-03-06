var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// node_modules/shell-quote/quote.js
var require_quote = __commonJS((exports, module) => {
  module.exports = function quote(xs) {
    return xs.map(function(s) {
      if (s === "") {
        return "''";
      }
      if (s && typeof s === "object") {
        return s.op.replace(/(.)/g, "\\$1");
      }
      if (/["\s]/.test(s) && !/'/.test(s)) {
        return "'" + s.replace(/(['\\])/g, "\\$1") + "'";
      }
      if (/["'\s]/.test(s)) {
        return '"' + s.replace(/(["\\$`!])/g, "\\$1") + '"';
      }
      return String(s).replace(/([A-Za-z]:)?([#!"$&'()*,:;<=>?@[\\\]^`{|}])/g, "$1\\$2");
    }).join(" ");
  };
});

// node_modules/shell-quote/parse.js
var require_parse = __commonJS((exports, module) => {
  var CONTROL = "(?:" + [
    "\\|\\|",
    "\\&\\&",
    ";;",
    "\\|\\&",
    "\\<\\(",
    "\\<\\<\\<",
    ">>",
    ">\\&",
    "<\\&",
    "[&;()|<>]"
  ].join("|") + ")";
  var controlRE = new RegExp("^" + CONTROL + "$");
  var META = "|&;()<> \\t";
  var SINGLE_QUOTE = '"((\\\\"|[^"])*?)"';
  var DOUBLE_QUOTE = "'((\\\\'|[^'])*?)'";
  var hash = /^#$/;
  var SQ = "'";
  var DQ = '"';
  var DS = "$";
  var TOKEN = "";
  var mult = 4294967296;
  for (i = 0;i < 4; i++) {
    TOKEN += (mult * Math.random()).toString(16);
  }
  var i;
  var startsWithToken = new RegExp("^" + TOKEN);
  function matchAll(s, r) {
    var origIndex = r.lastIndex;
    var matches = [];
    var matchObj;
    while (matchObj = r.exec(s)) {
      matches.push(matchObj);
      if (r.lastIndex === matchObj.index) {
        r.lastIndex += 1;
      }
    }
    r.lastIndex = origIndex;
    return matches;
  }
  function getVar(env, pre, key) {
    var r = typeof env === "function" ? env(key) : env[key];
    if (typeof r === "undefined" && key != "") {
      r = "";
    } else if (typeof r === "undefined") {
      r = "$";
    }
    if (typeof r === "object") {
      return pre + TOKEN + JSON.stringify(r) + TOKEN;
    }
    return pre + r;
  }
  function parseInternal(string, env, opts) {
    if (!opts) {
      opts = {};
    }
    var BS = opts.escape || "\\";
    var BAREWORD = "(\\" + BS + `['"` + META + `]|[^\\s'"` + META + "])+";
    var chunker = new RegExp([
      "(" + CONTROL + ")",
      "(" + BAREWORD + "|" + SINGLE_QUOTE + "|" + DOUBLE_QUOTE + ")+"
    ].join("|"), "g");
    var matches = matchAll(string, chunker);
    if (matches.length === 0) {
      return [];
    }
    if (!env) {
      env = {};
    }
    var commented = false;
    return matches.map(function(match) {
      var s = match[0];
      if (!s || commented) {
        return;
      }
      if (controlRE.test(s)) {
        return { op: s };
      }
      var quote = false;
      var esc = false;
      var out = "";
      var isGlob = false;
      var i2;
      function parseEnvVar() {
        i2 += 1;
        var varend;
        var varname;
        var char = s.charAt(i2);
        if (char === "{") {
          i2 += 1;
          if (s.charAt(i2) === "}") {
            throw new Error("Bad substitution: " + s.slice(i2 - 2, i2 + 1));
          }
          varend = s.indexOf("}", i2);
          if (varend < 0) {
            throw new Error("Bad substitution: " + s.slice(i2));
          }
          varname = s.slice(i2, varend);
          i2 = varend;
        } else if (/[*@#?$!_-]/.test(char)) {
          varname = char;
          i2 += 1;
        } else {
          var slicedFromI = s.slice(i2);
          varend = slicedFromI.match(/[^\w\d_]/);
          if (!varend) {
            varname = slicedFromI;
            i2 = s.length;
          } else {
            varname = slicedFromI.slice(0, varend.index);
            i2 += varend.index - 1;
          }
        }
        return getVar(env, "", varname);
      }
      for (i2 = 0;i2 < s.length; i2++) {
        var c = s.charAt(i2);
        isGlob = isGlob || !quote && (c === "*" || c === "?");
        if (esc) {
          out += c;
          esc = false;
        } else if (quote) {
          if (c === quote) {
            quote = false;
          } else if (quote == SQ) {
            out += c;
          } else {
            if (c === BS) {
              i2 += 1;
              c = s.charAt(i2);
              if (c === DQ || c === BS || c === DS) {
                out += c;
              } else {
                out += BS + c;
              }
            } else if (c === DS) {
              out += parseEnvVar();
            } else {
              out += c;
            }
          }
        } else if (c === DQ || c === SQ) {
          quote = c;
        } else if (controlRE.test(c)) {
          return { op: s };
        } else if (hash.test(c)) {
          commented = true;
          var commentObj = { comment: string.slice(match.index + i2 + 1) };
          if (out.length) {
            return [out, commentObj];
          }
          return [commentObj];
        } else if (c === BS) {
          esc = true;
        } else if (c === DS) {
          out += parseEnvVar();
        } else {
          out += c;
        }
      }
      if (isGlob) {
        return { op: "glob", pattern: out };
      }
      return out;
    }).reduce(function(prev, arg) {
      return typeof arg === "undefined" ? prev : prev.concat(arg);
    }, []);
  }
  module.exports = function parse(s, env, opts) {
    var mapped = parseInternal(s, env, opts);
    if (typeof env !== "function") {
      return mapped;
    }
    return mapped.reduce(function(acc, s2) {
      if (typeof s2 === "object") {
        return acc.concat(s2);
      }
      var xs = s2.split(RegExp("(" + TOKEN + ".*?" + TOKEN + ")", "g"));
      if (xs.length === 1) {
        return acc.concat(xs[0]);
      }
      return acc.concat(xs.filter(Boolean).map(function(x) {
        if (startsWithToken.test(x)) {
          return JSON.parse(x.split(TOKEN)[1]);
        }
        return x;
      }));
    }, []);
  };
});

// node_modules/cuint/lib/uint32.js
var require_uint32 = __commonJS((exports, module) => {
  (function(root) {
    var radixPowerCache = {
      36: UINT32(Math.pow(36, 5)),
      16: UINT32(Math.pow(16, 7)),
      10: UINT32(Math.pow(10, 9)),
      2: UINT32(Math.pow(2, 30))
    };
    var radixCache = {
      36: UINT32(36),
      16: UINT32(16),
      10: UINT32(10),
      2: UINT32(2)
    };
    function UINT32(l, h) {
      if (!(this instanceof UINT32))
        return new UINT32(l, h);
      this._low = 0;
      this._high = 0;
      this.remainder = null;
      if (typeof h == "undefined")
        return fromNumber.call(this, l);
      if (typeof l == "string")
        return fromString.call(this, l, h);
      fromBits.call(this, l, h);
    }
    function fromBits(l, h) {
      this._low = l | 0;
      this._high = h | 0;
      return this;
    }
    UINT32.prototype.fromBits = fromBits;
    function fromNumber(value) {
      this._low = value & 65535;
      this._high = value >>> 16;
      return this;
    }
    UINT32.prototype.fromNumber = fromNumber;
    function fromString(s, radix) {
      var value = parseInt(s, radix || 10);
      this._low = value & 65535;
      this._high = value >>> 16;
      return this;
    }
    UINT32.prototype.fromString = fromString;
    UINT32.prototype.toNumber = function() {
      return this._high * 65536 + this._low;
    };
    UINT32.prototype.toString = function(radix) {
      return this.toNumber().toString(radix || 10);
    };
    UINT32.prototype.add = function(other) {
      var a00 = this._low + other._low;
      var a16 = a00 >>> 16;
      a16 += this._high + other._high;
      this._low = a00 & 65535;
      this._high = a16 & 65535;
      return this;
    };
    UINT32.prototype.subtract = function(other) {
      return this.add(other.clone().negate());
    };
    UINT32.prototype.multiply = function(other) {
      var a16 = this._high;
      var a00 = this._low;
      var b16 = other._high;
      var b00 = other._low;
      var c16, c00;
      c00 = a00 * b00;
      c16 = c00 >>> 16;
      c16 += a16 * b00;
      c16 &= 65535;
      c16 += a00 * b16;
      this._low = c00 & 65535;
      this._high = c16 & 65535;
      return this;
    };
    UINT32.prototype.div = function(other) {
      if (other._low == 0 && other._high == 0)
        throw Error("division by zero");
      if (other._high == 0 && other._low == 1) {
        this.remainder = new UINT32(0);
        return this;
      }
      if (other.gt(this)) {
        this.remainder = this.clone();
        this._low = 0;
        this._high = 0;
        return this;
      }
      if (this.eq(other)) {
        this.remainder = new UINT32(0);
        this._low = 1;
        this._high = 0;
        return this;
      }
      var _other = other.clone();
      var i = -1;
      while (!this.lt(_other)) {
        _other.shiftLeft(1, true);
        i++;
      }
      this.remainder = this.clone();
      this._low = 0;
      this._high = 0;
      for (;i >= 0; i--) {
        _other.shiftRight(1);
        if (!this.remainder.lt(_other)) {
          this.remainder.subtract(_other);
          if (i >= 16) {
            this._high |= 1 << i - 16;
          } else {
            this._low |= 1 << i;
          }
        }
      }
      return this;
    };
    UINT32.prototype.negate = function() {
      var v = (~this._low & 65535) + 1;
      this._low = v & 65535;
      this._high = ~this._high + (v >>> 16) & 65535;
      return this;
    };
    UINT32.prototype.equals = UINT32.prototype.eq = function(other) {
      return this._low == other._low && this._high == other._high;
    };
    UINT32.prototype.greaterThan = UINT32.prototype.gt = function(other) {
      if (this._high > other._high)
        return true;
      if (this._high < other._high)
        return false;
      return this._low > other._low;
    };
    UINT32.prototype.lessThan = UINT32.prototype.lt = function(other) {
      if (this._high < other._high)
        return true;
      if (this._high > other._high)
        return false;
      return this._low < other._low;
    };
    UINT32.prototype.or = function(other) {
      this._low |= other._low;
      this._high |= other._high;
      return this;
    };
    UINT32.prototype.and = function(other) {
      this._low &= other._low;
      this._high &= other._high;
      return this;
    };
    UINT32.prototype.not = function() {
      this._low = ~this._low & 65535;
      this._high = ~this._high & 65535;
      return this;
    };
    UINT32.prototype.xor = function(other) {
      this._low ^= other._low;
      this._high ^= other._high;
      return this;
    };
    UINT32.prototype.shiftRight = UINT32.prototype.shiftr = function(n) {
      if (n > 16) {
        this._low = this._high >> n - 16;
        this._high = 0;
      } else if (n == 16) {
        this._low = this._high;
        this._high = 0;
      } else {
        this._low = this._low >> n | this._high << 16 - n & 65535;
        this._high >>= n;
      }
      return this;
    };
    UINT32.prototype.shiftLeft = UINT32.prototype.shiftl = function(n, allowOverflow) {
      if (n > 16) {
        this._high = this._low << n - 16;
        this._low = 0;
        if (!allowOverflow) {
          this._high &= 65535;
        }
      } else if (n == 16) {
        this._high = this._low;
        this._low = 0;
      } else {
        this._high = this._high << n | this._low >> 16 - n;
        this._low = this._low << n & 65535;
        if (!allowOverflow) {
          this._high &= 65535;
        }
      }
      return this;
    };
    UINT32.prototype.rotateLeft = UINT32.prototype.rotl = function(n) {
      var v = this._high << 16 | this._low;
      v = v << n | v >>> 32 - n;
      this._low = v & 65535;
      this._high = v >>> 16;
      return this;
    };
    UINT32.prototype.rotateRight = UINT32.prototype.rotr = function(n) {
      var v = this._high << 16 | this._low;
      v = v >>> n | v << 32 - n;
      this._low = v & 65535;
      this._high = v >>> 16;
      return this;
    };
    UINT32.prototype.clone = function() {
      return new UINT32(this._low, this._high);
    };
    if (typeof define != "undefined" && define.amd) {
      define([], function() {
        return UINT32;
      });
    } else if (typeof module != "undefined" && module.exports) {
      module.exports = UINT32;
    } else {
      root["UINT32"] = UINT32;
    }
  })(exports);
});

// node_modules/cuint/lib/uint64.js
var require_uint64 = __commonJS((exports, module) => {
  (function(root) {
    var radixPowerCache = {
      16: UINT64(Math.pow(16, 5)),
      10: UINT64(Math.pow(10, 5)),
      2: UINT64(Math.pow(2, 5))
    };
    var radixCache = {
      16: UINT64(16),
      10: UINT64(10),
      2: UINT64(2)
    };
    function UINT64(a00, a16, a32, a48) {
      if (!(this instanceof UINT64))
        return new UINT64(a00, a16, a32, a48);
      this.remainder = null;
      if (typeof a00 == "string")
        return fromString.call(this, a00, a16);
      if (typeof a16 == "undefined")
        return fromNumber.call(this, a00);
      fromBits.apply(this, arguments);
    }
    function fromBits(a00, a16, a32, a48) {
      if (typeof a32 == "undefined") {
        this._a00 = a00 & 65535;
        this._a16 = a00 >>> 16;
        this._a32 = a16 & 65535;
        this._a48 = a16 >>> 16;
        return this;
      }
      this._a00 = a00 | 0;
      this._a16 = a16 | 0;
      this._a32 = a32 | 0;
      this._a48 = a48 | 0;
      return this;
    }
    UINT64.prototype.fromBits = fromBits;
    function fromNumber(value) {
      this._a00 = value & 65535;
      this._a16 = value >>> 16;
      this._a32 = 0;
      this._a48 = 0;
      return this;
    }
    UINT64.prototype.fromNumber = fromNumber;
    function fromString(s, radix) {
      radix = radix || 10;
      this._a00 = 0;
      this._a16 = 0;
      this._a32 = 0;
      this._a48 = 0;
      var radixUint = radixPowerCache[radix] || new UINT64(Math.pow(radix, 5));
      for (var i = 0, len = s.length;i < len; i += 5) {
        var size = Math.min(5, len - i);
        var value = parseInt(s.slice(i, i + size), radix);
        this.multiply(size < 5 ? new UINT64(Math.pow(radix, size)) : radixUint).add(new UINT64(value));
      }
      return this;
    }
    UINT64.prototype.fromString = fromString;
    UINT64.prototype.toNumber = function() {
      return this._a16 * 65536 + this._a00;
    };
    UINT64.prototype.toString = function(radix) {
      radix = radix || 10;
      var radixUint = radixCache[radix] || new UINT64(radix);
      if (!this.gt(radixUint))
        return this.toNumber().toString(radix);
      var self2 = this.clone();
      var res = new Array(64);
      for (var i = 63;i >= 0; i--) {
        self2.div(radixUint);
        res[i] = self2.remainder.toNumber().toString(radix);
        if (!self2.gt(radixUint))
          break;
      }
      res[i - 1] = self2.toNumber().toString(radix);
      return res.join("");
    };
    UINT64.prototype.add = function(other) {
      var a00 = this._a00 + other._a00;
      var a16 = a00 >>> 16;
      a16 += this._a16 + other._a16;
      var a32 = a16 >>> 16;
      a32 += this._a32 + other._a32;
      var a48 = a32 >>> 16;
      a48 += this._a48 + other._a48;
      this._a00 = a00 & 65535;
      this._a16 = a16 & 65535;
      this._a32 = a32 & 65535;
      this._a48 = a48 & 65535;
      return this;
    };
    UINT64.prototype.subtract = function(other) {
      return this.add(other.clone().negate());
    };
    UINT64.prototype.multiply = function(other) {
      var a00 = this._a00;
      var a16 = this._a16;
      var a32 = this._a32;
      var a48 = this._a48;
      var b00 = other._a00;
      var b16 = other._a16;
      var b32 = other._a32;
      var b48 = other._a48;
      var c00 = a00 * b00;
      var c16 = c00 >>> 16;
      c16 += a00 * b16;
      var c32 = c16 >>> 16;
      c16 &= 65535;
      c16 += a16 * b00;
      c32 += c16 >>> 16;
      c32 += a00 * b32;
      var c48 = c32 >>> 16;
      c32 &= 65535;
      c32 += a16 * b16;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a32 * b00;
      c48 += c32 >>> 16;
      c48 += a00 * b48;
      c48 &= 65535;
      c48 += a16 * b32;
      c48 &= 65535;
      c48 += a32 * b16;
      c48 &= 65535;
      c48 += a48 * b00;
      this._a00 = c00 & 65535;
      this._a16 = c16 & 65535;
      this._a32 = c32 & 65535;
      this._a48 = c48 & 65535;
      return this;
    };
    UINT64.prototype.div = function(other) {
      if (other._a16 == 0 && other._a32 == 0 && other._a48 == 0) {
        if (other._a00 == 0)
          throw Error("division by zero");
        if (other._a00 == 1) {
          this.remainder = new UINT64(0);
          return this;
        }
      }
      if (other.gt(this)) {
        this.remainder = this.clone();
        this._a00 = 0;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
        return this;
      }
      if (this.eq(other)) {
        this.remainder = new UINT64(0);
        this._a00 = 1;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
        return this;
      }
      var _other = other.clone();
      var i = -1;
      while (!this.lt(_other)) {
        _other.shiftLeft(1, true);
        i++;
      }
      this.remainder = this.clone();
      this._a00 = 0;
      this._a16 = 0;
      this._a32 = 0;
      this._a48 = 0;
      for (;i >= 0; i--) {
        _other.shiftRight(1);
        if (!this.remainder.lt(_other)) {
          this.remainder.subtract(_other);
          if (i >= 48) {
            this._a48 |= 1 << i - 48;
          } else if (i >= 32) {
            this._a32 |= 1 << i - 32;
          } else if (i >= 16) {
            this._a16 |= 1 << i - 16;
          } else {
            this._a00 |= 1 << i;
          }
        }
      }
      return this;
    };
    UINT64.prototype.negate = function() {
      var v = (~this._a00 & 65535) + 1;
      this._a00 = v & 65535;
      v = (~this._a16 & 65535) + (v >>> 16);
      this._a16 = v & 65535;
      v = (~this._a32 & 65535) + (v >>> 16);
      this._a32 = v & 65535;
      this._a48 = ~this._a48 + (v >>> 16) & 65535;
      return this;
    };
    UINT64.prototype.equals = UINT64.prototype.eq = function(other) {
      return this._a48 == other._a48 && this._a00 == other._a00 && this._a32 == other._a32 && this._a16 == other._a16;
    };
    UINT64.prototype.greaterThan = UINT64.prototype.gt = function(other) {
      if (this._a48 > other._a48)
        return true;
      if (this._a48 < other._a48)
        return false;
      if (this._a32 > other._a32)
        return true;
      if (this._a32 < other._a32)
        return false;
      if (this._a16 > other._a16)
        return true;
      if (this._a16 < other._a16)
        return false;
      return this._a00 > other._a00;
    };
    UINT64.prototype.lessThan = UINT64.prototype.lt = function(other) {
      if (this._a48 < other._a48)
        return true;
      if (this._a48 > other._a48)
        return false;
      if (this._a32 < other._a32)
        return true;
      if (this._a32 > other._a32)
        return false;
      if (this._a16 < other._a16)
        return true;
      if (this._a16 > other._a16)
        return false;
      return this._a00 < other._a00;
    };
    UINT64.prototype.or = function(other) {
      this._a00 |= other._a00;
      this._a16 |= other._a16;
      this._a32 |= other._a32;
      this._a48 |= other._a48;
      return this;
    };
    UINT64.prototype.and = function(other) {
      this._a00 &= other._a00;
      this._a16 &= other._a16;
      this._a32 &= other._a32;
      this._a48 &= other._a48;
      return this;
    };
    UINT64.prototype.xor = function(other) {
      this._a00 ^= other._a00;
      this._a16 ^= other._a16;
      this._a32 ^= other._a32;
      this._a48 ^= other._a48;
      return this;
    };
    UINT64.prototype.not = function() {
      this._a00 = ~this._a00 & 65535;
      this._a16 = ~this._a16 & 65535;
      this._a32 = ~this._a32 & 65535;
      this._a48 = ~this._a48 & 65535;
      return this;
    };
    UINT64.prototype.shiftRight = UINT64.prototype.shiftr = function(n) {
      n %= 64;
      if (n >= 48) {
        this._a00 = this._a48 >> n - 48;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
      } else if (n >= 32) {
        n -= 32;
        this._a00 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a16 = this._a48 >> n & 65535;
        this._a32 = 0;
        this._a48 = 0;
      } else if (n >= 16) {
        n -= 16;
        this._a00 = (this._a16 >> n | this._a32 << 16 - n) & 65535;
        this._a16 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a32 = this._a48 >> n & 65535;
        this._a48 = 0;
      } else {
        this._a00 = (this._a00 >> n | this._a16 << 16 - n) & 65535;
        this._a16 = (this._a16 >> n | this._a32 << 16 - n) & 65535;
        this._a32 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a48 = this._a48 >> n & 65535;
      }
      return this;
    };
    UINT64.prototype.shiftLeft = UINT64.prototype.shiftl = function(n, allowOverflow) {
      n %= 64;
      if (n >= 48) {
        this._a48 = this._a00 << n - 48;
        this._a32 = 0;
        this._a16 = 0;
        this._a00 = 0;
      } else if (n >= 32) {
        n -= 32;
        this._a48 = this._a16 << n | this._a00 >> 16 - n;
        this._a32 = this._a00 << n & 65535;
        this._a16 = 0;
        this._a00 = 0;
      } else if (n >= 16) {
        n -= 16;
        this._a48 = this._a32 << n | this._a16 >> 16 - n;
        this._a32 = (this._a16 << n | this._a00 >> 16 - n) & 65535;
        this._a16 = this._a00 << n & 65535;
        this._a00 = 0;
      } else {
        this._a48 = this._a48 << n | this._a32 >> 16 - n;
        this._a32 = (this._a32 << n | this._a16 >> 16 - n) & 65535;
        this._a16 = (this._a16 << n | this._a00 >> 16 - n) & 65535;
        this._a00 = this._a00 << n & 65535;
      }
      if (!allowOverflow) {
        this._a48 &= 65535;
      }
      return this;
    };
    UINT64.prototype.rotateLeft = UINT64.prototype.rotl = function(n) {
      n %= 64;
      if (n == 0)
        return this;
      if (n >= 32) {
        var v = this._a00;
        this._a00 = this._a32;
        this._a32 = v;
        v = this._a48;
        this._a48 = this._a16;
        this._a16 = v;
        if (n == 32)
          return this;
        n -= 32;
      }
      var high = this._a48 << 16 | this._a32;
      var low = this._a16 << 16 | this._a00;
      var _high = high << n | low >>> 32 - n;
      var _low = low << n | high >>> 32 - n;
      this._a00 = _low & 65535;
      this._a16 = _low >>> 16;
      this._a32 = _high & 65535;
      this._a48 = _high >>> 16;
      return this;
    };
    UINT64.prototype.rotateRight = UINT64.prototype.rotr = function(n) {
      n %= 64;
      if (n == 0)
        return this;
      if (n >= 32) {
        var v = this._a00;
        this._a00 = this._a32;
        this._a32 = v;
        v = this._a48;
        this._a48 = this._a16;
        this._a16 = v;
        if (n == 32)
          return this;
        n -= 32;
      }
      var high = this._a48 << 16 | this._a32;
      var low = this._a16 << 16 | this._a00;
      var _high = high >>> n | low << 32 - n;
      var _low = low >>> n | high << 32 - n;
      this._a00 = _low & 65535;
      this._a16 = _low >>> 16;
      this._a32 = _high & 65535;
      this._a48 = _high >>> 16;
      return this;
    };
    UINT64.prototype.clone = function() {
      return new UINT64(this._a00, this._a16, this._a32, this._a48);
    };
    if (typeof define != "undefined" && define.amd) {
      define([], function() {
        return UINT64;
      });
    } else if (typeof module != "undefined" && module.exports) {
      module.exports = UINT64;
    } else {
      root["UINT64"] = UINT64;
    }
  })(exports);
});

// node_modules/cuint/index.js
var require_cuint = __commonJS((exports) => {
  exports.UINT32 = require_uint32();
  exports.UINT64 = require_uint64();
});

// node_modules/xxhashjs/lib/xxhash.js
var require_xxhash = __commonJS((exports, module) => {
  var UINT32 = require_cuint().UINT32;
  UINT32.prototype.xxh_update = function(low, high) {
    var b00 = PRIME32_2._low;
    var b16 = PRIME32_2._high;
    var c16, c00;
    c00 = low * b00;
    c16 = c00 >>> 16;
    c16 += high * b00;
    c16 &= 65535;
    c16 += low * b16;
    var a00 = this._low + (c00 & 65535);
    var a16 = a00 >>> 16;
    a16 += this._high + (c16 & 65535);
    var v = a16 << 16 | a00 & 65535;
    v = v << 13 | v >>> 19;
    a00 = v & 65535;
    a16 = v >>> 16;
    b00 = PRIME32_1._low;
    b16 = PRIME32_1._high;
    c00 = a00 * b00;
    c16 = c00 >>> 16;
    c16 += a16 * b00;
    c16 &= 65535;
    c16 += a00 * b16;
    this._low = c00 & 65535;
    this._high = c16 & 65535;
  };
  var PRIME32_1 = UINT32("2654435761");
  var PRIME32_2 = UINT32("2246822519");
  var PRIME32_3 = UINT32("3266489917");
  var PRIME32_4 = UINT32("668265263");
  var PRIME32_5 = UINT32("374761393");
  function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0, n = str.length;i < n; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128)
        utf8.push(charcode);
      else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      } else {
        i++;
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return new Uint8Array(utf8);
  }
  function XXH() {
    if (arguments.length == 2)
      return new XXH(arguments[1]).update(arguments[0]).digest();
    if (!(this instanceof XXH))
      return new XXH(arguments[0]);
    init.call(this, arguments[0]);
  }
  function init(seed) {
    this.seed = seed instanceof UINT32 ? seed.clone() : UINT32(seed);
    this.v1 = this.seed.clone().add(PRIME32_1).add(PRIME32_2);
    this.v2 = this.seed.clone().add(PRIME32_2);
    this.v3 = this.seed.clone();
    this.v4 = this.seed.clone().subtract(PRIME32_1);
    this.total_len = 0;
    this.memsize = 0;
    this.memory = null;
    return this;
  }
  XXH.prototype.init = init;
  XXH.prototype.update = function(input) {
    var isString = typeof input == "string";
    var isArrayBuffer;
    if (isString) {
      input = toUTF8Array(input);
      isString = false;
      isArrayBuffer = true;
    }
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
      isArrayBuffer = true;
      input = new Uint8Array(input);
    }
    var p = 0;
    var len = input.length;
    var bEnd = p + len;
    if (len == 0)
      return this;
    this.total_len += len;
    if (this.memsize == 0) {
      if (isString) {
        this.memory = "";
      } else if (isArrayBuffer) {
        this.memory = new Uint8Array(16);
      } else {
        this.memory = new Buffer(16);
      }
    }
    if (this.memsize + len < 16) {
      if (isString) {
        this.memory += input;
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, len), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, len);
      }
      this.memsize += len;
      return this;
    }
    if (this.memsize > 0) {
      if (isString) {
        this.memory += input.slice(0, 16 - this.memsize);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, 16 - this.memsize), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, 16 - this.memsize);
      }
      var p32 = 0;
      if (isString) {
        this.v1.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v2.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v3.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v4.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
      } else {
        this.v1.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v2.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v3.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v4.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
      }
      p += 16 - this.memsize;
      this.memsize = 0;
      if (isString)
        this.memory = "";
    }
    if (p <= bEnd - 16) {
      var limit = bEnd - 16;
      do {
        if (isString) {
          this.v1.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v2.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v3.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v4.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
        } else {
          this.v1.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v2.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v3.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v4.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
        }
        p += 4;
      } while (p <= limit);
    }
    if (p < bEnd) {
      if (isString) {
        this.memory += input.slice(p);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(p, bEnd), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, p, bEnd);
      }
      this.memsize = bEnd - p;
    }
    return this;
  };
  XXH.prototype.digest = function() {
    var input = this.memory;
    var isString = typeof input == "string";
    var p = 0;
    var bEnd = this.memsize;
    var h32, h;
    var u = new UINT32;
    if (this.total_len >= 16) {
      h32 = this.v1.rotl(1).add(this.v2.rotl(7).add(this.v3.rotl(12).add(this.v4.rotl(18))));
    } else {
      h32 = this.seed.clone().add(PRIME32_5);
    }
    h32.add(u.fromNumber(this.total_len));
    while (p <= bEnd - 4) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
      }
      h32.add(u.multiply(PRIME32_3)).rotl(17).multiply(PRIME32_4);
      p += 4;
    }
    while (p < bEnd) {
      u.fromBits(isString ? input.charCodeAt(p++) : input[p++], 0);
      h32.add(u.multiply(PRIME32_5)).rotl(11).multiply(PRIME32_1);
    }
    h = h32.clone().shiftRight(15);
    h32.xor(h).multiply(PRIME32_2);
    h = h32.clone().shiftRight(13);
    h32.xor(h).multiply(PRIME32_3);
    h = h32.clone().shiftRight(16);
    h32.xor(h);
    this.init(this.seed);
    return h32;
  };
  module.exports = XXH;
});

// node_modules/xxhashjs/lib/xxhash64.js
var require_xxhash64 = __commonJS((exports, module) => {
  var UINT64 = require_cuint().UINT64;
  var PRIME64_1 = UINT64("11400714785074694791");
  var PRIME64_2 = UINT64("14029467366897019727");
  var PRIME64_3 = UINT64("1609587929392839161");
  var PRIME64_4 = UINT64("9650029242287828579");
  var PRIME64_5 = UINT64("2870177450012600261");
  function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0, n = str.length;i < n; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128)
        utf8.push(charcode);
      else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      } else {
        i++;
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return new Uint8Array(utf8);
  }
  function XXH64() {
    if (arguments.length == 2)
      return new XXH64(arguments[1]).update(arguments[0]).digest();
    if (!(this instanceof XXH64))
      return new XXH64(arguments[0]);
    init.call(this, arguments[0]);
  }
  function init(seed) {
    this.seed = seed instanceof UINT64 ? seed.clone() : UINT64(seed);
    this.v1 = this.seed.clone().add(PRIME64_1).add(PRIME64_2);
    this.v2 = this.seed.clone().add(PRIME64_2);
    this.v3 = this.seed.clone();
    this.v4 = this.seed.clone().subtract(PRIME64_1);
    this.total_len = 0;
    this.memsize = 0;
    this.memory = null;
    return this;
  }
  XXH64.prototype.init = init;
  XXH64.prototype.update = function(input) {
    var isString = typeof input == "string";
    var isArrayBuffer;
    if (isString) {
      input = toUTF8Array(input);
      isString = false;
      isArrayBuffer = true;
    }
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
      isArrayBuffer = true;
      input = new Uint8Array(input);
    }
    var p = 0;
    var len = input.length;
    var bEnd = p + len;
    if (len == 0)
      return this;
    this.total_len += len;
    if (this.memsize == 0) {
      if (isString) {
        this.memory = "";
      } else if (isArrayBuffer) {
        this.memory = new Uint8Array(32);
      } else {
        this.memory = new Buffer(32);
      }
    }
    if (this.memsize + len < 32) {
      if (isString) {
        this.memory += input;
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, len), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, len);
      }
      this.memsize += len;
      return this;
    }
    if (this.memsize > 0) {
      if (isString) {
        this.memory += input.slice(0, 32 - this.memsize);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, 32 - this.memsize), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, 32 - this.memsize);
      }
      var p64 = 0;
      if (isString) {
        var other;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      } else {
        var other;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      }
      p += 32 - this.memsize;
      this.memsize = 0;
      if (isString)
        this.memory = "";
    }
    if (p <= bEnd - 32) {
      var limit = bEnd - 32;
      do {
        if (isString) {
          var other;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        } else {
          var other;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        }
        p += 8;
      } while (p <= limit);
    }
    if (p < bEnd) {
      if (isString) {
        this.memory += input.slice(p);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(p, bEnd), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, p, bEnd);
      }
      this.memsize = bEnd - p;
    }
    return this;
  };
  XXH64.prototype.digest = function() {
    var input = this.memory;
    var isString = typeof input == "string";
    var p = 0;
    var bEnd = this.memsize;
    var h64, h;
    var u = new UINT64;
    if (this.total_len >= 32) {
      h64 = this.v1.clone().rotl(1);
      h64.add(this.v2.clone().rotl(7));
      h64.add(this.v3.clone().rotl(12));
      h64.add(this.v4.clone().rotl(18));
      h64.xor(this.v1.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v2.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v3.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v4.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
    } else {
      h64 = this.seed.clone().add(PRIME64_5);
    }
    h64.add(u.fromNumber(this.total_len));
    while (p <= bEnd - 8) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
      }
      u.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1);
      h64.xor(u).rotl(27).multiply(PRIME64_1).add(PRIME64_4);
      p += 8;
    }
    if (p + 4 <= bEnd) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), 0, 0);
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], 0, 0);
      }
      h64.xor(u.multiply(PRIME64_1)).rotl(23).multiply(PRIME64_2).add(PRIME64_3);
      p += 4;
    }
    while (p < bEnd) {
      u.fromBits(isString ? input.charCodeAt(p++) : input[p++], 0, 0, 0);
      h64.xor(u.multiply(PRIME64_5)).rotl(11).multiply(PRIME64_1);
    }
    h = h64.clone().shiftRight(33);
    h64.xor(h).multiply(PRIME64_2);
    h = h64.clone().shiftRight(29);
    h64.xor(h).multiply(PRIME64_3);
    h = h64.clone().shiftRight(32);
    h64.xor(h);
    this.init(this.seed);
    return h64;
  };
  module.exports = XXH64;
});

// node_modules/xxhashjs/lib/index.js
var require_lib = __commonJS((exports, module) => {
  module.exports = {
    h32: require_xxhash(),
    h64: require_xxhash64()
  };
});

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS((exports, module) => {
  var has = Object.prototype.hasOwnProperty;
  var prefix = "~";
  function Events() {
  }
  if (Object.create) {
    Events.prototype = Object.create(null);
    if (!new Events().__proto__)
      prefix = false;
  }
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt])
      emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn)
      emitter._events[evt].push(listener);
    else
      emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
  }
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0)
      emitter._events = new Events;
    else
      delete emitter._events[evt];
  }
  function EventEmitter() {
    this._events = new Events;
    this._eventsCount = 0;
  }
  EventEmitter.prototype.eventNames = function eventNames() {
    var names = [], events, name;
    if (this._eventsCount === 0)
      return names;
    for (name in events = this._events) {
      if (has.call(events, name))
        names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }
    return names;
  };
  EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event, handlers = this._events[evt];
    if (!handlers)
      return [];
    if (handlers.fn)
      return [handlers.fn];
    for (var i = 0, l = handlers.length, ee = new Array(l);i < l; i++) {
      ee[i] = handlers[i].fn;
    }
    return ee;
  };
  EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event, listeners = this._events[evt];
    if (!listeners)
      return 0;
    if (listeners.fn)
      return 1;
    return listeners.length;
  };
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return false;
    var listeners = this._events[evt], len = arguments.length, args, i;
    if (listeners.fn) {
      if (listeners.once)
        this.removeListener(event, listeners.fn, undefined, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i = 1, args = new Array(len - 1);i < len; i++) {
        args[i - 1] = arguments[i];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length, j;
      for (i = 0;i < length; i++) {
        if (listeners[i].once)
          this.removeListener(event, listeners[i].fn, undefined, true);
        switch (len) {
          case 1:
            listeners[i].fn.call(listeners[i].context);
            break;
          case 2:
            listeners[i].fn.call(listeners[i].context, a1);
            break;
          case 3:
            listeners[i].fn.call(listeners[i].context, a1, a2);
            break;
          case 4:
            listeners[i].fn.call(listeners[i].context, a1, a2, a3);
            break;
          default:
            if (!args)
              for (j = 1, args = new Array(len - 1);j < len; j++) {
                args[j - 1] = arguments[j];
              }
            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }
    return true;
  };
  EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };
  EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt])
      return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        clearEvent(this, evt);
      }
    } else {
      for (var i = 0, events = [], length = listeners.length;i < length; i++) {
        if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
          events.push(listeners[i]);
        }
      }
      if (events.length)
        this._events[evt] = events.length === 1 ? events[0] : events;
      else
        clearEvent(this, evt);
    }
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt])
        clearEvent(this, evt);
    } else {
      this._events = new Events;
      this._eventsCount = 0;
    }
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  EventEmitter.prefixed = prefix;
  EventEmitter.EventEmitter = EventEmitter;
  if (typeof module !== "undefined") {
    module.exports = EventEmitter;
  }
});

// node:buffer
var exports_buffer = {};
__export(exports_buffer, {
  transcode: () => yt,
  resolveObjectURL: () => at,
  kStringMaxLength: () => K,
  kMaxLength: () => nt,
  isUtf8: () => st,
  isAscii: () => pt,
  default: () => export_default,
  createObjectURL: () => ct,
  constants: () => lt,
  btoa: () => ft,
  atob: () => ht,
  File: () => ut,
  Buffer: () => export_Buffer,
  Blob: () => ot
});
function at(i) {
  throw new Error("Not implemented");
}
function yt(i, r, t) {
  throw new Error("Not implemented");
}
var gr, $, mr, Ir, Fr, Ar, P = (i, r) => () => (r || i((r = { exports: {} }).exports, r), r.exports), Ur = (i, r) => {
  for (var t in r)
    $(i, t, { get: r[t], enumerable: true });
}, D = (i, r, t, e) => {
  if (r && typeof r == "object" || typeof r == "function")
    for (let n of Ir(r))
      !Ar.call(i, n) && n !== t && $(i, n, { get: () => r[n], enumerable: !(e = mr(r, n)) || e.enumerable });
  return i;
}, w = (i, r, t) => (D(i, r, "default"), t && D(t, r, "default")), O = (i, r, t) => (t = i != null ? gr(Fr(i)) : {}, D(r || !i || !i.__esModule ? $(t, "default", { value: i, enumerable: true }) : t, i)), v, rr, b, y, Br, Er, K, nt = 9007199254740991, ot, ut, ht, ft, ct, pt = (i) => ArrayBuffer.isView(i) ? i.every((r) => r < 128) : i.split("").every((r) => r.charCodeAt(0) < 128), st = (i) => {
  throw new Error("Not implemented");
}, lt, export_Buffer, export_default;
var init_buffer = __esm(() => {
  gr = Object.create;
  $ = Object.defineProperty;
  mr = Object.getOwnPropertyDescriptor;
  Ir = Object.getOwnPropertyNames;
  Fr = Object.getPrototypeOf;
  Ar = Object.prototype.hasOwnProperty;
  v = P((L) => {
    L.byteLength = Tr;
    L.toByteArray = _r;
    L.fromByteArray = Nr;
    var d = [], B = [], Rr = typeof Uint8Array < "u" ? Uint8Array : Array, G = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (F = 0, Z = G.length;F < Z; ++F)
      d[F] = G[F], B[G.charCodeAt(F)] = F;
    var F, Z;
    B[45] = 62;
    B[95] = 63;
    function Q(i) {
      var r = i.length;
      if (r % 4 > 0)
        throw new Error("Invalid string. Length must be a multiple of 4");
      var t = i.indexOf("=");
      t === -1 && (t = r);
      var e = t === r ? 0 : 4 - t % 4;
      return [t, e];
    }
    function Tr(i) {
      var r = Q(i), t = r[0], e = r[1];
      return (t + e) * 3 / 4 - e;
    }
    function Cr(i, r, t) {
      return (r + t) * 3 / 4 - t;
    }
    function _r(i) {
      var r, t = Q(i), e = t[0], n = t[1], o = new Rr(Cr(i, e, n)), u = 0, f = n > 0 ? e - 4 : e, c;
      for (c = 0;c < f; c += 4)
        r = B[i.charCodeAt(c)] << 18 | B[i.charCodeAt(c + 1)] << 12 | B[i.charCodeAt(c + 2)] << 6 | B[i.charCodeAt(c + 3)], o[u++] = r >> 16 & 255, o[u++] = r >> 8 & 255, o[u++] = r & 255;
      return n === 2 && (r = B[i.charCodeAt(c)] << 2 | B[i.charCodeAt(c + 1)] >> 4, o[u++] = r & 255), n === 1 && (r = B[i.charCodeAt(c)] << 10 | B[i.charCodeAt(c + 1)] << 4 | B[i.charCodeAt(c + 2)] >> 2, o[u++] = r >> 8 & 255, o[u++] = r & 255), o;
    }
    function Sr(i) {
      return d[i >> 18 & 63] + d[i >> 12 & 63] + d[i >> 6 & 63] + d[i & 63];
    }
    function Lr(i, r, t) {
      for (var e, n = [], o = r;o < t; o += 3)
        e = (i[o] << 16 & 16711680) + (i[o + 1] << 8 & 65280) + (i[o + 2] & 255), n.push(Sr(e));
      return n.join("");
    }
    function Nr(i) {
      for (var r, t = i.length, e = t % 3, n = [], o = 16383, u = 0, f = t - e;u < f; u += o)
        n.push(Lr(i, u, u + o > f ? f : u + o));
      return e === 1 ? (r = i[t - 1], n.push(d[r >> 2] + d[r << 4 & 63] + "==")) : e === 2 && (r = (i[t - 2] << 8) + i[t - 1], n.push(d[r >> 10] + d[r >> 4 & 63] + d[r << 2 & 63] + "=")), n.join("");
    }
  });
  rr = P((Y) => {
    Y.read = function(i, r, t, e, n) {
      var o, u, f = n * 8 - e - 1, c = (1 << f) - 1, l = c >> 1, s = -7, p = t ? n - 1 : 0, U = t ? -1 : 1, E = i[r + p];
      for (p += U, o = E & (1 << -s) - 1, E >>= -s, s += f;s > 0; o = o * 256 + i[r + p], p += U, s -= 8)
        ;
      for (u = o & (1 << -s) - 1, o >>= -s, s += e;s > 0; u = u * 256 + i[r + p], p += U, s -= 8)
        ;
      if (o === 0)
        o = 1 - l;
      else {
        if (o === c)
          return u ? NaN : (E ? -1 : 1) * (1 / 0);
        u = u + Math.pow(2, e), o = o - l;
      }
      return (E ? -1 : 1) * u * Math.pow(2, o - e);
    };
    Y.write = function(i, r, t, e, n, o) {
      var u, f, c, l = o * 8 - n - 1, s = (1 << l) - 1, p = s >> 1, U = n === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, E = e ? 0 : o - 1, k = e ? 1 : -1, dr = r < 0 || r === 0 && 1 / r < 0 ? 1 : 0;
      for (r = Math.abs(r), isNaN(r) || r === 1 / 0 ? (f = isNaN(r) ? 1 : 0, u = s) : (u = Math.floor(Math.log(r) / Math.LN2), r * (c = Math.pow(2, -u)) < 1 && (u--, c *= 2), u + p >= 1 ? r += U / c : r += U * Math.pow(2, 1 - p), r * c >= 2 && (u++, c /= 2), u + p >= s ? (f = 0, u = s) : u + p >= 1 ? (f = (r * c - 1) * Math.pow(2, n), u = u + p) : (f = r * Math.pow(2, p - 1) * Math.pow(2, n), u = 0));n >= 8; i[t + E] = f & 255, E += k, f /= 256, n -= 8)
        ;
      for (u = u << n | f, l += n;l > 0; i[t + E] = u & 255, E += k, u /= 256, l -= 8)
        ;
      i[t + E - k] |= dr * 128;
    };
  });
  b = P((_) => {
    var j = v(), T = rr(), tr = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
    _.Buffer = h;
    _.SlowBuffer = Pr;
    _.INSPECT_MAX_BYTES = 50;
    var N = 2147483647;
    _.kMaxLength = N;
    h.TYPED_ARRAY_SUPPORT = Mr();
    !h.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
    function Mr() {
      try {
        let i = new Uint8Array(1), r = { foo: function() {
          return 42;
        } };
        return Object.setPrototypeOf(r, Uint8Array.prototype), Object.setPrototypeOf(i, r), i.foo() === 42;
      } catch {
        return false;
      }
    }
    Object.defineProperty(h.prototype, "parent", { enumerable: true, get: function() {
      if (!!h.isBuffer(this))
        return this.buffer;
    } });
    Object.defineProperty(h.prototype, "offset", { enumerable: true, get: function() {
      if (!!h.isBuffer(this))
        return this.byteOffset;
    } });
    function m(i) {
      if (i > N)
        throw new RangeError('The value "' + i + '" is invalid for option "size"');
      let r = new Uint8Array(i);
      return Object.setPrototypeOf(r, h.prototype), r;
    }
    function h(i, r, t) {
      if (typeof i == "number") {
        if (typeof r == "string")
          throw new TypeError('The "string" argument must be of type string. Received type number');
        return X(i);
      }
      return or(i, r, t);
    }
    h.poolSize = 8192;
    function or(i, r, t) {
      if (typeof i == "string")
        return kr(i, r);
      if (ArrayBuffer.isView(i))
        return Dr(i);
      if (i == null)
        throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof i);
      if (g(i, ArrayBuffer) || i && g(i.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (g(i, SharedArrayBuffer) || i && g(i.buffer, SharedArrayBuffer)))
        return W(i, r, t);
      if (typeof i == "number")
        throw new TypeError('The "value" argument must not be of type number. Received type number');
      let e = i.valueOf && i.valueOf();
      if (e != null && e !== i)
        return h.from(e, r, t);
      let n = $r(i);
      if (n)
        return n;
      if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof i[Symbol.toPrimitive] == "function")
        return h.from(i[Symbol.toPrimitive]("string"), r, t);
      throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof i);
    }
    h.from = function(i, r, t) {
      return or(i, r, t);
    };
    Object.setPrototypeOf(h.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(h, Uint8Array);
    function ur(i) {
      if (typeof i != "number")
        throw new TypeError('"size" argument must be of type number');
      if (i < 0)
        throw new RangeError('The value "' + i + '" is invalid for option "size"');
    }
    function br(i, r, t) {
      return ur(i), i <= 0 ? m(i) : r !== undefined ? typeof t == "string" ? m(i).fill(r, t) : m(i).fill(r) : m(i);
    }
    h.alloc = function(i, r, t) {
      return br(i, r, t);
    };
    function X(i) {
      return ur(i), m(i < 0 ? 0 : V(i) | 0);
    }
    h.allocUnsafe = function(i) {
      return X(i);
    };
    h.allocUnsafeSlow = function(i) {
      return X(i);
    };
    function kr(i, r) {
      if ((typeof r != "string" || r === "") && (r = "utf8"), !h.isEncoding(r))
        throw new TypeError("Unknown encoding: " + r);
      let t = hr(i, r) | 0, e = m(t), n = e.write(i, r);
      return n !== t && (e = e.slice(0, n)), e;
    }
    function q(i) {
      let r = i.length < 0 ? 0 : V(i.length) | 0, t = m(r);
      for (let e = 0;e < r; e += 1)
        t[e] = i[e] & 255;
      return t;
    }
    function Dr(i) {
      if (g(i, Uint8Array)) {
        let r = new Uint8Array(i);
        return W(r.buffer, r.byteOffset, r.byteLength);
      }
      return q(i);
    }
    function W(i, r, t) {
      if (r < 0 || i.byteLength < r)
        throw new RangeError('"offset" is outside of buffer bounds');
      if (i.byteLength < r + (t || 0))
        throw new RangeError('"length" is outside of buffer bounds');
      let e;
      return r === undefined && t === undefined ? e = new Uint8Array(i) : t === undefined ? e = new Uint8Array(i, r) : e = new Uint8Array(i, r, t), Object.setPrototypeOf(e, h.prototype), e;
    }
    function $r(i) {
      if (h.isBuffer(i)) {
        let r = V(i.length) | 0, t = m(r);
        return t.length === 0 || i.copy(t, 0, 0, r), t;
      }
      if (i.length !== undefined)
        return typeof i.length != "number" || J(i.length) ? m(0) : q(i);
      if (i.type === "Buffer" && Array.isArray(i.data))
        return q(i.data);
    }
    function V(i) {
      if (i >= N)
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + N.toString(16) + " bytes");
      return i | 0;
    }
    function Pr(i) {
      return +i != i && (i = 0), h.alloc(+i);
    }
    h.isBuffer = function(r) {
      return r != null && r._isBuffer === true && r !== h.prototype;
    };
    h.compare = function(r, t) {
      if (g(r, Uint8Array) && (r = h.from(r, r.offset, r.byteLength)), g(t, Uint8Array) && (t = h.from(t, t.offset, t.byteLength)), !h.isBuffer(r) || !h.isBuffer(t))
        throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
      if (r === t)
        return 0;
      let e = r.length, n = t.length;
      for (let o = 0, u = Math.min(e, n);o < u; ++o)
        if (r[o] !== t[o]) {
          e = r[o], n = t[o];
          break;
        }
      return e < n ? -1 : n < e ? 1 : 0;
    };
    h.isEncoding = function(r) {
      switch (String(r).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    h.concat = function(r, t) {
      if (!Array.isArray(r))
        throw new TypeError('"list" argument must be an Array of Buffers');
      if (r.length === 0)
        return h.alloc(0);
      let e;
      if (t === undefined)
        for (t = 0, e = 0;e < r.length; ++e)
          t += r[e].length;
      let n = h.allocUnsafe(t), o = 0;
      for (e = 0;e < r.length; ++e) {
        let u = r[e];
        if (g(u, Uint8Array))
          o + u.length > n.length ? (h.isBuffer(u) || (u = h.from(u)), u.copy(n, o)) : Uint8Array.prototype.set.call(n, u, o);
        else if (h.isBuffer(u))
          u.copy(n, o);
        else
          throw new TypeError('"list" argument must be an Array of Buffers');
        o += u.length;
      }
      return n;
    };
    function hr(i, r) {
      if (h.isBuffer(i))
        return i.length;
      if (ArrayBuffer.isView(i) || g(i, ArrayBuffer))
        return i.byteLength;
      if (typeof i != "string")
        throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof i);
      let t = i.length, e = arguments.length > 2 && arguments[2] === true;
      if (!e && t === 0)
        return 0;
      let n = false;
      for (;; )
        switch (r) {
          case "ascii":
          case "latin1":
          case "binary":
            return t;
          case "utf8":
          case "utf-8":
            return H(i).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return t * 2;
          case "hex":
            return t >>> 1;
          case "base64":
            return xr(i).length;
          default:
            if (n)
              return e ? -1 : H(i).length;
            r = ("" + r).toLowerCase(), n = true;
        }
    }
    h.byteLength = hr;
    function Or(i, r, t) {
      let e = false;
      if ((r === undefined || r < 0) && (r = 0), r > this.length || ((t === undefined || t > this.length) && (t = this.length), t <= 0) || (t >>>= 0, r >>>= 0, t <= r))
        return "";
      for (i || (i = "utf8");; )
        switch (i) {
          case "hex":
            return Jr(this, r, t);
          case "utf8":
          case "utf-8":
            return cr(this, r, t);
          case "ascii":
            return Vr(this, r, t);
          case "latin1":
          case "binary":
            return zr(this, r, t);
          case "base64":
            return Hr(this, r, t);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return Kr(this, r, t);
          default:
            if (e)
              throw new TypeError("Unknown encoding: " + i);
            i = (i + "").toLowerCase(), e = true;
        }
    }
    h.prototype._isBuffer = true;
    function A(i, r, t) {
      let e = i[r];
      i[r] = i[t], i[t] = e;
    }
    h.prototype.swap16 = function() {
      let r = this.length;
      if (r % 2 !== 0)
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      for (let t = 0;t < r; t += 2)
        A(this, t, t + 1);
      return this;
    };
    h.prototype.swap32 = function() {
      let r = this.length;
      if (r % 4 !== 0)
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      for (let t = 0;t < r; t += 4)
        A(this, t, t + 3), A(this, t + 1, t + 2);
      return this;
    };
    h.prototype.swap64 = function() {
      let r = this.length;
      if (r % 8 !== 0)
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (let t = 0;t < r; t += 8)
        A(this, t, t + 7), A(this, t + 1, t + 6), A(this, t + 2, t + 5), A(this, t + 3, t + 4);
      return this;
    };
    h.prototype.toString = function() {
      let r = this.length;
      return r === 0 ? "" : arguments.length === 0 ? cr(this, 0, r) : Or.apply(this, arguments);
    };
    h.prototype.toLocaleString = h.prototype.toString;
    h.prototype.equals = function(r) {
      if (!h.isBuffer(r))
        throw new TypeError("Argument must be a Buffer");
      return this === r ? true : h.compare(this, r) === 0;
    };
    h.prototype.inspect = function() {
      let r = "", t = _.INSPECT_MAX_BYTES;
      return r = this.toString("hex", 0, t).replace(/(.{2})/g, "$1 ").trim(), this.length > t && (r += " ... "), "<Buffer " + r + ">";
    };
    tr && (h.prototype[tr] = h.prototype.inspect);
    h.prototype.compare = function(r, t, e, n, o) {
      if (g(r, Uint8Array) && (r = h.from(r, r.offset, r.byteLength)), !h.isBuffer(r))
        throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof r);
      if (t === undefined && (t = 0), e === undefined && (e = r ? r.length : 0), n === undefined && (n = 0), o === undefined && (o = this.length), t < 0 || e > r.length || n < 0 || o > this.length)
        throw new RangeError("out of range index");
      if (n >= o && t >= e)
        return 0;
      if (n >= o)
        return -1;
      if (t >= e)
        return 1;
      if (t >>>= 0, e >>>= 0, n >>>= 0, o >>>= 0, this === r)
        return 0;
      let u = o - n, f = e - t, c = Math.min(u, f), l = this.slice(n, o), s = r.slice(t, e);
      for (let p = 0;p < c; ++p)
        if (l[p] !== s[p]) {
          u = l[p], f = s[p];
          break;
        }
      return u < f ? -1 : f < u ? 1 : 0;
    };
    function fr(i, r, t, e, n) {
      if (i.length === 0)
        return -1;
      if (typeof t == "string" ? (e = t, t = 0) : t > 2147483647 ? t = 2147483647 : t < -2147483648 && (t = -2147483648), t = +t, J(t) && (t = n ? 0 : i.length - 1), t < 0 && (t = i.length + t), t >= i.length) {
        if (n)
          return -1;
        t = i.length - 1;
      } else if (t < 0)
        if (n)
          t = 0;
        else
          return -1;
      if (typeof r == "string" && (r = h.from(r, e)), h.isBuffer(r))
        return r.length === 0 ? -1 : ir(i, r, t, e, n);
      if (typeof r == "number")
        return r = r & 255, typeof Uint8Array.prototype.indexOf == "function" ? n ? Uint8Array.prototype.indexOf.call(i, r, t) : Uint8Array.prototype.lastIndexOf.call(i, r, t) : ir(i, [r], t, e, n);
      throw new TypeError("val must be string, number or Buffer");
    }
    function ir(i, r, t, e, n) {
      let o = 1, u = i.length, f = r.length;
      if (e !== undefined && (e = String(e).toLowerCase(), e === "ucs2" || e === "ucs-2" || e === "utf16le" || e === "utf-16le")) {
        if (i.length < 2 || r.length < 2)
          return -1;
        o = 2, u /= 2, f /= 2, t /= 2;
      }
      function c(s, p) {
        return o === 1 ? s[p] : s.readUInt16BE(p * o);
      }
      let l;
      if (n) {
        let s = -1;
        for (l = t;l < u; l++)
          if (c(i, l) === c(r, s === -1 ? 0 : l - s)) {
            if (s === -1 && (s = l), l - s + 1 === f)
              return s * o;
          } else
            s !== -1 && (l -= l - s), s = -1;
      } else
        for (t + f > u && (t = u - f), l = t;l >= 0; l--) {
          let s = true;
          for (let p = 0;p < f; p++)
            if (c(i, l + p) !== c(r, p)) {
              s = false;
              break;
            }
          if (s)
            return l;
        }
      return -1;
    }
    h.prototype.includes = function(r, t, e) {
      return this.indexOf(r, t, e) !== -1;
    };
    h.prototype.indexOf = function(r, t, e) {
      return fr(this, r, t, e, true);
    };
    h.prototype.lastIndexOf = function(r, t, e) {
      return fr(this, r, t, e, false);
    };
    function Gr(i, r, t, e) {
      t = Number(t) || 0;
      let n = i.length - t;
      e ? (e = Number(e), e > n && (e = n)) : e = n;
      let o = r.length;
      e > o / 2 && (e = o / 2);
      let u;
      for (u = 0;u < e; ++u) {
        let f = parseInt(r.substr(u * 2, 2), 16);
        if (J(f))
          return u;
        i[t + u] = f;
      }
      return u;
    }
    function Yr(i, r, t, e) {
      return M(H(r, i.length - t), i, t, e);
    }
    function jr(i, r, t, e) {
      return M(rt(r), i, t, e);
    }
    function qr(i, r, t, e) {
      return M(xr(r), i, t, e);
    }
    function Wr(i, r, t, e) {
      return M(tt(r, i.length - t), i, t, e);
    }
    h.prototype.write = function(r, t, e, n) {
      if (t === undefined)
        n = "utf8", e = this.length, t = 0;
      else if (e === undefined && typeof t == "string")
        n = t, e = this.length, t = 0;
      else if (isFinite(t))
        t = t >>> 0, isFinite(e) ? (e = e >>> 0, n === undefined && (n = "utf8")) : (n = e, e = undefined);
      else
        throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
      let o = this.length - t;
      if ((e === undefined || e > o) && (e = o), r.length > 0 && (e < 0 || t < 0) || t > this.length)
        throw new RangeError("Attempt to write outside buffer bounds");
      n || (n = "utf8");
      let u = false;
      for (;; )
        switch (n) {
          case "hex":
            return Gr(this, r, t, e);
          case "utf8":
          case "utf-8":
            return Yr(this, r, t, e);
          case "ascii":
          case "latin1":
          case "binary":
            return jr(this, r, t, e);
          case "base64":
            return qr(this, r, t, e);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return Wr(this, r, t, e);
          default:
            if (u)
              throw new TypeError("Unknown encoding: " + n);
            n = ("" + n).toLowerCase(), u = true;
        }
    };
    h.prototype.toJSON = function() {
      return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
    };
    function Hr(i, r, t) {
      return r === 0 && t === i.length ? j.fromByteArray(i) : j.fromByteArray(i.slice(r, t));
    }
    function cr(i, r, t) {
      t = Math.min(i.length, t);
      let e = [], n = r;
      for (;n < t; ) {
        let o = i[n], u = null, f = o > 239 ? 4 : o > 223 ? 3 : o > 191 ? 2 : 1;
        if (n + f <= t) {
          let c, l, s, p;
          switch (f) {
            case 1:
              o < 128 && (u = o);
              break;
            case 2:
              c = i[n + 1], (c & 192) === 128 && (p = (o & 31) << 6 | c & 63, p > 127 && (u = p));
              break;
            case 3:
              c = i[n + 1], l = i[n + 2], (c & 192) === 128 && (l & 192) === 128 && (p = (o & 15) << 12 | (c & 63) << 6 | l & 63, p > 2047 && (p < 55296 || p > 57343) && (u = p));
              break;
            case 4:
              c = i[n + 1], l = i[n + 2], s = i[n + 3], (c & 192) === 128 && (l & 192) === 128 && (s & 192) === 128 && (p = (o & 15) << 18 | (c & 63) << 12 | (l & 63) << 6 | s & 63, p > 65535 && p < 1114112 && (u = p));
          }
        }
        u === null ? (u = 65533, f = 1) : u > 65535 && (u -= 65536, e.push(u >>> 10 & 1023 | 55296), u = 56320 | u & 1023), e.push(u), n += f;
      }
      return Xr(e);
    }
    var er = 4096;
    function Xr(i) {
      let r = i.length;
      if (r <= er)
        return String.fromCharCode.apply(String, i);
      let t = "", e = 0;
      for (;e < r; )
        t += String.fromCharCode.apply(String, i.slice(e, e += er));
      return t;
    }
    function Vr(i, r, t) {
      let e = "";
      t = Math.min(i.length, t);
      for (let n = r;n < t; ++n)
        e += String.fromCharCode(i[n] & 127);
      return e;
    }
    function zr(i, r, t) {
      let e = "";
      t = Math.min(i.length, t);
      for (let n = r;n < t; ++n)
        e += String.fromCharCode(i[n]);
      return e;
    }
    function Jr(i, r, t) {
      let e = i.length;
      (!r || r < 0) && (r = 0), (!t || t < 0 || t > e) && (t = e);
      let n = "";
      for (let o = r;o < t; ++o)
        n += it[i[o]];
      return n;
    }
    function Kr(i, r, t) {
      let e = i.slice(r, t), n = "";
      for (let o = 0;o < e.length - 1; o += 2)
        n += String.fromCharCode(e[o] + e[o + 1] * 256);
      return n;
    }
    h.prototype.slice = function(r, t) {
      let e = this.length;
      r = ~~r, t = t === undefined ? e : ~~t, r < 0 ? (r += e, r < 0 && (r = 0)) : r > e && (r = e), t < 0 ? (t += e, t < 0 && (t = 0)) : t > e && (t = e), t < r && (t = r);
      let n = this.subarray(r, t);
      return Object.setPrototypeOf(n, h.prototype), n;
    };
    function a(i, r, t) {
      if (i % 1 !== 0 || i < 0)
        throw new RangeError("offset is not uint");
      if (i + r > t)
        throw new RangeError("Trying to access beyond buffer length");
    }
    h.prototype.readUintLE = h.prototype.readUIntLE = function(r, t, e) {
      r = r >>> 0, t = t >>> 0, e || a(r, t, this.length);
      let n = this[r], o = 1, u = 0;
      for (;++u < t && (o *= 256); )
        n += this[r + u] * o;
      return n;
    };
    h.prototype.readUintBE = h.prototype.readUIntBE = function(r, t, e) {
      r = r >>> 0, t = t >>> 0, e || a(r, t, this.length);
      let n = this[r + --t], o = 1;
      for (;t > 0 && (o *= 256); )
        n += this[r + --t] * o;
      return n;
    };
    h.prototype.readUint8 = h.prototype.readUInt8 = function(r, t) {
      return r = r >>> 0, t || a(r, 1, this.length), this[r];
    };
    h.prototype.readUint16LE = h.prototype.readUInt16LE = function(r, t) {
      return r = r >>> 0, t || a(r, 2, this.length), this[r] | this[r + 1] << 8;
    };
    h.prototype.readUint16BE = h.prototype.readUInt16BE = function(r, t) {
      return r = r >>> 0, t || a(r, 2, this.length), this[r] << 8 | this[r + 1];
    };
    h.prototype.readUint32LE = h.prototype.readUInt32LE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), (this[r] | this[r + 1] << 8 | this[r + 2] << 16) + this[r + 3] * 16777216;
    };
    h.prototype.readUint32BE = h.prototype.readUInt32BE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), this[r] * 16777216 + (this[r + 1] << 16 | this[r + 2] << 8 | this[r + 3]);
    };
    h.prototype.readBigUInt64LE = I(function(r) {
      r = r >>> 0, C(r, "offset");
      let t = this[r], e = this[r + 7];
      (t === undefined || e === undefined) && S(r, this.length - 8);
      let n = t + this[++r] * 2 ** 8 + this[++r] * 2 ** 16 + this[++r] * 2 ** 24, o = this[++r] + this[++r] * 2 ** 8 + this[++r] * 2 ** 16 + e * 2 ** 24;
      return BigInt(n) + (BigInt(o) << BigInt(32));
    });
    h.prototype.readBigUInt64BE = I(function(r) {
      r = r >>> 0, C(r, "offset");
      let t = this[r], e = this[r + 7];
      (t === undefined || e === undefined) && S(r, this.length - 8);
      let n = t * 2 ** 24 + this[++r] * 2 ** 16 + this[++r] * 2 ** 8 + this[++r], o = this[++r] * 2 ** 24 + this[++r] * 2 ** 16 + this[++r] * 2 ** 8 + e;
      return (BigInt(n) << BigInt(32)) + BigInt(o);
    });
    h.prototype.readIntLE = function(r, t, e) {
      r = r >>> 0, t = t >>> 0, e || a(r, t, this.length);
      let n = this[r], o = 1, u = 0;
      for (;++u < t && (o *= 256); )
        n += this[r + u] * o;
      return o *= 128, n >= o && (n -= Math.pow(2, 8 * t)), n;
    };
    h.prototype.readIntBE = function(r, t, e) {
      r = r >>> 0, t = t >>> 0, e || a(r, t, this.length);
      let n = t, o = 1, u = this[r + --n];
      for (;n > 0 && (o *= 256); )
        u += this[r + --n] * o;
      return o *= 128, u >= o && (u -= Math.pow(2, 8 * t)), u;
    };
    h.prototype.readInt8 = function(r, t) {
      return r = r >>> 0, t || a(r, 1, this.length), this[r] & 128 ? (255 - this[r] + 1) * -1 : this[r];
    };
    h.prototype.readInt16LE = function(r, t) {
      r = r >>> 0, t || a(r, 2, this.length);
      let e = this[r] | this[r + 1] << 8;
      return e & 32768 ? e | 4294901760 : e;
    };
    h.prototype.readInt16BE = function(r, t) {
      r = r >>> 0, t || a(r, 2, this.length);
      let e = this[r + 1] | this[r] << 8;
      return e & 32768 ? e | 4294901760 : e;
    };
    h.prototype.readInt32LE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), this[r] | this[r + 1] << 8 | this[r + 2] << 16 | this[r + 3] << 24;
    };
    h.prototype.readInt32BE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), this[r] << 24 | this[r + 1] << 16 | this[r + 2] << 8 | this[r + 3];
    };
    h.prototype.readBigInt64LE = I(function(r) {
      r = r >>> 0, C(r, "offset");
      let t = this[r], e = this[r + 7];
      (t === undefined || e === undefined) && S(r, this.length - 8);
      let n = this[r + 4] + this[r + 5] * 2 ** 8 + this[r + 6] * 2 ** 16 + (e << 24);
      return (BigInt(n) << BigInt(32)) + BigInt(t + this[++r] * 2 ** 8 + this[++r] * 2 ** 16 + this[++r] * 2 ** 24);
    });
    h.prototype.readBigInt64BE = I(function(r) {
      r = r >>> 0, C(r, "offset");
      let t = this[r], e = this[r + 7];
      (t === undefined || e === undefined) && S(r, this.length - 8);
      let n = (t << 24) + this[++r] * 2 ** 16 + this[++r] * 2 ** 8 + this[++r];
      return (BigInt(n) << BigInt(32)) + BigInt(this[++r] * 2 ** 24 + this[++r] * 2 ** 16 + this[++r] * 2 ** 8 + e);
    });
    h.prototype.readFloatLE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), T.read(this, r, true, 23, 4);
    };
    h.prototype.readFloatBE = function(r, t) {
      return r = r >>> 0, t || a(r, 4, this.length), T.read(this, r, false, 23, 4);
    };
    h.prototype.readDoubleLE = function(r, t) {
      return r = r >>> 0, t || a(r, 8, this.length), T.read(this, r, true, 52, 8);
    };
    h.prototype.readDoubleBE = function(r, t) {
      return r = r >>> 0, t || a(r, 8, this.length), T.read(this, r, false, 52, 8);
    };
    function x(i, r, t, e, n, o) {
      if (!h.isBuffer(i))
        throw new TypeError('"buffer" argument must be a Buffer instance');
      if (r > n || r < o)
        throw new RangeError('"value" argument is out of bounds');
      if (t + e > i.length)
        throw new RangeError("Index out of range");
    }
    h.prototype.writeUintLE = h.prototype.writeUIntLE = function(r, t, e, n) {
      if (r = +r, t = t >>> 0, e = e >>> 0, !n) {
        let f = Math.pow(2, 8 * e) - 1;
        x(this, r, t, e, f, 0);
      }
      let o = 1, u = 0;
      for (this[t] = r & 255;++u < e && (o *= 256); )
        this[t + u] = r / o & 255;
      return t + e;
    };
    h.prototype.writeUintBE = h.prototype.writeUIntBE = function(r, t, e, n) {
      if (r = +r, t = t >>> 0, e = e >>> 0, !n) {
        let f = Math.pow(2, 8 * e) - 1;
        x(this, r, t, e, f, 0);
      }
      let o = e - 1, u = 1;
      for (this[t + o] = r & 255;--o >= 0 && (u *= 256); )
        this[t + o] = r / u & 255;
      return t + e;
    };
    h.prototype.writeUint8 = h.prototype.writeUInt8 = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 1, 255, 0), this[t] = r & 255, t + 1;
    };
    h.prototype.writeUint16LE = h.prototype.writeUInt16LE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 2, 65535, 0), this[t] = r & 255, this[t + 1] = r >>> 8, t + 2;
    };
    h.prototype.writeUint16BE = h.prototype.writeUInt16BE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 2, 65535, 0), this[t] = r >>> 8, this[t + 1] = r & 255, t + 2;
    };
    h.prototype.writeUint32LE = h.prototype.writeUInt32LE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 4, 4294967295, 0), this[t + 3] = r >>> 24, this[t + 2] = r >>> 16, this[t + 1] = r >>> 8, this[t] = r & 255, t + 4;
    };
    h.prototype.writeUint32BE = h.prototype.writeUInt32BE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 4, 4294967295, 0), this[t] = r >>> 24, this[t + 1] = r >>> 16, this[t + 2] = r >>> 8, this[t + 3] = r & 255, t + 4;
    };
    function pr(i, r, t, e, n) {
      wr(r, e, n, i, t, 7);
      let o = Number(r & BigInt(4294967295));
      i[t++] = o, o = o >> 8, i[t++] = o, o = o >> 8, i[t++] = o, o = o >> 8, i[t++] = o;
      let u = Number(r >> BigInt(32) & BigInt(4294967295));
      return i[t++] = u, u = u >> 8, i[t++] = u, u = u >> 8, i[t++] = u, u = u >> 8, i[t++] = u, t;
    }
    function sr(i, r, t, e, n) {
      wr(r, e, n, i, t, 7);
      let o = Number(r & BigInt(4294967295));
      i[t + 7] = o, o = o >> 8, i[t + 6] = o, o = o >> 8, i[t + 5] = o, o = o >> 8, i[t + 4] = o;
      let u = Number(r >> BigInt(32) & BigInt(4294967295));
      return i[t + 3] = u, u = u >> 8, i[t + 2] = u, u = u >> 8, i[t + 1] = u, u = u >> 8, i[t] = u, t + 8;
    }
    h.prototype.writeBigUInt64LE = I(function(r, t = 0) {
      return pr(this, r, t, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    h.prototype.writeBigUInt64BE = I(function(r, t = 0) {
      return sr(this, r, t, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    h.prototype.writeIntLE = function(r, t, e, n) {
      if (r = +r, t = t >>> 0, !n) {
        let c = Math.pow(2, 8 * e - 1);
        x(this, r, t, e, c - 1, -c);
      }
      let o = 0, u = 1, f = 0;
      for (this[t] = r & 255;++o < e && (u *= 256); )
        r < 0 && f === 0 && this[t + o - 1] !== 0 && (f = 1), this[t + o] = (r / u >> 0) - f & 255;
      return t + e;
    };
    h.prototype.writeIntBE = function(r, t, e, n) {
      if (r = +r, t = t >>> 0, !n) {
        let c = Math.pow(2, 8 * e - 1);
        x(this, r, t, e, c - 1, -c);
      }
      let o = e - 1, u = 1, f = 0;
      for (this[t + o] = r & 255;--o >= 0 && (u *= 256); )
        r < 0 && f === 0 && this[t + o + 1] !== 0 && (f = 1), this[t + o] = (r / u >> 0) - f & 255;
      return t + e;
    };
    h.prototype.writeInt8 = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 1, 127, -128), r < 0 && (r = 255 + r + 1), this[t] = r & 255, t + 1;
    };
    h.prototype.writeInt16LE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 2, 32767, -32768), this[t] = r & 255, this[t + 1] = r >>> 8, t + 2;
    };
    h.prototype.writeInt16BE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 2, 32767, -32768), this[t] = r >>> 8, this[t + 1] = r & 255, t + 2;
    };
    h.prototype.writeInt32LE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 4, 2147483647, -2147483648), this[t] = r & 255, this[t + 1] = r >>> 8, this[t + 2] = r >>> 16, this[t + 3] = r >>> 24, t + 4;
    };
    h.prototype.writeInt32BE = function(r, t, e) {
      return r = +r, t = t >>> 0, e || x(this, r, t, 4, 2147483647, -2147483648), r < 0 && (r = 4294967295 + r + 1), this[t] = r >>> 24, this[t + 1] = r >>> 16, this[t + 2] = r >>> 8, this[t + 3] = r & 255, t + 4;
    };
    h.prototype.writeBigInt64LE = I(function(r, t = 0) {
      return pr(this, r, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    h.prototype.writeBigInt64BE = I(function(r, t = 0) {
      return sr(this, r, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function lr(i, r, t, e, n, o) {
      if (t + e > i.length)
        throw new RangeError("Index out of range");
      if (t < 0)
        throw new RangeError("Index out of range");
    }
    function ar(i, r, t, e, n) {
      return r = +r, t = t >>> 0, n || lr(i, r, t, 4, 340282346638528860000000000000000000000, -340282346638528860000000000000000000000), T.write(i, r, t, e, 23, 4), t + 4;
    }
    h.prototype.writeFloatLE = function(r, t, e) {
      return ar(this, r, t, true, e);
    };
    h.prototype.writeFloatBE = function(r, t, e) {
      return ar(this, r, t, false, e);
    };
    function yr(i, r, t, e, n) {
      return r = +r, t = t >>> 0, n || lr(i, r, t, 8, 179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, -179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000), T.write(i, r, t, e, 52, 8), t + 8;
    }
    h.prototype.writeDoubleLE = function(r, t, e) {
      return yr(this, r, t, true, e);
    };
    h.prototype.writeDoubleBE = function(r, t, e) {
      return yr(this, r, t, false, e);
    };
    h.prototype.copy = function(r, t, e, n) {
      if (!h.isBuffer(r))
        throw new TypeError("argument should be a Buffer");
      if (e || (e = 0), !n && n !== 0 && (n = this.length), t >= r.length && (t = r.length), t || (t = 0), n > 0 && n < e && (n = e), n === e || r.length === 0 || this.length === 0)
        return 0;
      if (t < 0)
        throw new RangeError("targetStart out of bounds");
      if (e < 0 || e >= this.length)
        throw new RangeError("Index out of range");
      if (n < 0)
        throw new RangeError("sourceEnd out of bounds");
      n > this.length && (n = this.length), r.length - t < n - e && (n = r.length - t + e);
      let o = n - e;
      return this === r && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, e, n) : Uint8Array.prototype.set.call(r, this.subarray(e, n), t), o;
    };
    h.prototype.fill = function(r, t, e, n) {
      if (typeof r == "string") {
        if (typeof t == "string" ? (n = t, t = 0, e = this.length) : typeof e == "string" && (n = e, e = this.length), n !== undefined && typeof n != "string")
          throw new TypeError("encoding must be a string");
        if (typeof n == "string" && !h.isEncoding(n))
          throw new TypeError("Unknown encoding: " + n);
        if (r.length === 1) {
          let u = r.charCodeAt(0);
          (n === "utf8" && u < 128 || n === "latin1") && (r = u);
        }
      } else
        typeof r == "number" ? r = r & 255 : typeof r == "boolean" && (r = Number(r));
      if (t < 0 || this.length < t || this.length < e)
        throw new RangeError("Out of range index");
      if (e <= t)
        return this;
      t = t >>> 0, e = e === undefined ? this.length : e >>> 0, r || (r = 0);
      let o;
      if (typeof r == "number")
        for (o = t;o < e; ++o)
          this[o] = r;
      else {
        let u = h.isBuffer(r) ? r : h.from(r, n), f = u.length;
        if (f === 0)
          throw new TypeError('The value "' + r + '" is invalid for argument "value"');
        for (o = 0;o < e - t; ++o)
          this[o + t] = u[o % f];
      }
      return this;
    };
    var R = {};
    function z(i, r, t) {
      R[i] = class extends t {
        constructor() {
          super(), Object.defineProperty(this, "message", { value: r.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${i}]`, this.stack, delete this.name;
        }
        get code() {
          return i;
        }
        set code(n) {
          Object.defineProperty(this, "code", { configurable: true, enumerable: true, value: n, writable: true });
        }
        toString() {
          return `${this.name} [${i}]: ${this.message}`;
        }
      };
    }
    z("ERR_BUFFER_OUT_OF_BOUNDS", function(i) {
      return i ? `${i} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
    }, RangeError);
    z("ERR_INVALID_ARG_TYPE", function(i, r) {
      return `The "${i}" argument must be of type number. Received type ${typeof r}`;
    }, TypeError);
    z("ERR_OUT_OF_RANGE", function(i, r, t) {
      let e = `The value of "${i}" is out of range.`, n = t;
      return Number.isInteger(t) && Math.abs(t) > 2 ** 32 ? n = nr(String(t)) : typeof t == "bigint" && (n = String(t), (t > BigInt(2) ** BigInt(32) || t < -(BigInt(2) ** BigInt(32))) && (n = nr(n)), n += "n"), e += ` It must be ${r}. Received ${n}`, e;
    }, RangeError);
    function nr(i) {
      let r = "", t = i.length, e = i[0] === "-" ? 1 : 0;
      for (;t >= e + 4; t -= 3)
        r = `_${i.slice(t - 3, t)}${r}`;
      return `${i.slice(0, t)}${r}`;
    }
    function Zr(i, r, t) {
      C(r, "offset"), (i[r] === undefined || i[r + t] === undefined) && S(r, i.length - (t + 1));
    }
    function wr(i, r, t, e, n, o) {
      if (i > t || i < r) {
        let u = typeof r == "bigint" ? "n" : "", f;
        throw o > 3 ? r === 0 || r === BigInt(0) ? f = `>= 0${u} and < 2${u} ** ${(o + 1) * 8}${u}` : f = `>= -(2${u} ** ${(o + 1) * 8 - 1}${u}) and < 2 ** ${(o + 1) * 8 - 1}${u}` : f = `>= ${r}${u} and <= ${t}${u}`, new R.ERR_OUT_OF_RANGE("value", f, i);
      }
      Zr(e, n, o);
    }
    function C(i, r) {
      if (typeof i != "number")
        throw new R.ERR_INVALID_ARG_TYPE(r, "number", i);
    }
    function S(i, r, t) {
      throw Math.floor(i) !== i ? (C(i, t), new R.ERR_OUT_OF_RANGE(t || "offset", "an integer", i)) : r < 0 ? new R.ERR_BUFFER_OUT_OF_BOUNDS : new R.ERR_OUT_OF_RANGE(t || "offset", `>= ${t ? 1 : 0} and <= ${r}`, i);
    }
    var Qr = /[^+/0-9A-Za-z-_]/g;
    function vr(i) {
      if (i = i.split("=")[0], i = i.trim().replace(Qr, ""), i.length < 2)
        return "";
      for (;i.length % 4 !== 0; )
        i = i + "=";
      return i;
    }
    function H(i, r) {
      r = r || 1 / 0;
      let t, e = i.length, n = null, o = [];
      for (let u = 0;u < e; ++u) {
        if (t = i.charCodeAt(u), t > 55295 && t < 57344) {
          if (!n) {
            if (t > 56319) {
              (r -= 3) > -1 && o.push(239, 191, 189);
              continue;
            } else if (u + 1 === e) {
              (r -= 3) > -1 && o.push(239, 191, 189);
              continue;
            }
            n = t;
            continue;
          }
          if (t < 56320) {
            (r -= 3) > -1 && o.push(239, 191, 189), n = t;
            continue;
          }
          t = (n - 55296 << 10 | t - 56320) + 65536;
        } else
          n && (r -= 3) > -1 && o.push(239, 191, 189);
        if (n = null, t < 128) {
          if ((r -= 1) < 0)
            break;
          o.push(t);
        } else if (t < 2048) {
          if ((r -= 2) < 0)
            break;
          o.push(t >> 6 | 192, t & 63 | 128);
        } else if (t < 65536) {
          if ((r -= 3) < 0)
            break;
          o.push(t >> 12 | 224, t >> 6 & 63 | 128, t & 63 | 128);
        } else if (t < 1114112) {
          if ((r -= 4) < 0)
            break;
          o.push(t >> 18 | 240, t >> 12 & 63 | 128, t >> 6 & 63 | 128, t & 63 | 128);
        } else
          throw new Error("Invalid code point");
      }
      return o;
    }
    function rt(i) {
      let r = [];
      for (let t = 0;t < i.length; ++t)
        r.push(i.charCodeAt(t) & 255);
      return r;
    }
    function tt(i, r) {
      let t, e, n, o = [];
      for (let u = 0;u < i.length && !((r -= 2) < 0); ++u)
        t = i.charCodeAt(u), e = t >> 8, n = t % 256, o.push(n), o.push(e);
      return o;
    }
    function xr(i) {
      return j.toByteArray(vr(i));
    }
    function M(i, r, t, e) {
      let n;
      for (n = 0;n < e && !(n + t >= r.length || n >= i.length); ++n)
        r[n + t] = i[n];
      return n;
    }
    function g(i, r) {
      return i instanceof r || i != null && i.constructor != null && i.constructor.name != null && i.constructor.name === r.name;
    }
    function J(i) {
      return i !== i;
    }
    var it = function() {
      let i = "0123456789abcdef", r = new Array(256);
      for (let t = 0;t < 16; ++t) {
        let e = t * 16;
        for (let n = 0;n < 16; ++n)
          r[e + n] = i[t] + i[n];
      }
      return r;
    }();
    function I(i) {
      return typeof BigInt > "u" ? et : i;
    }
    function et() {
      throw new Error("BigInt not supported");
    }
  });
  y = {};
  Ur(y, { Blob: () => ot, Buffer: () => Er.Buffer, File: () => ut, atob: () => ht, btoa: () => ft, constants: () => lt, createObjectURL: () => ct, default: () => Br.Buffer, isAscii: () => pt, isUtf8: () => st, kMaxLength: () => nt, kStringMaxLength: () => K, resolveObjectURL: () => at, transcode: () => yt });
  w(y, O(b()));
  Br = O(b());
  Er = O(b());
  K = 2 ** 32 - 1;
  ({ Blob: ot, File: ut, atob: ht, btoa: ft } = globalThis);
  ({ createObjectURL: ct } = URL);
  lt = { __proto__: null, MAX_LENGTH: K, MAX_STRING_LENGTH: K, BYTES_PER_ELEMENT: 1 };
  export_Buffer = Er.Buffer;
  export_default = Br.Buffer;
  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   */
  /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
});

// node_modules/readable-stream/lib/ours/primordials.js
var require_primordials = __commonJS((exports, module) => {
  class AggregateError extends Error {
    constructor(errors) {
      if (!Array.isArray(errors)) {
        throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
      }
      let message = "";
      for (let i = 0;i < errors.length; i++) {
        message += `    ${errors[i].stack}
`;
      }
      super(message);
      this.name = "AggregateError";
      this.errors = errors;
    }
  }
  module.exports = {
    AggregateError,
    ArrayIsArray(self2) {
      return Array.isArray(self2);
    },
    ArrayPrototypeIncludes(self2, el) {
      return self2.includes(el);
    },
    ArrayPrototypeIndexOf(self2, el) {
      return self2.indexOf(el);
    },
    ArrayPrototypeJoin(self2, sep) {
      return self2.join(sep);
    },
    ArrayPrototypeMap(self2, fn) {
      return self2.map(fn);
    },
    ArrayPrototypePop(self2, el) {
      return self2.pop(el);
    },
    ArrayPrototypePush(self2, el) {
      return self2.push(el);
    },
    ArrayPrototypeSlice(self2, start, end) {
      return self2.slice(start, end);
    },
    Error,
    FunctionPrototypeCall(fn, thisArgs, ...args) {
      return fn.call(thisArgs, ...args);
    },
    FunctionPrototypeSymbolHasInstance(self2, instance) {
      return Function.prototype[Symbol.hasInstance].call(self2, instance);
    },
    MathFloor: Math.floor,
    Number,
    NumberIsInteger: Number.isInteger,
    NumberIsNaN: Number.isNaN,
    NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
    NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
    NumberParseInt: Number.parseInt,
    ObjectDefineProperties(self2, props) {
      return Object.defineProperties(self2, props);
    },
    ObjectDefineProperty(self2, name, prop) {
      return Object.defineProperty(self2, name, prop);
    },
    ObjectGetOwnPropertyDescriptor(self2, name) {
      return Object.getOwnPropertyDescriptor(self2, name);
    },
    ObjectKeys(obj) {
      return Object.keys(obj);
    },
    ObjectSetPrototypeOf(target, proto) {
      return Object.setPrototypeOf(target, proto);
    },
    Promise,
    PromisePrototypeCatch(self2, fn) {
      return self2.catch(fn);
    },
    PromisePrototypeThen(self2, thenFn, catchFn) {
      return self2.then(thenFn, catchFn);
    },
    PromiseReject(err2) {
      return Promise.reject(err2);
    },
    PromiseResolve(val) {
      return Promise.resolve(val);
    },
    ReflectApply: Reflect.apply,
    RegExpPrototypeTest(self2, value) {
      return self2.test(value);
    },
    SafeSet: Set,
    String,
    StringPrototypeSlice(self2, start, end) {
      return self2.slice(start, end);
    },
    StringPrototypeToLowerCase(self2) {
      return self2.toLowerCase();
    },
    StringPrototypeToUpperCase(self2) {
      return self2.toUpperCase();
    },
    StringPrototypeTrim(self2) {
      return self2.trim();
    },
    Symbol,
    SymbolFor: Symbol.for,
    SymbolAsyncIterator: Symbol.asyncIterator,
    SymbolHasInstance: Symbol.hasInstance,
    SymbolIterator: Symbol.iterator,
    SymbolDispose: Symbol.dispose || Symbol("Symbol.dispose"),
    SymbolAsyncDispose: Symbol.asyncDispose || Symbol("Symbol.asyncDispose"),
    TypedArrayPrototypeSet(self2, buf, len) {
      return self2.set(buf, len);
    },
    Boolean,
    Uint8Array
  };
});

// node_modules/readable-stream/lib/ours/util/inspect.js
var require_inspect = __commonJS((exports, module) => {
  module.exports = {
    format(format2, ...args) {
      return format2.replace(/%([sdifj])/g, function(...[_unused, type]) {
        const replacement = args.shift();
        if (type === "f") {
          return replacement.toFixed(6);
        } else if (type === "j") {
          return JSON.stringify(replacement);
        } else if (type === "s" && typeof replacement === "object") {
          const ctor = replacement.constructor !== Object ? replacement.constructor.name : "";
          return `${ctor} {}`.trim();
        } else {
          return replacement.toString();
        }
      });
    },
    inspect(value) {
      switch (typeof value) {
        case "string":
          if (value.includes("'")) {
            if (!value.includes('"')) {
              return `"${value}"`;
            } else if (!value.includes("`") && !value.includes("${")) {
              return `\`${value}\``;
            }
          }
          return `'${value}'`;
        case "number":
          if (isNaN(value)) {
            return "NaN";
          } else if (Object.is(value, -0)) {
            return String(value);
          }
          return value;
        case "bigint":
          return `${String(value)}n`;
        case "boolean":
        case "undefined":
          return String(value);
        case "object":
          return "{}";
      }
    }
  };
});

// node_modules/readable-stream/lib/ours/errors.js
var require_errors = __commonJS((exports, module) => {
  var { format: format2, inspect } = require_inspect();
  var { AggregateError: CustomAggregateError } = require_primordials();
  var AggregateError = globalThis.AggregateError || CustomAggregateError;
  var kIsNodeError = Symbol("kIsNodeError");
  var kTypes = [
    "string",
    "function",
    "number",
    "object",
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol"
  ];
  var classRegExp = /^([A-Z][a-z0-9]*)+$/;
  var nodeInternalPrefix = "__node_internal_";
  var codes = {};
  function assert(value, message) {
    if (!value) {
      throw new codes.ERR_INTERNAL_ASSERTION(message);
    }
  }
  function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for (;i >= start + 4; i -= 3) {
      res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
  }
  function getMessage(key, msg, args) {
    if (typeof msg === "function") {
      assert(msg.length <= args.length, `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${msg.length}).`);
      return msg(...args);
    }
    const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length;
    assert(expectedLength === args.length, `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${expectedLength}).`);
    if (args.length === 0) {
      return msg;
    }
    return format2(msg, ...args);
  }
  function E(code, message, Base) {
    if (!Base) {
      Base = Error;
    }

    class NodeError extends Base {
      constructor(...args) {
        super(getMessage(code, message, args));
      }
      toString() {
        return `${this.name} [${code}]: ${this.message}`;
      }
    }
    Object.defineProperties(NodeError.prototype, {
      name: {
        value: Base.name,
        writable: true,
        enumerable: false,
        configurable: true
      },
      toString: {
        value() {
          return `${this.name} [${code}]: ${this.message}`;
        },
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    NodeError.prototype.code = code;
    NodeError.prototype[kIsNodeError] = true;
    codes[code] = NodeError;
  }
  function hideStackFrames(fn) {
    const hidden = nodeInternalPrefix + fn.name;
    Object.defineProperty(fn, "name", {
      value: hidden
    });
    return fn;
  }
  function aggregateTwoErrors(innerError, outerError) {
    if (innerError && outerError && innerError !== outerError) {
      if (Array.isArray(outerError.errors)) {
        outerError.errors.push(innerError);
        return outerError;
      }
      const err2 = new AggregateError([outerError, innerError], outerError.message);
      err2.code = outerError.code;
      return err2;
    }
    return innerError || outerError;
  }

  class AbortError extends Error {
    constructor(message = "The operation was aborted", options = undefined) {
      if (options !== undefined && typeof options !== "object") {
        throw new codes.ERR_INVALID_ARG_TYPE("options", "Object", options);
      }
      super(message, options);
      this.code = "ABORT_ERR";
      this.name = "AbortError";
    }
  }
  E("ERR_ASSERTION", "%s", Error);
  E("ERR_INVALID_ARG_TYPE", (name, expected, actual) => {
    assert(typeof name === "string", "'name' must be a string");
    if (!Array.isArray(expected)) {
      expected = [expected];
    }
    let msg = "The ";
    if (name.endsWith(" argument")) {
      msg += `${name} `;
    } else {
      msg += `"${name}" ${name.includes(".") ? "property" : "argument"} `;
    }
    msg += "must be ";
    const types4 = [];
    const instances = [];
    const other = [];
    for (const value of expected) {
      assert(typeof value === "string", "All expected entries have to be of type string");
      if (kTypes.includes(value)) {
        types4.push(value.toLowerCase());
      } else if (classRegExp.test(value)) {
        instances.push(value);
      } else {
        assert(value !== "object", 'The value "object" should be written as "Object"');
        other.push(value);
      }
    }
    if (instances.length > 0) {
      const pos = types4.indexOf("object");
      if (pos !== -1) {
        types4.splice(types4, pos, 1);
        instances.push("Object");
      }
    }
    if (types4.length > 0) {
      switch (types4.length) {
        case 1:
          msg += `of type ${types4[0]}`;
          break;
        case 2:
          msg += `one of type ${types4[0]} or ${types4[1]}`;
          break;
        default: {
          const last = types4.pop();
          msg += `one of type ${types4.join(", ")}, or ${last}`;
        }
      }
      if (instances.length > 0 || other.length > 0) {
        msg += " or ";
      }
    }
    if (instances.length > 0) {
      switch (instances.length) {
        case 1:
          msg += `an instance of ${instances[0]}`;
          break;
        case 2:
          msg += `an instance of ${instances[0]} or ${instances[1]}`;
          break;
        default: {
          const last = instances.pop();
          msg += `an instance of ${instances.join(", ")}, or ${last}`;
        }
      }
      if (other.length > 0) {
        msg += " or ";
      }
    }
    switch (other.length) {
      case 0:
        break;
      case 1:
        if (other[0].toLowerCase() !== other[0]) {
          msg += "an ";
        }
        msg += `${other[0]}`;
        break;
      case 2:
        msg += `one of ${other[0]} or ${other[1]}`;
        break;
      default: {
        const last = other.pop();
        msg += `one of ${other.join(", ")}, or ${last}`;
      }
    }
    if (actual == null) {
      msg += `. Received ${actual}`;
    } else if (typeof actual === "function" && actual.name) {
      msg += `. Received function ${actual.name}`;
    } else if (typeof actual === "object") {
      var _actual$constructor;
      if ((_actual$constructor = actual.constructor) !== null && _actual$constructor !== undefined && _actual$constructor.name) {
        msg += `. Received an instance of ${actual.constructor.name}`;
      } else {
        const inspected = inspect(actual, {
          depth: -1
        });
        msg += `. Received ${inspected}`;
      }
    } else {
      let inspected = inspect(actual, {
        colors: false
      });
      if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
      }
      msg += `. Received type ${typeof actual} (${inspected})`;
    }
    return msg;
  }, TypeError);
  E("ERR_INVALID_ARG_VALUE", (name, value, reason = "is invalid") => {
    let inspected = inspect(value);
    if (inspected.length > 128) {
      inspected = inspected.slice(0, 128) + "...";
    }
    const type = name.includes(".") ? "property" : "argument";
    return `The ${type} '${name}' ${reason}. Received ${inspected}`;
  }, TypeError);
  E("ERR_INVALID_RETURN_VALUE", (input, name, value) => {
    var _value$constructor;
    const type = value !== null && value !== undefined && (_value$constructor = value.constructor) !== null && _value$constructor !== undefined && _value$constructor.name ? `instance of ${value.constructor.name}` : `type ${typeof value}`;
    return `Expected ${input} to be returned from the "${name}"` + ` function but got ${type}.`;
  }, TypeError);
  E("ERR_MISSING_ARGS", (...args) => {
    assert(args.length > 0, "At least one arg needs to be specified");
    let msg;
    const len = args.length;
    args = (Array.isArray(args) ? args : [args]).map((a) => `"${a}"`).join(" or ");
    switch (len) {
      case 1:
        msg += `The ${args[0]} argument`;
        break;
      case 2:
        msg += `The ${args[0]} and ${args[1]} arguments`;
        break;
      default:
        {
          const last = args.pop();
          msg += `The ${args.join(", ")}, and ${last} arguments`;
        }
        break;
    }
    return `${msg} must be specified`;
  }, TypeError);
  E("ERR_OUT_OF_RANGE", (str, range, input) => {
    assert(range, 'Missing "range" argument');
    let received;
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input));
    } else if (typeof input === "bigint") {
      received = String(input);
      const limit = BigInt(2) ** BigInt(32);
      if (input > limit || input < -limit) {
        received = addNumericalSeparator(received);
      }
      received += "n";
    } else {
      received = inspect(input);
    }
    return `The value of "${str}" is out of range. It must be ${range}. Received ${received}`;
  }, RangeError);
  E("ERR_MULTIPLE_CALLBACK", "Callback called multiple times", Error);
  E("ERR_METHOD_NOT_IMPLEMENTED", "The %s method is not implemented", Error);
  E("ERR_STREAM_ALREADY_FINISHED", "Cannot call %s after a stream was finished", Error);
  E("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable", Error);
  E("ERR_STREAM_DESTROYED", "Cannot call %s after a stream was destroyed", Error);
  E("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
  E("ERR_STREAM_PREMATURE_CLOSE", "Premature close", Error);
  E("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF", Error);
  E("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event", Error);
  E("ERR_STREAM_WRITE_AFTER_END", "write after end", Error);
  E("ERR_UNKNOWN_ENCODING", "Unknown encoding: %s", TypeError);
  module.exports = {
    AbortError,
    aggregateTwoErrors: hideStackFrames(aggregateTwoErrors),
    hideStackFrames,
    codes
  };
});

// node_modules/abort-controller/browser.js
var require_browser = __commonJS((exports, module) => {
  var { AbortController, AbortSignal } = typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : undefined;
  module.exports = AbortController;
  module.exports.AbortSignal = AbortSignal;
  module.exports.default = AbortController;
});

// node:events
var exports_events = {};
__export(exports_events, {
  prototype: () => P2,
  once: () => M,
  default: () => A,
  EventEmitter: () => o
});
function x(t) {
  console && console.warn && console.warn(t);
}
function o() {
  o.init.call(this);
}
function v2(t) {
  if (typeof t != "function")
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof t);
}
function m(t) {
  return t._maxListeners === undefined ? o.defaultMaxListeners : t._maxListeners;
}
function y2(t, e, n, r) {
  var i, f, s;
  if (v2(n), f = t._events, f === undefined ? (f = t._events = Object.create(null), t._eventsCount = 0) : (f.newListener !== undefined && (t.emit("newListener", e, n.listener ? n.listener : n), f = t._events), s = f[e]), s === undefined)
    s = f[e] = n, ++t._eventsCount;
  else if (typeof s == "function" ? s = f[e] = r ? [n, s] : [s, n] : r ? s.unshift(n) : s.push(n), i = m(t), i > 0 && s.length > i && !s.warned) {
    s.warned = true;
    var u = new Error("Possible EventEmitter memory leak detected. " + s.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
    u.name = "MaxListenersExceededWarning", u.emitter = t, u.type = e, u.count = s.length, x(u);
  }
  return t;
}
function C() {
  if (!this.fired)
    return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function g(t, e, n) {
  var r = { fired: false, wrapFn: undefined, target: t, type: e, listener: n }, i = C.bind(r);
  return i.listener = n, r.wrapFn = i, i;
}
function _(t, e, n) {
  var r = t._events;
  if (r === undefined)
    return [];
  var i = r[e];
  return i === undefined ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? R(i) : b2(i, i.length);
}
function w2(t) {
  var e = this._events;
  if (e !== undefined) {
    var n = e[t];
    if (typeof n == "function")
      return 1;
    if (n !== undefined)
      return n.length;
  }
  return 0;
}
function b2(t, e) {
  for (var n = new Array(e), r = 0;r < e; ++r)
    n[r] = t[r];
  return n;
}
function j(t, e) {
  for (;e + 1 < t.length; e++)
    t[e] = t[e + 1];
  t.pop();
}
function R(t) {
  for (var e = new Array(t.length), n = 0;n < e.length; ++n)
    e[n] = t[n].listener || t[n];
  return e;
}
function M(t, e) {
  return new Promise(function(n, r) {
    function i(s) {
      t.removeListener(e, f), r(s);
    }
    function f() {
      typeof t.removeListener == "function" && t.removeListener("error", i), n([].slice.call(arguments));
    }
    E(t, e, f, { once: true }), e !== "error" && N(t, i, { once: true });
  });
}
function N(t, e, n) {
  typeof t.on == "function" && E(t, "error", e, n);
}
function E(t, e, n, r) {
  if (typeof t.on == "function")
    r.once ? t.once(e, n) : t.on(e, n);
  else if (typeof t.addEventListener == "function")
    t.addEventListener(e, function i(f) {
      r.once && t.removeEventListener(e, i), n(f);
    });
  else
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof t);
}
var a, d, l, L, h = 10, A, P2;
var init_events = __esm(() => {
  a = typeof Reflect == "object" ? Reflect : null;
  d = a && typeof a.apply == "function" ? a.apply : function(e, n, r) {
    return Function.prototype.apply.call(e, n, r);
  };
  a && typeof a.ownKeys == "function" ? l = a.ownKeys : Object.getOwnPropertySymbols ? l = function(e) {
    return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
  } : l = function(e) {
    return Object.getOwnPropertyNames(e);
  };
  L = Number.isNaN || function(e) {
    return e !== e;
  };
  o.EventEmitter = o;
  o.prototype._events = undefined;
  o.prototype._eventsCount = 0;
  o.prototype._maxListeners = undefined;
  Object.defineProperty(o, "defaultMaxListeners", { enumerable: true, get: function() {
    return h;
  }, set: function(t) {
    if (typeof t != "number" || t < 0 || L(t))
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + t + ".");
    h = t;
  } });
  o.init = function() {
    (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || undefined;
  };
  o.prototype.setMaxListeners = function(e) {
    if (typeof e != "number" || e < 0 || L(e))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
    return this._maxListeners = e, this;
  };
  o.prototype.getMaxListeners = function() {
    return m(this);
  };
  o.prototype.emit = function(e) {
    for (var n = [], r = 1;r < arguments.length; r++)
      n.push(arguments[r]);
    var i = e === "error", f = this._events;
    if (f !== undefined)
      i = i && f.error === undefined;
    else if (!i)
      return false;
    if (i) {
      var s;
      if (n.length > 0 && (s = n[0]), s instanceof Error)
        throw s;
      var u = new Error("Unhandled error." + (s ? " (" + s.message + ")" : ""));
      throw u.context = s, u;
    }
    var c = f[e];
    if (c === undefined)
      return false;
    if (typeof c == "function")
      d(c, this, n);
    else
      for (var p = c.length, O2 = b2(c, p), r = 0;r < p; ++r)
        d(O2[r], this, n);
    return true;
  };
  o.prototype.addListener = function(e, n) {
    return y2(this, e, n, false);
  };
  o.prototype.on = o.prototype.addListener;
  o.prototype.prependListener = function(e, n) {
    return y2(this, e, n, true);
  };
  o.prototype.once = function(e, n) {
    return v2(n), this.on(e, g(this, e, n)), this;
  };
  o.prototype.prependOnceListener = function(e, n) {
    return v2(n), this.prependListener(e, g(this, e, n)), this;
  };
  o.prototype.removeListener = function(e, n) {
    var r, i, f, s, u;
    if (v2(n), i = this._events, i === undefined)
      return this;
    if (r = i[e], r === undefined)
      return this;
    if (r === n || r.listener === n)
      --this._eventsCount === 0 ? this._events = Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, r.listener || n));
    else if (typeof r != "function") {
      for (f = -1, s = r.length - 1;s >= 0; s--)
        if (r[s] === n || r[s].listener === n) {
          u = r[s].listener, f = s;
          break;
        }
      if (f < 0)
        return this;
      f === 0 ? r.shift() : j(r, f), r.length === 1 && (i[e] = r[0]), i.removeListener !== undefined && this.emit("removeListener", e, u || n);
    }
    return this;
  };
  o.prototype.off = o.prototype.removeListener;
  o.prototype.removeAllListeners = function(e) {
    var n, r, i;
    if (r = this._events, r === undefined)
      return this;
    if (r.removeListener === undefined)
      return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : r[e] !== undefined && (--this._eventsCount === 0 ? this._events = Object.create(null) : delete r[e]), this;
    if (arguments.length === 0) {
      var f = Object.keys(r), s;
      for (i = 0;i < f.length; ++i)
        s = f[i], s !== "removeListener" && this.removeAllListeners(s);
      return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
    }
    if (n = r[e], typeof n == "function")
      this.removeListener(e, n);
    else if (n !== undefined)
      for (i = n.length - 1;i >= 0; i--)
        this.removeListener(e, n[i]);
    return this;
  };
  o.prototype.listeners = function(e) {
    return _(this, e, true);
  };
  o.prototype.rawListeners = function(e) {
    return _(this, e, false);
  };
  o.listenerCount = function(t, e) {
    return typeof t.listenerCount == "function" ? t.listenerCount(e) : w2.call(t, e);
  };
  o.prototype.listenerCount = w2;
  o.prototype.eventNames = function() {
    return this._eventsCount > 0 ? l(this._events) : [];
  };
  A = o;
  P2 = o.prototype;
});

// node_modules/readable-stream/lib/ours/util.js
var require_util = __commonJS((exports, module) => {
  var bufferModule = (init_buffer(), __toCommonJS(exports_buffer));
  var { format: format2, inspect } = require_inspect();
  var {
    codes: { ERR_INVALID_ARG_TYPE }
  } = require_errors();
  var { kResistStopPropagation, AggregateError, SymbolDispose } = require_primordials();
  var AbortSignal = globalThis.AbortSignal || require_browser().AbortSignal;
  var AbortController = globalThis.AbortController || require_browser().AbortController;
  var AsyncFunction = Object.getPrototypeOf(async function() {
  }).constructor;
  var Blob2 = globalThis.Blob || bufferModule.Blob;
  var isBlob = typeof Blob2 !== "undefined" ? function isBlob(b3) {
    return b3 instanceof Blob2;
  } : function isBlob(b3) {
    return false;
  };
  var validateAbortSignal = (signal, name) => {
    if (signal !== undefined && (signal === null || typeof signal !== "object" || !("aborted" in signal))) {
      throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
    }
  };
  var validateFunction = (value, name) => {
    if (typeof value !== "function") {
      throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
    }
  };
  module.exports = {
    AggregateError,
    kEmptyObject: Object.freeze({}),
    once(callback) {
      let called = false;
      return function(...args) {
        if (called) {
          return;
        }
        called = true;
        callback.apply(this, args);
      };
    },
    createDeferredPromise: function() {
      let resolve2;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve2 = res;
        reject = rej;
      });
      return {
        promise,
        resolve: resolve2,
        reject
      };
    },
    promisify(fn) {
      return new Promise((resolve2, reject) => {
        fn((err2, ...args) => {
          if (err2) {
            return reject(err2);
          }
          return resolve2(...args);
        });
      });
    },
    debuglog() {
      return function() {
      };
    },
    format: format2,
    inspect,
    types: {
      isAsyncFunction(fn) {
        return fn instanceof AsyncFunction;
      },
      isArrayBufferView(arr) {
        return ArrayBuffer.isView(arr);
      }
    },
    isBlob,
    deprecate(fn, message) {
      return fn;
    },
    addAbortListener: (init_events(), __toCommonJS(exports_events)).addAbortListener || function addAbortListener(signal, listener) {
      if (signal === undefined) {
        throw new ERR_INVALID_ARG_TYPE("signal", "AbortSignal", signal);
      }
      validateAbortSignal(signal, "signal");
      validateFunction(listener, "listener");
      let removeEventListener;
      if (signal.aborted) {
        queueMicrotask(() => listener());
      } else {
        signal.addEventListener("abort", listener, {
          __proto__: null,
          once: true,
          [kResistStopPropagation]: true
        });
        removeEventListener = () => {
          signal.removeEventListener("abort", listener);
        };
      }
      return {
        __proto__: null,
        [SymbolDispose]() {
          var _removeEventListener;
          (_removeEventListener = removeEventListener) === null || _removeEventListener === undefined || _removeEventListener();
        }
      };
    },
    AbortSignalAny: AbortSignal.any || function AbortSignalAny(signals) {
      if (signals.length === 1) {
        return signals[0];
      }
      const ac = new AbortController;
      const abort = () => ac.abort();
      signals.forEach((signal) => {
        validateAbortSignal(signal, "signals");
        signal.addEventListener("abort", abort, {
          once: true
        });
      });
      ac.signal.addEventListener("abort", () => {
        signals.forEach((signal) => signal.removeEventListener("abort", abort));
      }, {
        once: true
      });
      return ac.signal;
    }
  };
  module.exports.promisify.custom = Symbol.for("nodejs.util.promisify.custom");
});

// node_modules/readable-stream/lib/internal/validators.js
var require_validators = __commonJS((exports, module) => {
  var {
    ArrayIsArray,
    ArrayPrototypeIncludes,
    ArrayPrototypeJoin,
    ArrayPrototypeMap,
    NumberIsInteger,
    NumberIsNaN,
    NumberMAX_SAFE_INTEGER,
    NumberMIN_SAFE_INTEGER,
    NumberParseInt,
    ObjectPrototypeHasOwnProperty,
    RegExpPrototypeExec,
    String: String2,
    StringPrototypeToUpperCase,
    StringPrototypeTrim
  } = require_primordials();
  var {
    hideStackFrames,
    codes: { ERR_SOCKET_BAD_PORT, ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_OUT_OF_RANGE, ERR_UNKNOWN_SIGNAL }
  } = require_errors();
  var { normalizeEncoding } = require_util();
  var { isAsyncFunction, isArrayBufferView } = require_util().types;
  var signals = {};
  function isInt32(value) {
    return value === (value | 0);
  }
  function isUint32(value) {
    return value === value >>> 0;
  }
  var octalReg = /^[0-7]+$/;
  var modeDesc = "must be a 32-bit unsigned integer or an octal string";
  function parseFileMode(value, name, def) {
    if (typeof value === "undefined") {
      value = def;
    }
    if (typeof value === "string") {
      if (RegExpPrototypeExec(octalReg, value) === null) {
        throw new ERR_INVALID_ARG_VALUE(name, value, modeDesc);
      }
      value = NumberParseInt(value, 8);
    }
    validateUint32(value, name);
    return value;
  }
  var validateInteger = hideStackFrames((value, name, min = NumberMIN_SAFE_INTEGER, max = NumberMAX_SAFE_INTEGER) => {
    if (typeof value !== "number")
      throw new ERR_INVALID_ARG_TYPE(name, "number", value);
    if (!NumberIsInteger(value))
      throw new ERR_OUT_OF_RANGE(name, "an integer", value);
    if (value < min || value > max)
      throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
  });
  var validateInt32 = hideStackFrames((value, name, min = -2147483648, max = 2147483647) => {
    if (typeof value !== "number") {
      throw new ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!NumberIsInteger(value)) {
      throw new ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    if (value < min || value > max) {
      throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
  });
  var validateUint32 = hideStackFrames((value, name, positive = false) => {
    if (typeof value !== "number") {
      throw new ERR_INVALID_ARG_TYPE(name, "number", value);
    }
    if (!NumberIsInteger(value)) {
      throw new ERR_OUT_OF_RANGE(name, "an integer", value);
    }
    const min = positive ? 1 : 0;
    const max = 4294967295;
    if (value < min || value > max) {
      throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
  });
  function validateString(value, name) {
    if (typeof value !== "string")
      throw new ERR_INVALID_ARG_TYPE(name, "string", value);
  }
  function validateNumber(value, name, min = undefined, max) {
    if (typeof value !== "number")
      throw new ERR_INVALID_ARG_TYPE(name, "number", value);
    if (min != null && value < min || max != null && value > max || (min != null || max != null) && NumberIsNaN(value)) {
      throw new ERR_OUT_OF_RANGE(name, `${min != null ? `>= ${min}` : ""}${min != null && max != null ? " && " : ""}${max != null ? `<= ${max}` : ""}`, value);
    }
  }
  var validateOneOf = hideStackFrames((value, name, oneOf) => {
    if (!ArrayPrototypeIncludes(oneOf, value)) {
      const allowed = ArrayPrototypeJoin(ArrayPrototypeMap(oneOf, (v3) => typeof v3 === "string" ? `'${v3}'` : String2(v3)), ", ");
      const reason = "must be one of: " + allowed;
      throw new ERR_INVALID_ARG_VALUE(name, value, reason);
    }
  });
  function validateBoolean(value, name) {
    if (typeof value !== "boolean")
      throw new ERR_INVALID_ARG_TYPE(name, "boolean", value);
  }
  function getOwnPropertyValueOrDefault(options, key, defaultValue) {
    return options == null || !ObjectPrototypeHasOwnProperty(options, key) ? defaultValue : options[key];
  }
  var validateObject = hideStackFrames((value, name, options = null) => {
    const allowArray = getOwnPropertyValueOrDefault(options, "allowArray", false);
    const allowFunction = getOwnPropertyValueOrDefault(options, "allowFunction", false);
    const nullable = getOwnPropertyValueOrDefault(options, "nullable", false);
    if (!nullable && value === null || !allowArray && ArrayIsArray(value) || typeof value !== "object" && (!allowFunction || typeof value !== "function")) {
      throw new ERR_INVALID_ARG_TYPE(name, "Object", value);
    }
  });
  var validateDictionary = hideStackFrames((value, name) => {
    if (value != null && typeof value !== "object" && typeof value !== "function") {
      throw new ERR_INVALID_ARG_TYPE(name, "a dictionary", value);
    }
  });
  var validateArray = hideStackFrames((value, name, minLength = 0) => {
    if (!ArrayIsArray(value)) {
      throw new ERR_INVALID_ARG_TYPE(name, "Array", value);
    }
    if (value.length < minLength) {
      const reason = `must be longer than ${minLength}`;
      throw new ERR_INVALID_ARG_VALUE(name, value, reason);
    }
  });
  function validateStringArray(value, name) {
    validateArray(value, name);
    for (let i = 0;i < value.length; i++) {
      validateString(value[i], `${name}[${i}]`);
    }
  }
  function validateBooleanArray(value, name) {
    validateArray(value, name);
    for (let i = 0;i < value.length; i++) {
      validateBoolean(value[i], `${name}[${i}]`);
    }
  }
  function validateAbortSignalArray(value, name) {
    validateArray(value, name);
    for (let i = 0;i < value.length; i++) {
      const signal = value[i];
      const indexedName = `${name}[${i}]`;
      if (signal == null) {
        throw new ERR_INVALID_ARG_TYPE(indexedName, "AbortSignal", signal);
      }
      validateAbortSignal(signal, indexedName);
    }
  }
  function validateSignalName(signal, name = "signal") {
    validateString(signal, name);
    if (signals[signal] === undefined) {
      if (signals[StringPrototypeToUpperCase(signal)] !== undefined) {
        throw new ERR_UNKNOWN_SIGNAL(signal + " (signals must use all capital letters)");
      }
      throw new ERR_UNKNOWN_SIGNAL(signal);
    }
  }
  var validateBuffer = hideStackFrames((buffer, name = "buffer") => {
    if (!isArrayBufferView(buffer)) {
      throw new ERR_INVALID_ARG_TYPE(name, ["Buffer", "TypedArray", "DataView"], buffer);
    }
  });
  function validateEncoding(data, encoding) {
    const normalizedEncoding = normalizeEncoding(encoding);
    const length = data.length;
    if (normalizedEncoding === "hex" && length % 2 !== 0) {
      throw new ERR_INVALID_ARG_VALUE("encoding", encoding, `is invalid for data of length ${length}`);
    }
  }
  function validatePort(port, name = "Port", allowZero = true) {
    if (typeof port !== "number" && typeof port !== "string" || typeof port === "string" && StringPrototypeTrim(port).length === 0 || +port !== +port >>> 0 || port > 65535 || port === 0 && !allowZero) {
      throw new ERR_SOCKET_BAD_PORT(name, port, allowZero);
    }
    return port | 0;
  }
  var validateAbortSignal = hideStackFrames((signal, name) => {
    if (signal !== undefined && (signal === null || typeof signal !== "object" || !("aborted" in signal))) {
      throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
    }
  });
  var validateFunction = hideStackFrames((value, name) => {
    if (typeof value !== "function")
      throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
  });
  var validatePlainFunction = hideStackFrames((value, name) => {
    if (typeof value !== "function" || isAsyncFunction(value))
      throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
  });
  var validateUndefined = hideStackFrames((value, name) => {
    if (value !== undefined)
      throw new ERR_INVALID_ARG_TYPE(name, "undefined", value);
  });
  function validateUnion(value, name, union) {
    if (!ArrayPrototypeIncludes(union, value)) {
      throw new ERR_INVALID_ARG_TYPE(name, `('${ArrayPrototypeJoin(union, "|")}')`, value);
    }
  }
  var linkValueRegExp = /^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/;
  function validateLinkHeaderFormat(value, name) {
    if (typeof value === "undefined" || !RegExpPrototypeExec(linkValueRegExp, value)) {
      throw new ERR_INVALID_ARG_VALUE(name, value, 'must be an array or string of format "</styles.css>; rel=preload; as=style"');
    }
  }
  function validateLinkHeaderValue(hints) {
    if (typeof hints === "string") {
      validateLinkHeaderFormat(hints, "hints");
      return hints;
    } else if (ArrayIsArray(hints)) {
      const hintsLength = hints.length;
      let result = "";
      if (hintsLength === 0) {
        return result;
      }
      for (let i = 0;i < hintsLength; i++) {
        const link = hints[i];
        validateLinkHeaderFormat(link, "hints");
        result += link;
        if (i !== hintsLength - 1) {
          result += ", ";
        }
      }
      return result;
    }
    throw new ERR_INVALID_ARG_VALUE("hints", hints, 'must be an array or string of format "</styles.css>; rel=preload; as=style"');
  }
  module.exports = {
    isInt32,
    isUint32,
    parseFileMode,
    validateArray,
    validateStringArray,
    validateBooleanArray,
    validateAbortSignalArray,
    validateBoolean,
    validateBuffer,
    validateDictionary,
    validateEncoding,
    validateFunction,
    validateInt32,
    validateInteger,
    validateNumber,
    validateObject,
    validateOneOf,
    validatePlainFunction,
    validatePort,
    validateSignalName,
    validateString,
    validateUint32,
    validateUndefined,
    validateUnion,
    validateAbortSignal,
    validateLinkHeaderValue
  };
});

// node_modules/process/browser.js
var require_browser2 = __commonJS((exports, module) => {
  var process = module.exports = {};
  var cachedSetTimeout;
  var cachedClearTimeout;
  function defaultSetTimout() {
    throw new Error("setTimeout has not been defined");
  }
  function defaultClearTimeout() {
    throw new Error("clearTimeout has not been defined");
  }
  (function() {
    try {
      if (typeof setTimeout === "function") {
        cachedSetTimeout = setTimeout;
      } else {
        cachedSetTimeout = defaultSetTimout;
      }
    } catch (e) {
      cachedSetTimeout = defaultSetTimout;
    }
    try {
      if (typeof clearTimeout === "function") {
        cachedClearTimeout = clearTimeout;
      } else {
        cachedClearTimeout = defaultClearTimeout;
      }
    } catch (e) {
      cachedClearTimeout = defaultClearTimeout;
    }
  })();
  function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
      return setTimeout(fun, 0);
    }
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
    }
    try {
      return cachedSetTimeout(fun, 0);
    } catch (e) {
      try {
        return cachedSetTimeout.call(null, fun, 0);
      } catch (e2) {
        return cachedSetTimeout.call(this, fun, 0);
      }
    }
  }
  function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
      return clearTimeout(marker);
    }
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
    }
    try {
      return cachedClearTimeout(marker);
    } catch (e) {
      try {
        return cachedClearTimeout.call(null, marker);
      } catch (e2) {
        return cachedClearTimeout.call(this, marker);
      }
    }
  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }
    if (queue.length) {
      drainQueue();
    }
  }
  function drainQueue() {
    if (draining) {
      return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
  }
  process.nextTick = function(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
      for (var i = 1;i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
    }
  };
  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }
  Item.prototype.run = function() {
    this.fun.apply(null, this.array);
  };
  process.title = "browser";
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = "";
  process.versions = {};
  function noop() {
  }
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.prependListener = noop;
  process.prependOnceListener = noop;
  process.listeners = function(name) {
    return [];
  };
  process.binding = function(name) {
    throw new Error("process.binding is not supported");
  };
  process.cwd = function() {
    return "/";
  };
  process.chdir = function(dir) {
    throw new Error("process.chdir is not supported");
  };
  process.umask = function() {
    return 0;
  };
});

// node_modules/readable-stream/lib/internal/streams/utils.js
var require_utils = __commonJS((exports, module) => {
  var { SymbolAsyncIterator, SymbolIterator, SymbolFor } = require_primordials();
  var kIsDestroyed = SymbolFor("nodejs.stream.destroyed");
  var kIsErrored = SymbolFor("nodejs.stream.errored");
  var kIsReadable = SymbolFor("nodejs.stream.readable");
  var kIsWritable = SymbolFor("nodejs.stream.writable");
  var kIsDisturbed = SymbolFor("nodejs.stream.disturbed");
  var kIsClosedPromise = SymbolFor("nodejs.webstream.isClosedPromise");
  var kControllerErrorFunction = SymbolFor("nodejs.webstream.controllerErrorFunction");
  function isReadableNodeStream(obj, strict = false) {
    var _obj$_readableState;
    return !!(obj && typeof obj.pipe === "function" && typeof obj.on === "function" && (!strict || typeof obj.pause === "function" && typeof obj.resume === "function") && (!obj._writableState || ((_obj$_readableState = obj._readableState) === null || _obj$_readableState === undefined ? undefined : _obj$_readableState.readable) !== false) && (!obj._writableState || obj._readableState));
  }
  function isWritableNodeStream(obj) {
    var _obj$_writableState;
    return !!(obj && typeof obj.write === "function" && typeof obj.on === "function" && (!obj._readableState || ((_obj$_writableState = obj._writableState) === null || _obj$_writableState === undefined ? undefined : _obj$_writableState.writable) !== false));
  }
  function isDuplexNodeStream(obj) {
    return !!(obj && typeof obj.pipe === "function" && obj._readableState && typeof obj.on === "function" && typeof obj.write === "function");
  }
  function isNodeStream(obj) {
    return obj && (obj._readableState || obj._writableState || typeof obj.write === "function" && typeof obj.on === "function" || typeof obj.pipe === "function" && typeof obj.on === "function");
  }
  function isReadableStream(obj) {
    return !!(obj && !isNodeStream(obj) && typeof obj.pipeThrough === "function" && typeof obj.getReader === "function" && typeof obj.cancel === "function");
  }
  function isWritableStream(obj) {
    return !!(obj && !isNodeStream(obj) && typeof obj.getWriter === "function" && typeof obj.abort === "function");
  }
  function isTransformStream(obj) {
    return !!(obj && !isNodeStream(obj) && typeof obj.readable === "object" && typeof obj.writable === "object");
  }
  function isWebStream(obj) {
    return isReadableStream(obj) || isWritableStream(obj) || isTransformStream(obj);
  }
  function isIterable(obj, isAsync) {
    if (obj == null)
      return false;
    if (isAsync === true)
      return typeof obj[SymbolAsyncIterator] === "function";
    if (isAsync === false)
      return typeof obj[SymbolIterator] === "function";
    return typeof obj[SymbolAsyncIterator] === "function" || typeof obj[SymbolIterator] === "function";
  }
  function isDestroyed(stream) {
    if (!isNodeStream(stream))
      return null;
    const wState = stream._writableState;
    const rState = stream._readableState;
    const state = wState || rState;
    return !!(stream.destroyed || stream[kIsDestroyed] || state !== null && state !== undefined && state.destroyed);
  }
  function isWritableEnded(stream) {
    if (!isWritableNodeStream(stream))
      return null;
    if (stream.writableEnded === true)
      return true;
    const wState = stream._writableState;
    if (wState !== null && wState !== undefined && wState.errored)
      return false;
    if (typeof (wState === null || wState === undefined ? undefined : wState.ended) !== "boolean")
      return null;
    return wState.ended;
  }
  function isWritableFinished(stream, strict) {
    if (!isWritableNodeStream(stream))
      return null;
    if (stream.writableFinished === true)
      return true;
    const wState = stream._writableState;
    if (wState !== null && wState !== undefined && wState.errored)
      return false;
    if (typeof (wState === null || wState === undefined ? undefined : wState.finished) !== "boolean")
      return null;
    return !!(wState.finished || strict === false && wState.ended === true && wState.length === 0);
  }
  function isReadableEnded(stream) {
    if (!isReadableNodeStream(stream))
      return null;
    if (stream.readableEnded === true)
      return true;
    const rState = stream._readableState;
    if (!rState || rState.errored)
      return false;
    if (typeof (rState === null || rState === undefined ? undefined : rState.ended) !== "boolean")
      return null;
    return rState.ended;
  }
  function isReadableFinished(stream, strict) {
    if (!isReadableNodeStream(stream))
      return null;
    const rState = stream._readableState;
    if (rState !== null && rState !== undefined && rState.errored)
      return false;
    if (typeof (rState === null || rState === undefined ? undefined : rState.endEmitted) !== "boolean")
      return null;
    return !!(rState.endEmitted || strict === false && rState.ended === true && rState.length === 0);
  }
  function isReadable2(stream) {
    if (stream && stream[kIsReadable] != null)
      return stream[kIsReadable];
    if (typeof (stream === null || stream === undefined ? undefined : stream.readable) !== "boolean")
      return null;
    if (isDestroyed(stream))
      return false;
    return isReadableNodeStream(stream) && stream.readable && !isReadableFinished(stream);
  }
  function isWritable(stream) {
    if (stream && stream[kIsWritable] != null)
      return stream[kIsWritable];
    if (typeof (stream === null || stream === undefined ? undefined : stream.writable) !== "boolean")
      return null;
    if (isDestroyed(stream))
      return false;
    return isWritableNodeStream(stream) && stream.writable && !isWritableEnded(stream);
  }
  function isFinished(stream, opts) {
    if (!isNodeStream(stream)) {
      return null;
    }
    if (isDestroyed(stream)) {
      return true;
    }
    if ((opts === null || opts === undefined ? undefined : opts.readable) !== false && isReadable2(stream)) {
      return false;
    }
    if ((opts === null || opts === undefined ? undefined : opts.writable) !== false && isWritable(stream)) {
      return false;
    }
    return true;
  }
  function isWritableErrored(stream) {
    var _stream$_writableStat, _stream$_writableStat2;
    if (!isNodeStream(stream)) {
      return null;
    }
    if (stream.writableErrored) {
      return stream.writableErrored;
    }
    return (_stream$_writableStat = (_stream$_writableStat2 = stream._writableState) === null || _stream$_writableStat2 === undefined ? undefined : _stream$_writableStat2.errored) !== null && _stream$_writableStat !== undefined ? _stream$_writableStat : null;
  }
  function isReadableErrored(stream) {
    var _stream$_readableStat, _stream$_readableStat2;
    if (!isNodeStream(stream)) {
      return null;
    }
    if (stream.readableErrored) {
      return stream.readableErrored;
    }
    return (_stream$_readableStat = (_stream$_readableStat2 = stream._readableState) === null || _stream$_readableStat2 === undefined ? undefined : _stream$_readableStat2.errored) !== null && _stream$_readableStat !== undefined ? _stream$_readableStat : null;
  }
  function isClosed(stream) {
    if (!isNodeStream(stream)) {
      return null;
    }
    if (typeof stream.closed === "boolean") {
      return stream.closed;
    }
    const wState = stream._writableState;
    const rState = stream._readableState;
    if (typeof (wState === null || wState === undefined ? undefined : wState.closed) === "boolean" || typeof (rState === null || rState === undefined ? undefined : rState.closed) === "boolean") {
      return (wState === null || wState === undefined ? undefined : wState.closed) || (rState === null || rState === undefined ? undefined : rState.closed);
    }
    if (typeof stream._closed === "boolean" && isOutgoingMessage(stream)) {
      return stream._closed;
    }
    return null;
  }
  function isOutgoingMessage(stream) {
    return typeof stream._closed === "boolean" && typeof stream._defaultKeepAlive === "boolean" && typeof stream._removedConnection === "boolean" && typeof stream._removedContLen === "boolean";
  }
  function isServerResponse(stream) {
    return typeof stream._sent100 === "boolean" && isOutgoingMessage(stream);
  }
  function isServerRequest(stream) {
    var _stream$req;
    return typeof stream._consuming === "boolean" && typeof stream._dumped === "boolean" && ((_stream$req = stream.req) === null || _stream$req === undefined ? undefined : _stream$req.upgradeOrConnect) === undefined;
  }
  function willEmitClose(stream) {
    if (!isNodeStream(stream))
      return null;
    const wState = stream._writableState;
    const rState = stream._readableState;
    const state = wState || rState;
    return !state && isServerResponse(stream) || !!(state && state.autoDestroy && state.emitClose && state.closed === false);
  }
  function isDisturbed(stream) {
    var _stream$kIsDisturbed;
    return !!(stream && ((_stream$kIsDisturbed = stream[kIsDisturbed]) !== null && _stream$kIsDisturbed !== undefined ? _stream$kIsDisturbed : stream.readableDidRead || stream.readableAborted));
  }
  function isErrored(stream) {
    var _ref, _ref2, _ref3, _ref4, _ref5, _stream$kIsErrored, _stream$_readableStat3, _stream$_writableStat3, _stream$_readableStat4, _stream$_writableStat4;
    return !!(stream && ((_ref = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_stream$kIsErrored = stream[kIsErrored]) !== null && _stream$kIsErrored !== undefined ? _stream$kIsErrored : stream.readableErrored) !== null && _ref5 !== undefined ? _ref5 : stream.writableErrored) !== null && _ref4 !== undefined ? _ref4 : (_stream$_readableStat3 = stream._readableState) === null || _stream$_readableStat3 === undefined ? undefined : _stream$_readableStat3.errorEmitted) !== null && _ref3 !== undefined ? _ref3 : (_stream$_writableStat3 = stream._writableState) === null || _stream$_writableStat3 === undefined ? undefined : _stream$_writableStat3.errorEmitted) !== null && _ref2 !== undefined ? _ref2 : (_stream$_readableStat4 = stream._readableState) === null || _stream$_readableStat4 === undefined ? undefined : _stream$_readableStat4.errored) !== null && _ref !== undefined ? _ref : (_stream$_writableStat4 = stream._writableState) === null || _stream$_writableStat4 === undefined ? undefined : _stream$_writableStat4.errored));
  }
  module.exports = {
    isDestroyed,
    kIsDestroyed,
    isDisturbed,
    kIsDisturbed,
    isErrored,
    kIsErrored,
    isReadable: isReadable2,
    kIsReadable,
    kIsClosedPromise,
    kControllerErrorFunction,
    kIsWritable,
    isClosed,
    isDuplexNodeStream,
    isFinished,
    isIterable,
    isReadableNodeStream,
    isReadableStream,
    isReadableEnded,
    isReadableFinished,
    isReadableErrored,
    isNodeStream,
    isWebStream,
    isWritable,
    isWritableNodeStream,
    isWritableStream,
    isWritableEnded,
    isWritableFinished,
    isWritableErrored,
    isServerRequest,
    isServerResponse,
    willEmitClose,
    isTransformStream
  };
});

// node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var require_end_of_stream = __commonJS((exports, module) => {
  var process = require_browser2();
  var { AbortError, codes } = require_errors();
  var { ERR_INVALID_ARG_TYPE, ERR_STREAM_PREMATURE_CLOSE } = codes;
  var { kEmptyObject, once } = require_util();
  var { validateAbortSignal, validateFunction, validateObject, validateBoolean } = require_validators();
  var { Promise: Promise2, PromisePrototypeThen, SymbolDispose } = require_primordials();
  var {
    isClosed,
    isReadable: isReadable2,
    isReadableNodeStream,
    isReadableStream,
    isReadableFinished,
    isReadableErrored,
    isWritable,
    isWritableNodeStream,
    isWritableStream,
    isWritableFinished,
    isWritableErrored,
    isNodeStream,
    willEmitClose: _willEmitClose,
    kIsClosedPromise
  } = require_utils();
  var addAbortListener;
  function isRequest(stream) {
    return stream.setHeader && typeof stream.abort === "function";
  }
  var nop = () => {
  };
  function eos(stream, options, callback) {
    var _options$readable, _options$writable;
    if (arguments.length === 2) {
      callback = options;
      options = kEmptyObject;
    } else if (options == null) {
      options = kEmptyObject;
    } else {
      validateObject(options, "options");
    }
    validateFunction(callback, "callback");
    validateAbortSignal(options.signal, "options.signal");
    callback = once(callback);
    if (isReadableStream(stream) || isWritableStream(stream)) {
      return eosWeb(stream, options, callback);
    }
    if (!isNodeStream(stream)) {
      throw new ERR_INVALID_ARG_TYPE("stream", ["ReadableStream", "WritableStream", "Stream"], stream);
    }
    const readable = (_options$readable = options.readable) !== null && _options$readable !== undefined ? _options$readable : isReadableNodeStream(stream);
    const writable = (_options$writable = options.writable) !== null && _options$writable !== undefined ? _options$writable : isWritableNodeStream(stream);
    const wState = stream._writableState;
    const rState = stream._readableState;
    const onlegacyfinish = () => {
      if (!stream.writable) {
        onfinish();
      }
    };
    let willEmitClose = _willEmitClose(stream) && isReadableNodeStream(stream) === readable && isWritableNodeStream(stream) === writable;
    let writableFinished = isWritableFinished(stream, false);
    const onfinish = () => {
      writableFinished = true;
      if (stream.destroyed) {
        willEmitClose = false;
      }
      if (willEmitClose && (!stream.readable || readable)) {
        return;
      }
      if (!readable || readableFinished) {
        callback.call(stream);
      }
    };
    let readableFinished = isReadableFinished(stream, false);
    const onend = () => {
      readableFinished = true;
      if (stream.destroyed) {
        willEmitClose = false;
      }
      if (willEmitClose && (!stream.writable || writable)) {
        return;
      }
      if (!writable || writableFinished) {
        callback.call(stream);
      }
    };
    const onerror = (err2) => {
      callback.call(stream, err2);
    };
    let closed = isClosed(stream);
    const onclose = () => {
      closed = true;
      const errored = isWritableErrored(stream) || isReadableErrored(stream);
      if (errored && typeof errored !== "boolean") {
        return callback.call(stream, errored);
      }
      if (readable && !readableFinished && isReadableNodeStream(stream, true)) {
        if (!isReadableFinished(stream, false))
          return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE);
      }
      if (writable && !writableFinished) {
        if (!isWritableFinished(stream, false))
          return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE);
      }
      callback.call(stream);
    };
    const onclosed = () => {
      closed = true;
      const errored = isWritableErrored(stream) || isReadableErrored(stream);
      if (errored && typeof errored !== "boolean") {
        return callback.call(stream, errored);
      }
      callback.call(stream);
    };
    const onrequest = () => {
      stream.req.on("finish", onfinish);
    };
    if (isRequest(stream)) {
      stream.on("complete", onfinish);
      if (!willEmitClose) {
        stream.on("abort", onclose);
      }
      if (stream.req) {
        onrequest();
      } else {
        stream.on("request", onrequest);
      }
    } else if (writable && !wState) {
      stream.on("end", onlegacyfinish);
      stream.on("close", onlegacyfinish);
    }
    if (!willEmitClose && typeof stream.aborted === "boolean") {
      stream.on("aborted", onclose);
    }
    stream.on("end", onend);
    stream.on("finish", onfinish);
    if (options.error !== false) {
      stream.on("error", onerror);
    }
    stream.on("close", onclose);
    if (closed) {
      process.nextTick(onclose);
    } else if (wState !== null && wState !== undefined && wState.errorEmitted || rState !== null && rState !== undefined && rState.errorEmitted) {
      if (!willEmitClose) {
        process.nextTick(onclosed);
      }
    } else if (!readable && (!willEmitClose || isReadable2(stream)) && (writableFinished || isWritable(stream) === false)) {
      process.nextTick(onclosed);
    } else if (!writable && (!willEmitClose || isWritable(stream)) && (readableFinished || isReadable2(stream) === false)) {
      process.nextTick(onclosed);
    } else if (rState && stream.req && stream.aborted) {
      process.nextTick(onclosed);
    }
    const cleanup = () => {
      callback = nop;
      stream.removeListener("aborted", onclose);
      stream.removeListener("complete", onfinish);
      stream.removeListener("abort", onclose);
      stream.removeListener("request", onrequest);
      if (stream.req)
        stream.req.removeListener("finish", onfinish);
      stream.removeListener("end", onlegacyfinish);
      stream.removeListener("close", onlegacyfinish);
      stream.removeListener("finish", onfinish);
      stream.removeListener("end", onend);
      stream.removeListener("error", onerror);
      stream.removeListener("close", onclose);
    };
    if (options.signal && !closed) {
      const abort = () => {
        const endCallback = callback;
        cleanup();
        endCallback.call(stream, new AbortError(undefined, {
          cause: options.signal.reason
        }));
      };
      if (options.signal.aborted) {
        process.nextTick(abort);
      } else {
        addAbortListener = addAbortListener || require_util().addAbortListener;
        const disposable = addAbortListener(options.signal, abort);
        const originalCallback = callback;
        callback = once((...args) => {
          disposable[SymbolDispose]();
          originalCallback.apply(stream, args);
        });
      }
    }
    return cleanup;
  }
  function eosWeb(stream, options, callback) {
    let isAborted = false;
    let abort = nop;
    if (options.signal) {
      abort = () => {
        isAborted = true;
        callback.call(stream, new AbortError(undefined, {
          cause: options.signal.reason
        }));
      };
      if (options.signal.aborted) {
        process.nextTick(abort);
      } else {
        addAbortListener = addAbortListener || require_util().addAbortListener;
        const disposable = addAbortListener(options.signal, abort);
        const originalCallback = callback;
        callback = once((...args) => {
          disposable[SymbolDispose]();
          originalCallback.apply(stream, args);
        });
      }
    }
    const resolverFn = (...args) => {
      if (!isAborted) {
        process.nextTick(() => callback.apply(stream, args));
      }
    };
    PromisePrototypeThen(stream[kIsClosedPromise].promise, resolverFn, resolverFn);
    return nop;
  }
  function finished(stream, opts) {
    var _opts;
    let autoCleanup = false;
    if (opts === null) {
      opts = kEmptyObject;
    }
    if ((_opts = opts) !== null && _opts !== undefined && _opts.cleanup) {
      validateBoolean(opts.cleanup, "cleanup");
      autoCleanup = opts.cleanup;
    }
    return new Promise2((resolve2, reject) => {
      const cleanup = eos(stream, opts, (err2) => {
        if (autoCleanup) {
          cleanup();
        }
        if (err2) {
          reject(err2);
        } else {
          resolve2();
        }
      });
    });
  }
  module.exports = eos;
  module.exports.finished = finished;
});

// node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS((exports, module) => {
  var process = require_browser2();
  var {
    aggregateTwoErrors,
    codes: { ERR_MULTIPLE_CALLBACK },
    AbortError
  } = require_errors();
  var { Symbol: Symbol2 } = require_primordials();
  var { kIsDestroyed, isDestroyed, isFinished, isServerRequest } = require_utils();
  var kDestroy = Symbol2("kDestroy");
  var kConstruct = Symbol2("kConstruct");
  function checkError(err2, w3, r) {
    if (err2) {
      err2.stack;
      if (w3 && !w3.errored) {
        w3.errored = err2;
      }
      if (r && !r.errored) {
        r.errored = err2;
      }
    }
  }
  function destroy(err2, cb) {
    const r = this._readableState;
    const w3 = this._writableState;
    const s = w3 || r;
    if (w3 !== null && w3 !== undefined && w3.destroyed || r !== null && r !== undefined && r.destroyed) {
      if (typeof cb === "function") {
        cb();
      }
      return this;
    }
    checkError(err2, w3, r);
    if (w3) {
      w3.destroyed = true;
    }
    if (r) {
      r.destroyed = true;
    }
    if (!s.constructed) {
      this.once(kDestroy, function(er) {
        _destroy(this, aggregateTwoErrors(er, err2), cb);
      });
    } else {
      _destroy(this, err2, cb);
    }
    return this;
  }
  function _destroy(self2, err2, cb) {
    let called = false;
    function onDestroy(err3) {
      if (called) {
        return;
      }
      called = true;
      const r = self2._readableState;
      const w3 = self2._writableState;
      checkError(err3, w3, r);
      if (w3) {
        w3.closed = true;
      }
      if (r) {
        r.closed = true;
      }
      if (typeof cb === "function") {
        cb(err3);
      }
      if (err3) {
        process.nextTick(emitErrorCloseNT, self2, err3);
      } else {
        process.nextTick(emitCloseNT, self2);
      }
    }
    try {
      self2._destroy(err2 || null, onDestroy);
    } catch (err3) {
      onDestroy(err3);
    }
  }
  function emitErrorCloseNT(self2, err2) {
    emitErrorNT(self2, err2);
    emitCloseNT(self2);
  }
  function emitCloseNT(self2) {
    const r = self2._readableState;
    const w3 = self2._writableState;
    if (w3) {
      w3.closeEmitted = true;
    }
    if (r) {
      r.closeEmitted = true;
    }
    if (w3 !== null && w3 !== undefined && w3.emitClose || r !== null && r !== undefined && r.emitClose) {
      self2.emit("close");
    }
  }
  function emitErrorNT(self2, err2) {
    const r = self2._readableState;
    const w3 = self2._writableState;
    if (w3 !== null && w3 !== undefined && w3.errorEmitted || r !== null && r !== undefined && r.errorEmitted) {
      return;
    }
    if (w3) {
      w3.errorEmitted = true;
    }
    if (r) {
      r.errorEmitted = true;
    }
    self2.emit("error", err2);
  }
  function undestroy() {
    const r = this._readableState;
    const w3 = this._writableState;
    if (r) {
      r.constructed = true;
      r.closed = false;
      r.closeEmitted = false;
      r.destroyed = false;
      r.errored = null;
      r.errorEmitted = false;
      r.reading = false;
      r.ended = r.readable === false;
      r.endEmitted = r.readable === false;
    }
    if (w3) {
      w3.constructed = true;
      w3.destroyed = false;
      w3.closed = false;
      w3.closeEmitted = false;
      w3.errored = null;
      w3.errorEmitted = false;
      w3.finalCalled = false;
      w3.prefinished = false;
      w3.ended = w3.writable === false;
      w3.ending = w3.writable === false;
      w3.finished = w3.writable === false;
    }
  }
  function errorOrDestroy(stream, err2, sync) {
    const r = stream._readableState;
    const w3 = stream._writableState;
    if (w3 !== null && w3 !== undefined && w3.destroyed || r !== null && r !== undefined && r.destroyed) {
      return this;
    }
    if (r !== null && r !== undefined && r.autoDestroy || w3 !== null && w3 !== undefined && w3.autoDestroy)
      stream.destroy(err2);
    else if (err2) {
      err2.stack;
      if (w3 && !w3.errored) {
        w3.errored = err2;
      }
      if (r && !r.errored) {
        r.errored = err2;
      }
      if (sync) {
        process.nextTick(emitErrorNT, stream, err2);
      } else {
        emitErrorNT(stream, err2);
      }
    }
  }
  function construct(stream, cb) {
    if (typeof stream._construct !== "function") {
      return;
    }
    const r = stream._readableState;
    const w3 = stream._writableState;
    if (r) {
      r.constructed = false;
    }
    if (w3) {
      w3.constructed = false;
    }
    stream.once(kConstruct, cb);
    if (stream.listenerCount(kConstruct) > 1) {
      return;
    }
    process.nextTick(constructNT, stream);
  }
  function constructNT(stream) {
    let called = false;
    function onConstruct(err2) {
      if (called) {
        errorOrDestroy(stream, err2 !== null && err2 !== undefined ? err2 : new ERR_MULTIPLE_CALLBACK);
        return;
      }
      called = true;
      const r = stream._readableState;
      const w3 = stream._writableState;
      const s = w3 || r;
      if (r) {
        r.constructed = true;
      }
      if (w3) {
        w3.constructed = true;
      }
      if (s.destroyed) {
        stream.emit(kDestroy, err2);
      } else if (err2) {
        errorOrDestroy(stream, err2, true);
      } else {
        process.nextTick(emitConstructNT, stream);
      }
    }
    try {
      stream._construct((err2) => {
        process.nextTick(onConstruct, err2);
      });
    } catch (err2) {
      process.nextTick(onConstruct, err2);
    }
  }
  function emitConstructNT(stream) {
    stream.emit(kConstruct);
  }
  function isRequest(stream) {
    return (stream === null || stream === undefined ? undefined : stream.setHeader) && typeof stream.abort === "function";
  }
  function emitCloseLegacy(stream) {
    stream.emit("close");
  }
  function emitErrorCloseLegacy(stream, err2) {
    stream.emit("error", err2);
    process.nextTick(emitCloseLegacy, stream);
  }
  function destroyer(stream, err2) {
    if (!stream || isDestroyed(stream)) {
      return;
    }
    if (!err2 && !isFinished(stream)) {
      err2 = new AbortError;
    }
    if (isServerRequest(stream)) {
      stream.socket = null;
      stream.destroy(err2);
    } else if (isRequest(stream)) {
      stream.abort();
    } else if (isRequest(stream.req)) {
      stream.req.abort();
    } else if (typeof stream.destroy === "function") {
      stream.destroy(err2);
    } else if (typeof stream.close === "function") {
      stream.close();
    } else if (err2) {
      process.nextTick(emitErrorCloseLegacy, stream, err2);
    } else {
      process.nextTick(emitCloseLegacy, stream);
    }
    if (!stream.destroyed) {
      stream[kIsDestroyed] = true;
    }
  }
  module.exports = {
    construct,
    destroyer,
    destroy,
    undestroy,
    errorOrDestroy
  };
});

// node_modules/readable-stream/lib/internal/streams/legacy.js
var require_legacy = __commonJS((exports, module) => {
  var { ArrayIsArray, ObjectSetPrototypeOf } = require_primordials();
  var { EventEmitter: EE } = (init_events(), __toCommonJS(exports_events));
  function Stream(opts) {
    EE.call(this, opts);
  }
  ObjectSetPrototypeOf(Stream.prototype, EE.prototype);
  ObjectSetPrototypeOf(Stream, EE);
  Stream.prototype.pipe = function(dest, options) {
    const source = this;
    function ondata(chunk) {
      if (dest.writable && dest.write(chunk) === false && source.pause) {
        source.pause();
      }
    }
    source.on("data", ondata);
    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }
    dest.on("drain", ondrain);
    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on("end", onend);
      source.on("close", onclose);
    }
    let didOnEnd = false;
    function onend() {
      if (didOnEnd)
        return;
      didOnEnd = true;
      dest.end();
    }
    function onclose() {
      if (didOnEnd)
        return;
      didOnEnd = true;
      if (typeof dest.destroy === "function")
        dest.destroy();
    }
    function onerror(er) {
      cleanup();
      if (EE.listenerCount(this, "error") === 0) {
        this.emit("error", er);
      }
    }
    prependListener(source, "error", onerror);
    prependListener(dest, "error", onerror);
    function cleanup() {
      source.removeListener("data", ondata);
      dest.removeListener("drain", ondrain);
      source.removeListener("end", onend);
      source.removeListener("close", onclose);
      source.removeListener("error", onerror);
      dest.removeListener("error", onerror);
      source.removeListener("end", cleanup);
      source.removeListener("close", cleanup);
      dest.removeListener("close", cleanup);
    }
    source.on("end", cleanup);
    source.on("close", cleanup);
    dest.on("close", cleanup);
    dest.emit("pipe", source);
    return dest;
  };
  function prependListener(emitter, event, fn) {
    if (typeof emitter.prependListener === "function")
      return emitter.prependListener(event, fn);
    if (!emitter._events || !emitter._events[event])
      emitter.on(event, fn);
    else if (ArrayIsArray(emitter._events[event]))
      emitter._events[event].unshift(fn);
    else
      emitter._events[event] = [fn, emitter._events[event]];
  }
  module.exports = {
    Stream,
    prependListener
  };
});

// node_modules/readable-stream/lib/internal/streams/add-abort-signal.js
var require_add_abort_signal = __commonJS((exports, module) => {
  var { SymbolDispose } = require_primordials();
  var { AbortError, codes } = require_errors();
  var { isNodeStream, isWebStream, kControllerErrorFunction } = require_utils();
  var eos = require_end_of_stream();
  var { ERR_INVALID_ARG_TYPE } = codes;
  var addAbortListener;
  var validateAbortSignal = (signal, name) => {
    if (typeof signal !== "object" || !("aborted" in signal)) {
      throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
    }
  };
  exports.addAbortSignal = function addAbortSignal(signal, stream) {
    validateAbortSignal(signal, "signal");
    if (!isNodeStream(stream) && !isWebStream(stream)) {
      throw new ERR_INVALID_ARG_TYPE("stream", ["ReadableStream", "WritableStream", "Stream"], stream);
    }
    return exports.addAbortSignalNoValidate(signal, stream);
  };
  exports.addAbortSignalNoValidate = function(signal, stream) {
    if (typeof signal !== "object" || !("aborted" in signal)) {
      return stream;
    }
    const onAbort = isNodeStream(stream) ? () => {
      stream.destroy(new AbortError(undefined, {
        cause: signal.reason
      }));
    } : () => {
      stream[kControllerErrorFunction](new AbortError(undefined, {
        cause: signal.reason
      }));
    };
    if (signal.aborted) {
      onAbort();
    } else {
      addAbortListener = addAbortListener || require_util().addAbortListener;
      const disposable = addAbortListener(signal, onAbort);
      eos(stream, disposable[SymbolDispose]);
    }
    return stream;
  };
});

// node_modules/readable-stream/lib/internal/streams/buffer_list.js
var require_buffer_list = __commonJS((exports, module) => {
  var { StringPrototypeSlice, SymbolIterator, TypedArrayPrototypeSet, Uint8Array: Uint8Array2 } = require_primordials();
  var { Buffer: Buffer2 } = (init_buffer(), __toCommonJS(exports_buffer));
  var { inspect } = require_util();
  module.exports = class BufferList {
    constructor() {
      this.head = null;
      this.tail = null;
      this.length = 0;
    }
    push(v3) {
      const entry = {
        data: v3,
        next: null
      };
      if (this.length > 0)
        this.tail.next = entry;
      else
        this.head = entry;
      this.tail = entry;
      ++this.length;
    }
    unshift(v3) {
      const entry = {
        data: v3,
        next: this.head
      };
      if (this.length === 0)
        this.tail = entry;
      this.head = entry;
      ++this.length;
    }
    shift() {
      if (this.length === 0)
        return;
      const ret = this.head.data;
      if (this.length === 1)
        this.head = this.tail = null;
      else
        this.head = this.head.next;
      --this.length;
      return ret;
    }
    clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
    join(s) {
      if (this.length === 0)
        return "";
      let p = this.head;
      let ret = "" + p.data;
      while ((p = p.next) !== null)
        ret += s + p.data;
      return ret;
    }
    concat(n) {
      if (this.length === 0)
        return Buffer2.alloc(0);
      const ret = Buffer2.allocUnsafe(n >>> 0);
      let p = this.head;
      let i = 0;
      while (p) {
        TypedArrayPrototypeSet(ret, p.data, i);
        i += p.data.length;
        p = p.next;
      }
      return ret;
    }
    consume(n, hasStrings) {
      const data = this.head.data;
      if (n < data.length) {
        const slice = data.slice(0, n);
        this.head.data = data.slice(n);
        return slice;
      }
      if (n === data.length) {
        return this.shift();
      }
      return hasStrings ? this._getString(n) : this._getBuffer(n);
    }
    first() {
      return this.head.data;
    }
    *[SymbolIterator]() {
      for (let p = this.head;p; p = p.next) {
        yield p.data;
      }
    }
    _getString(n) {
      let ret = "";
      let p = this.head;
      let c = 0;
      do {
        const str = p.data;
        if (n > str.length) {
          ret += str;
          n -= str.length;
        } else {
          if (n === str.length) {
            ret += str;
            ++c;
            if (p.next)
              this.head = p.next;
            else
              this.head = this.tail = null;
          } else {
            ret += StringPrototypeSlice(str, 0, n);
            this.head = p;
            p.data = StringPrototypeSlice(str, n);
          }
          break;
        }
        ++c;
      } while ((p = p.next) !== null);
      this.length -= c;
      return ret;
    }
    _getBuffer(n) {
      const ret = Buffer2.allocUnsafe(n);
      const retLen = n;
      let p = this.head;
      let c = 0;
      do {
        const buf = p.data;
        if (n > buf.length) {
          TypedArrayPrototypeSet(ret, buf, retLen - n);
          n -= buf.length;
        } else {
          if (n === buf.length) {
            TypedArrayPrototypeSet(ret, buf, retLen - n);
            ++c;
            if (p.next)
              this.head = p.next;
            else
              this.head = this.tail = null;
          } else {
            TypedArrayPrototypeSet(ret, new Uint8Array2(buf.buffer, buf.byteOffset, n), retLen - n);
            this.head = p;
            p.data = buf.slice(n);
          }
          break;
        }
        ++c;
      } while ((p = p.next) !== null);
      this.length -= c;
      return ret;
    }
    [Symbol.for("nodejs.util.inspect.custom")](_2, options) {
      return inspect(this, {
        ...options,
        depth: 0,
        customInspect: false
      });
    }
  };
});

// node_modules/readable-stream/lib/internal/streams/state.js
var require_state = __commonJS((exports, module) => {
  var { MathFloor, NumberIsInteger } = require_primordials();
  var { validateInteger } = require_validators();
  var { ERR_INVALID_ARG_VALUE } = require_errors().codes;
  var defaultHighWaterMarkBytes = 16 * 1024;
  var defaultHighWaterMarkObjectMode = 16;
  function highWaterMarkFrom(options, isDuplex, duplexKey) {
    return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
  }
  function getDefaultHighWaterMark(objectMode) {
    return objectMode ? defaultHighWaterMarkObjectMode : defaultHighWaterMarkBytes;
  }
  function setDefaultHighWaterMark(objectMode, value) {
    validateInteger(value, "value", 0);
    if (objectMode) {
      defaultHighWaterMarkObjectMode = value;
    } else {
      defaultHighWaterMarkBytes = value;
    }
  }
  function getHighWaterMark(state, options, duplexKey, isDuplex) {
    const hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
    if (hwm != null) {
      if (!NumberIsInteger(hwm) || hwm < 0) {
        const name = isDuplex ? `options.${duplexKey}` : "options.highWaterMark";
        throw new ERR_INVALID_ARG_VALUE(name, hwm);
      }
      return MathFloor(hwm);
    }
    return getDefaultHighWaterMark(state.objectMode);
  }
  module.exports = {
    getHighWaterMark,
    getDefaultHighWaterMark,
    setDefaultHighWaterMark
  };
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS((exports, module) => {
  /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
  var buffer = (init_buffer(), __toCommonJS(exports_buffer));
  var Buffer2 = buffer.Buffer;
  function copyProps(src, dst) {
    for (var key in src) {
      dst[key] = src[key];
    }
  }
  if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
    module.exports = buffer;
  } else {
    copyProps(buffer, exports);
    exports.Buffer = SafeBuffer;
  }
  function SafeBuffer(arg, encodingOrOffset, length) {
    return Buffer2(arg, encodingOrOffset, length);
  }
  SafeBuffer.prototype = Object.create(Buffer2.prototype);
  copyProps(Buffer2, SafeBuffer);
  SafeBuffer.from = function(arg, encodingOrOffset, length) {
    if (typeof arg === "number") {
      throw new TypeError("Argument must not be a number");
    }
    return Buffer2(arg, encodingOrOffset, length);
  };
  SafeBuffer.alloc = function(size, fill, encoding) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    var buf = Buffer2(size);
    if (fill !== undefined) {
      if (typeof encoding === "string") {
        buf.fill(fill, encoding);
      } else {
        buf.fill(fill);
      }
    } else {
      buf.fill(0);
    }
    return buf;
  };
  SafeBuffer.allocUnsafe = function(size) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    return Buffer2(size);
  };
  SafeBuffer.allocUnsafeSlow = function(size) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    return buffer.SlowBuffer(size);
  };
});

// node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS((exports) => {
  var Buffer2 = require_safe_buffer().Buffer;
  var isEncoding = Buffer2.isEncoding || function(encoding) {
    encoding = "" + encoding;
    switch (encoding && encoding.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return true;
      default:
        return false;
    }
  };
  function _normalizeEncoding(enc) {
    if (!enc)
      return "utf8";
    var retried;
    while (true) {
      switch (enc) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return enc;
        default:
          if (retried)
            return;
          enc = ("" + enc).toLowerCase();
          retried = true;
      }
    }
  }
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc)))
      throw new Error("Unknown encoding: " + enc);
    return nenc || enc;
  }
  exports.StringDecoder = StringDecoder;
  function StringDecoder(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch (this.encoding) {
      case "utf16le":
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;
      case "utf8":
        this.fillLast = utf8FillLast;
        nb = 4;
        break;
      case "base64":
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;
      default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer2.allocUnsafe(nb);
  }
  StringDecoder.prototype.write = function(buf) {
    if (buf.length === 0)
      return "";
    var r;
    var i;
    if (this.lastNeed) {
      r = this.fillLast(buf);
      if (r === undefined)
        return "";
      i = this.lastNeed;
      this.lastNeed = 0;
    } else {
      i = 0;
    }
    if (i < buf.length)
      return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || "";
  };
  StringDecoder.prototype.end = utf8End;
  StringDecoder.prototype.text = utf8Text;
  StringDecoder.prototype.fillLast = function(buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
  };
  function utf8CheckByte(byte) {
    if (byte <= 127)
      return 0;
    else if (byte >> 5 === 6)
      return 2;
    else if (byte >> 4 === 14)
      return 3;
    else if (byte >> 3 === 30)
      return 4;
    return byte >> 6 === 2 ? -1 : -2;
  }
  function utf8CheckIncomplete(self2, buf, i) {
    var j2 = buf.length - 1;
    if (j2 < i)
      return 0;
    var nb = utf8CheckByte(buf[j2]);
    if (nb >= 0) {
      if (nb > 0)
        self2.lastNeed = nb - 1;
      return nb;
    }
    if (--j2 < i || nb === -2)
      return 0;
    nb = utf8CheckByte(buf[j2]);
    if (nb >= 0) {
      if (nb > 0)
        self2.lastNeed = nb - 2;
      return nb;
    }
    if (--j2 < i || nb === -2)
      return 0;
    nb = utf8CheckByte(buf[j2]);
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2)
          nb = 0;
        else
          self2.lastNeed = nb - 3;
      }
      return nb;
    }
    return 0;
  }
  function utf8CheckExtraBytes(self2, buf, p) {
    if ((buf[0] & 192) !== 128) {
      self2.lastNeed = 0;
      return "�";
    }
    if (self2.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 192) !== 128) {
        self2.lastNeed = 1;
        return "�";
      }
      if (self2.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 192) !== 128) {
          self2.lastNeed = 2;
          return "�";
        }
      }
    }
  }
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf, p);
    if (r !== undefined)
      return r;
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
  }
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed)
      return buf.toString("utf8", i);
    this.lastTotal = total;
    var end = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end);
    return buf.toString("utf8", i, end);
  }
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed)
      return r + "�";
    return r;
  }
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString("utf16le", i);
      if (r) {
        var c = r.charCodeAt(r.length - 1);
        if (c >= 55296 && c <= 56319) {
          this.lastNeed = 2;
          this.lastTotal = 4;
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
          return r.slice(0, -1);
        }
      }
      return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString("utf16le", i, buf.length - 1);
  }
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) {
      var end = this.lastTotal - this.lastNeed;
      return r + this.lastChar.toString("utf16le", 0, end);
    }
    return r;
  }
  function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0)
      return buf.toString("base64", i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1];
    } else {
      this.lastChar[0] = buf[buf.length - 2];
      this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString("base64", i, buf.length - n);
  }
  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed)
      return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
    return r;
  }
  function simpleWrite(buf) {
    return buf.toString(this.encoding);
  }
  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : "";
  }
});

// node_modules/readable-stream/lib/internal/streams/from.js
var require_from = __commonJS((exports, module) => {
  var process = require_browser2();
  var { PromisePrototypeThen, SymbolAsyncIterator, SymbolIterator } = require_primordials();
  var { Buffer: Buffer2 } = (init_buffer(), __toCommonJS(exports_buffer));
  var { ERR_INVALID_ARG_TYPE, ERR_STREAM_NULL_VALUES } = require_errors().codes;
  function from(Readable, iterable, opts) {
    let iterator;
    if (typeof iterable === "string" || iterable instanceof Buffer2) {
      return new Readable({
        objectMode: true,
        ...opts,
        read() {
          this.push(iterable);
          this.push(null);
        }
      });
    }
    let isAsync;
    if (iterable && iterable[SymbolAsyncIterator]) {
      isAsync = true;
      iterator = iterable[SymbolAsyncIterator]();
    } else if (iterable && iterable[SymbolIterator]) {
      isAsync = false;
      iterator = iterable[SymbolIterator]();
    } else {
      throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
    }
    const readable = new Readable({
      objectMode: true,
      highWaterMark: 1,
      ...opts
    });
    let reading = false;
    readable._read = function() {
      if (!reading) {
        reading = true;
        next();
      }
    };
    readable._destroy = function(error, cb) {
      PromisePrototypeThen(close(error), () => process.nextTick(cb, error), (e) => process.nextTick(cb, e || error));
    };
    async function close(error) {
      const hadError = error !== undefined && error !== null;
      const hasThrow = typeof iterator.throw === "function";
      if (hadError && hasThrow) {
        const { value, done } = await iterator.throw(error);
        await value;
        if (done) {
          return;
        }
      }
      if (typeof iterator.return === "function") {
        const { value } = await iterator.return();
        await value;
      }
    }
    async function next() {
      for (;; ) {
        try {
          const { value, done } = isAsync ? await iterator.next() : iterator.next();
          if (done) {
            readable.push(null);
          } else {
            const res = value && typeof value.then === "function" ? await value : value;
            if (res === null) {
              reading = false;
              throw new ERR_STREAM_NULL_VALUES;
            } else if (readable.push(res)) {
              continue;
            } else {
              reading = false;
            }
          }
        } catch (err2) {
          readable.destroy(err2);
        }
        break;
      }
    }
    return readable;
  }
  module.exports = from;
});

// node_modules/readable-stream/lib/internal/streams/readable.js
var require_readable = __commonJS((exports, module) => {
  var process = require_browser2();
  var {
    ArrayPrototypeIndexOf,
    NumberIsInteger,
    NumberIsNaN,
    NumberParseInt,
    ObjectDefineProperties,
    ObjectKeys,
    ObjectSetPrototypeOf,
    Promise: Promise2,
    SafeSet,
    SymbolAsyncDispose,
    SymbolAsyncIterator,
    Symbol: Symbol2
  } = require_primordials();
  module.exports = Readable;
  Readable.ReadableState = ReadableState;
  var { EventEmitter: EE } = (init_events(), __toCommonJS(exports_events));
  var { Stream, prependListener } = require_legacy();
  var { Buffer: Buffer2 } = (init_buffer(), __toCommonJS(exports_buffer));
  var { addAbortSignal } = require_add_abort_signal();
  var eos = require_end_of_stream();
  var debug2 = require_util().debuglog("stream", (fn) => {
    debug2 = fn;
  });
  var BufferList = require_buffer_list();
  var destroyImpl = require_destroy();
  var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
  var {
    aggregateTwoErrors,
    codes: {
      ERR_INVALID_ARG_TYPE,
      ERR_METHOD_NOT_IMPLEMENTED,
      ERR_OUT_OF_RANGE,
      ERR_STREAM_PUSH_AFTER_EOF,
      ERR_STREAM_UNSHIFT_AFTER_END_EVENT
    },
    AbortError
  } = require_errors();
  var { validateObject } = require_validators();
  var kPaused = Symbol2("kPaused");
  var { StringDecoder } = require_string_decoder();
  var from = require_from();
  ObjectSetPrototypeOf(Readable.prototype, Stream.prototype);
  ObjectSetPrototypeOf(Readable, Stream);
  var nop = () => {
  };
  var { errorOrDestroy } = destroyImpl;
  var kObjectMode = 1 << 0;
  var kEnded = 1 << 1;
  var kEndEmitted = 1 << 2;
  var kReading = 1 << 3;
  var kConstructed = 1 << 4;
  var kSync = 1 << 5;
  var kNeedReadable = 1 << 6;
  var kEmittedReadable = 1 << 7;
  var kReadableListening = 1 << 8;
  var kResumeScheduled = 1 << 9;
  var kErrorEmitted = 1 << 10;
  var kEmitClose = 1 << 11;
  var kAutoDestroy = 1 << 12;
  var kDestroyed = 1 << 13;
  var kClosed = 1 << 14;
  var kCloseEmitted = 1 << 15;
  var kMultiAwaitDrain = 1 << 16;
  var kReadingMore = 1 << 17;
  var kDataEmitted = 1 << 18;
  function makeBitMapDescriptor(bit) {
    return {
      enumerable: false,
      get() {
        return (this.state & bit) !== 0;
      },
      set(value) {
        if (value)
          this.state |= bit;
        else
          this.state &= ~bit;
      }
    };
  }
  ObjectDefineProperties(ReadableState.prototype, {
    objectMode: makeBitMapDescriptor(kObjectMode),
    ended: makeBitMapDescriptor(kEnded),
    endEmitted: makeBitMapDescriptor(kEndEmitted),
    reading: makeBitMapDescriptor(kReading),
    constructed: makeBitMapDescriptor(kConstructed),
    sync: makeBitMapDescriptor(kSync),
    needReadable: makeBitMapDescriptor(kNeedReadable),
    emittedReadable: makeBitMapDescriptor(kEmittedReadable),
    readableListening: makeBitMapDescriptor(kReadableListening),
    resumeScheduled: makeBitMapDescriptor(kResumeScheduled),
    errorEmitted: makeBitMapDescriptor(kErrorEmitted),
    emitClose: makeBitMapDescriptor(kEmitClose),
    autoDestroy: makeBitMapDescriptor(kAutoDestroy),
    destroyed: makeBitMapDescriptor(kDestroyed),
    closed: makeBitMapDescriptor(kClosed),
    closeEmitted: makeBitMapDescriptor(kCloseEmitted),
    multiAwaitDrain: makeBitMapDescriptor(kMultiAwaitDrain),
    readingMore: makeBitMapDescriptor(kReadingMore),
    dataEmitted: makeBitMapDescriptor(kDataEmitted)
  });
  function ReadableState(options, stream, isDuplex) {
    if (typeof isDuplex !== "boolean")
      isDuplex = stream instanceof require_duplex();
    this.state = kEmitClose | kAutoDestroy | kConstructed | kSync;
    if (options && options.objectMode)
      this.state |= kObjectMode;
    if (isDuplex && options && options.readableObjectMode)
      this.state |= kObjectMode;
    this.highWaterMark = options ? getHighWaterMark(this, options, "readableHighWaterMark", isDuplex) : getDefaultHighWaterMark(false);
    this.buffer = new BufferList;
    this.length = 0;
    this.pipes = [];
    this.flowing = null;
    this[kPaused] = null;
    if (options && options.emitClose === false)
      this.state &= ~kEmitClose;
    if (options && options.autoDestroy === false)
      this.state &= ~kAutoDestroy;
    this.errored = null;
    this.defaultEncoding = options && options.defaultEncoding || "utf8";
    this.awaitDrainWriters = null;
    this.decoder = null;
    this.encoding = null;
    if (options && options.encoding) {
      this.decoder = new StringDecoder(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable(options) {
    if (!(this instanceof Readable))
      return new Readable(options);
    const isDuplex = this instanceof require_duplex();
    this._readableState = new ReadableState(options, this, isDuplex);
    if (options) {
      if (typeof options.read === "function")
        this._read = options.read;
      if (typeof options.destroy === "function")
        this._destroy = options.destroy;
      if (typeof options.construct === "function")
        this._construct = options.construct;
      if (options.signal && !isDuplex)
        addAbortSignal(options.signal, this);
    }
    Stream.call(this, options);
    destroyImpl.construct(this, () => {
      if (this._readableState.needReadable) {
        maybeReadMore(this, this._readableState);
      }
    });
  }
  Readable.prototype.destroy = destroyImpl.destroy;
  Readable.prototype._undestroy = destroyImpl.undestroy;
  Readable.prototype._destroy = function(err2, cb) {
    cb(err2);
  };
  Readable.prototype[EE.captureRejectionSymbol] = function(err2) {
    this.destroy(err2);
  };
  Readable.prototype[SymbolAsyncDispose] = function() {
    let error;
    if (!this.destroyed) {
      error = this.readableEnded ? null : new AbortError;
      this.destroy(error);
    }
    return new Promise2((resolve2, reject) => eos(this, (err2) => err2 && err2 !== error ? reject(err2) : resolve2(null)));
  };
  Readable.prototype.push = function(chunk, encoding) {
    return readableAddChunk(this, chunk, encoding, false);
  };
  Readable.prototype.unshift = function(chunk, encoding) {
    return readableAddChunk(this, chunk, encoding, true);
  };
  function readableAddChunk(stream, chunk, encoding, addToFront) {
    debug2("readableAddChunk", chunk);
    const state = stream._readableState;
    let err2;
    if ((state.state & kObjectMode) === 0) {
      if (typeof chunk === "string") {
        encoding = encoding || state.defaultEncoding;
        if (state.encoding !== encoding) {
          if (addToFront && state.encoding) {
            chunk = Buffer2.from(chunk, encoding).toString(state.encoding);
          } else {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
        }
      } else if (chunk instanceof Buffer2) {
        encoding = "";
      } else if (Stream._isUint8Array(chunk)) {
        chunk = Stream._uint8ArrayToBuffer(chunk);
        encoding = "";
      } else if (chunk != null) {
        err2 = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
    }
    if (err2) {
      errorOrDestroy(stream, err2);
    } else if (chunk === null) {
      state.state &= ~kReading;
      onEofChunk(stream, state);
    } else if ((state.state & kObjectMode) !== 0 || chunk && chunk.length > 0) {
      if (addToFront) {
        if ((state.state & kEndEmitted) !== 0)
          errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT);
        else if (state.destroyed || state.errored)
          return false;
        else
          addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF);
      } else if (state.destroyed || state.errored) {
        return false;
      } else {
        state.state &= ~kReading;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0)
            addChunk(stream, state, chunk, false);
          else
            maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.state &= ~kReading;
      maybeReadMore(stream, state);
    }
    return !state.ended && (state.length < state.highWaterMark || state.length === 0);
  }
  function addChunk(stream, state, chunk, addToFront) {
    if (state.flowing && state.length === 0 && !state.sync && stream.listenerCount("data") > 0) {
      if ((state.state & kMultiAwaitDrain) !== 0) {
        state.awaitDrainWriters.clear();
      } else {
        state.awaitDrainWriters = null;
      }
      state.dataEmitted = true;
      stream.emit("data", chunk);
    } else {
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront)
        state.buffer.unshift(chunk);
      else
        state.buffer.push(chunk);
      if ((state.state & kNeedReadable) !== 0)
        emitReadable(stream);
    }
    maybeReadMore(stream, state);
  }
  Readable.prototype.isPaused = function() {
    const state = this._readableState;
    return state[kPaused] === true || state.flowing === false;
  };
  Readable.prototype.setEncoding = function(enc) {
    const decoder2 = new StringDecoder(enc);
    this._readableState.decoder = decoder2;
    this._readableState.encoding = this._readableState.decoder.encoding;
    const buffer = this._readableState.buffer;
    let content = "";
    for (const data of buffer) {
      content += decoder2.write(data);
    }
    buffer.clear();
    if (content !== "")
      buffer.push(content);
    this._readableState.length = content.length;
    return this;
  };
  var MAX_HWM = 1073741824;
  function computeNewHighWaterMark(n) {
    if (n > MAX_HWM) {
      throw new ERR_OUT_OF_RANGE("size", "<= 1GiB", n);
    } else {
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }
    return n;
  }
  function howMuchToRead(n, state) {
    if (n <= 0 || state.length === 0 && state.ended)
      return 0;
    if ((state.state & kObjectMode) !== 0)
      return 1;
    if (NumberIsNaN(n)) {
      if (state.flowing && state.length)
        return state.buffer.first().length;
      return state.length;
    }
    if (n <= state.length)
      return n;
    return state.ended ? state.length : 0;
  }
  Readable.prototype.read = function(n) {
    debug2("read", n);
    if (n === undefined) {
      n = NaN;
    } else if (!NumberIsInteger(n)) {
      n = NumberParseInt(n, 10);
    }
    const state = this._readableState;
    const nOrig = n;
    if (n > state.highWaterMark)
      state.highWaterMark = computeNewHighWaterMark(n);
    if (n !== 0)
      state.state &= ~kEmittedReadable;
    if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
      debug2("read: emitReadable", state.length, state.ended);
      if (state.length === 0 && state.ended)
        endReadable(this);
      else
        emitReadable(this);
      return null;
    }
    n = howMuchToRead(n, state);
    if (n === 0 && state.ended) {
      if (state.length === 0)
        endReadable(this);
      return null;
    }
    let doRead = (state.state & kNeedReadable) !== 0;
    debug2("need readable", doRead);
    if (state.length === 0 || state.length - n < state.highWaterMark) {
      doRead = true;
      debug2("length less than watermark", doRead);
    }
    if (state.ended || state.reading || state.destroyed || state.errored || !state.constructed) {
      doRead = false;
      debug2("reading, ended or constructing", doRead);
    } else if (doRead) {
      debug2("do read");
      state.state |= kReading | kSync;
      if (state.length === 0)
        state.state |= kNeedReadable;
      try {
        this._read(state.highWaterMark);
      } catch (err2) {
        errorOrDestroy(this, err2);
      }
      state.state &= ~kSync;
      if (!state.reading)
        n = howMuchToRead(nOrig, state);
    }
    let ret;
    if (n > 0)
      ret = fromList(n, state);
    else
      ret = null;
    if (ret === null) {
      state.needReadable = state.length <= state.highWaterMark;
      n = 0;
    } else {
      state.length -= n;
      if (state.multiAwaitDrain) {
        state.awaitDrainWriters.clear();
      } else {
        state.awaitDrainWriters = null;
      }
    }
    if (state.length === 0) {
      if (!state.ended)
        state.needReadable = true;
      if (nOrig !== n && state.ended)
        endReadable(this);
    }
    if (ret !== null && !state.errorEmitted && !state.closeEmitted) {
      state.dataEmitted = true;
      this.emit("data", ret);
    }
    return ret;
  };
  function onEofChunk(stream, state) {
    debug2("onEofChunk");
    if (state.ended)
      return;
    if (state.decoder) {
      const chunk = state.decoder.end();
      if (chunk && chunk.length) {
        state.buffer.push(chunk);
        state.length += state.objectMode ? 1 : chunk.length;
      }
    }
    state.ended = true;
    if (state.sync) {
      emitReadable(stream);
    } else {
      state.needReadable = false;
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
  function emitReadable(stream) {
    const state = stream._readableState;
    debug2("emitReadable", state.needReadable, state.emittedReadable);
    state.needReadable = false;
    if (!state.emittedReadable) {
      debug2("emitReadable", state.flowing);
      state.emittedReadable = true;
      process.nextTick(emitReadable_, stream);
    }
  }
  function emitReadable_(stream) {
    const state = stream._readableState;
    debug2("emitReadable_", state.destroyed, state.length, state.ended);
    if (!state.destroyed && !state.errored && (state.length || state.ended)) {
      stream.emit("readable");
      state.emittedReadable = false;
    }
    state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
    flow(stream);
  }
  function maybeReadMore(stream, state) {
    if (!state.readingMore && state.constructed) {
      state.readingMore = true;
      process.nextTick(maybeReadMore_, stream, state);
    }
  }
  function maybeReadMore_(stream, state) {
    while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
      const len = state.length;
      debug2("maybeReadMore read 0");
      stream.read(0);
      if (len === state.length)
        break;
    }
    state.readingMore = false;
  }
  Readable.prototype._read = function(n) {
    throw new ERR_METHOD_NOT_IMPLEMENTED("_read()");
  };
  Readable.prototype.pipe = function(dest, pipeOpts) {
    const src = this;
    const state = this._readableState;
    if (state.pipes.length === 1) {
      if (!state.multiAwaitDrain) {
        state.multiAwaitDrain = true;
        state.awaitDrainWriters = new SafeSet(state.awaitDrainWriters ? [state.awaitDrainWriters] : []);
      }
    }
    state.pipes.push(dest);
    debug2("pipe count=%d opts=%j", state.pipes.length, pipeOpts);
    const doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
    const endFn = doEnd ? onend : unpipe;
    if (state.endEmitted)
      process.nextTick(endFn);
    else
      src.once("end", endFn);
    dest.on("unpipe", onunpipe);
    function onunpipe(readable, unpipeInfo) {
      debug2("onunpipe");
      if (readable === src) {
        if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
          unpipeInfo.hasUnpiped = true;
          cleanup();
        }
      }
    }
    function onend() {
      debug2("onend");
      dest.end();
    }
    let ondrain;
    let cleanedUp = false;
    function cleanup() {
      debug2("cleanup");
      dest.removeListener("close", onclose);
      dest.removeListener("finish", onfinish);
      if (ondrain) {
        dest.removeListener("drain", ondrain);
      }
      dest.removeListener("error", onerror);
      dest.removeListener("unpipe", onunpipe);
      src.removeListener("end", onend);
      src.removeListener("end", unpipe);
      src.removeListener("data", ondata);
      cleanedUp = true;
      if (ondrain && state.awaitDrainWriters && (!dest._writableState || dest._writableState.needDrain))
        ondrain();
    }
    function pause() {
      if (!cleanedUp) {
        if (state.pipes.length === 1 && state.pipes[0] === dest) {
          debug2("false write response, pause", 0);
          state.awaitDrainWriters = dest;
          state.multiAwaitDrain = false;
        } else if (state.pipes.length > 1 && state.pipes.includes(dest)) {
          debug2("false write response, pause", state.awaitDrainWriters.size);
          state.awaitDrainWriters.add(dest);
        }
        src.pause();
      }
      if (!ondrain) {
        ondrain = pipeOnDrain(src, dest);
        dest.on("drain", ondrain);
      }
    }
    src.on("data", ondata);
    function ondata(chunk) {
      debug2("ondata");
      const ret = dest.write(chunk);
      debug2("dest.write", ret);
      if (ret === false) {
        pause();
      }
    }
    function onerror(er) {
      debug2("onerror", er);
      unpipe();
      dest.removeListener("error", onerror);
      if (dest.listenerCount("error") === 0) {
        const s = dest._writableState || dest._readableState;
        if (s && !s.errorEmitted) {
          errorOrDestroy(dest, er);
        } else {
          dest.emit("error", er);
        }
      }
    }
    prependListener(dest, "error", onerror);
    function onclose() {
      dest.removeListener("finish", onfinish);
      unpipe();
    }
    dest.once("close", onclose);
    function onfinish() {
      debug2("onfinish");
      dest.removeListener("close", onclose);
      unpipe();
    }
    dest.once("finish", onfinish);
    function unpipe() {
      debug2("unpipe");
      src.unpipe(dest);
    }
    dest.emit("pipe", src);
    if (dest.writableNeedDrain === true) {
      pause();
    } else if (!state.flowing) {
      debug2("pipe resume");
      src.resume();
    }
    return dest;
  };
  function pipeOnDrain(src, dest) {
    return function pipeOnDrainFunctionResult() {
      const state = src._readableState;
      if (state.awaitDrainWriters === dest) {
        debug2("pipeOnDrain", 1);
        state.awaitDrainWriters = null;
      } else if (state.multiAwaitDrain) {
        debug2("pipeOnDrain", state.awaitDrainWriters.size);
        state.awaitDrainWriters.delete(dest);
      }
      if ((!state.awaitDrainWriters || state.awaitDrainWriters.size === 0) && src.listenerCount("data")) {
        src.resume();
      }
    };
  }
  Readable.prototype.unpipe = function(dest) {
    const state = this._readableState;
    const unpipeInfo = {
      hasUnpiped: false
    };
    if (state.pipes.length === 0)
      return this;
    if (!dest) {
      const dests = state.pipes;
      state.pipes = [];
      this.pause();
      for (let i = 0;i < dests.length; i++)
        dests[i].emit("unpipe", this, {
          hasUnpiped: false
        });
      return this;
    }
    const index = ArrayPrototypeIndexOf(state.pipes, dest);
    if (index === -1)
      return this;
    state.pipes.splice(index, 1);
    if (state.pipes.length === 0)
      this.pause();
    dest.emit("unpipe", this, unpipeInfo);
    return this;
  };
  Readable.prototype.on = function(ev, fn) {
    const res = Stream.prototype.on.call(this, ev, fn);
    const state = this._readableState;
    if (ev === "data") {
      state.readableListening = this.listenerCount("readable") > 0;
      if (state.flowing !== false)
        this.resume();
    } else if (ev === "readable") {
      if (!state.endEmitted && !state.readableListening) {
        state.readableListening = state.needReadable = true;
        state.flowing = false;
        state.emittedReadable = false;
        debug2("on readable", state.length, state.reading);
        if (state.length) {
          emitReadable(this);
        } else if (!state.reading) {
          process.nextTick(nReadingNextTick, this);
        }
      }
    }
    return res;
  };
  Readable.prototype.addListener = Readable.prototype.on;
  Readable.prototype.removeListener = function(ev, fn) {
    const res = Stream.prototype.removeListener.call(this, ev, fn);
    if (ev === "readable") {
      process.nextTick(updateReadableListening, this);
    }
    return res;
  };
  Readable.prototype.off = Readable.prototype.removeListener;
  Readable.prototype.removeAllListeners = function(ev) {
    const res = Stream.prototype.removeAllListeners.apply(this, arguments);
    if (ev === "readable" || ev === undefined) {
      process.nextTick(updateReadableListening, this);
    }
    return res;
  };
  function updateReadableListening(self2) {
    const state = self2._readableState;
    state.readableListening = self2.listenerCount("readable") > 0;
    if (state.resumeScheduled && state[kPaused] === false) {
      state.flowing = true;
    } else if (self2.listenerCount("data") > 0) {
      self2.resume();
    } else if (!state.readableListening) {
      state.flowing = null;
    }
  }
  function nReadingNextTick(self2) {
    debug2("readable nexttick read 0");
    self2.read(0);
  }
  Readable.prototype.resume = function() {
    const state = this._readableState;
    if (!state.flowing) {
      debug2("resume");
      state.flowing = !state.readableListening;
      resume(this, state);
    }
    state[kPaused] = false;
    return this;
  };
  function resume(stream, state) {
    if (!state.resumeScheduled) {
      state.resumeScheduled = true;
      process.nextTick(resume_, stream, state);
    }
  }
  function resume_(stream, state) {
    debug2("resume", state.reading);
    if (!state.reading) {
      stream.read(0);
    }
    state.resumeScheduled = false;
    stream.emit("resume");
    flow(stream);
    if (state.flowing && !state.reading)
      stream.read(0);
  }
  Readable.prototype.pause = function() {
    debug2("call pause flowing=%j", this._readableState.flowing);
    if (this._readableState.flowing !== false) {
      debug2("pause");
      this._readableState.flowing = false;
      this.emit("pause");
    }
    this._readableState[kPaused] = true;
    return this;
  };
  function flow(stream) {
    const state = stream._readableState;
    debug2("flow", state.flowing);
    while (state.flowing && stream.read() !== null)
      ;
  }
  Readable.prototype.wrap = function(stream) {
    let paused = false;
    stream.on("data", (chunk) => {
      if (!this.push(chunk) && stream.pause) {
        paused = true;
        stream.pause();
      }
    });
    stream.on("end", () => {
      this.push(null);
    });
    stream.on("error", (err2) => {
      errorOrDestroy(this, err2);
    });
    stream.on("close", () => {
      this.destroy();
    });
    stream.on("destroy", () => {
      this.destroy();
    });
    this._read = () => {
      if (paused && stream.resume) {
        paused = false;
        stream.resume();
      }
    };
    const streamKeys = ObjectKeys(stream);
    for (let j2 = 1;j2 < streamKeys.length; j2++) {
      const i = streamKeys[j2];
      if (this[i] === undefined && typeof stream[i] === "function") {
        this[i] = stream[i].bind(stream);
      }
    }
    return this;
  };
  Readable.prototype[SymbolAsyncIterator] = function() {
    return streamToAsyncIterator(this);
  };
  Readable.prototype.iterator = function(options) {
    if (options !== undefined) {
      validateObject(options, "options");
    }
    return streamToAsyncIterator(this, options);
  };
  function streamToAsyncIterator(stream, options) {
    if (typeof stream.read !== "function") {
      stream = Readable.wrap(stream, {
        objectMode: true
      });
    }
    const iter = createAsyncIterator(stream, options);
    iter.stream = stream;
    return iter;
  }
  async function* createAsyncIterator(stream, options) {
    let callback = nop;
    function next(resolve2) {
      if (this === stream) {
        callback();
        callback = nop;
      } else {
        callback = resolve2;
      }
    }
    stream.on("readable", next);
    let error;
    const cleanup = eos(stream, {
      writable: false
    }, (err2) => {
      error = err2 ? aggregateTwoErrors(error, err2) : null;
      callback();
      callback = nop;
    });
    try {
      while (true) {
        const chunk = stream.destroyed ? null : stream.read();
        if (chunk !== null) {
          yield chunk;
        } else if (error) {
          throw error;
        } else if (error === null) {
          return;
        } else {
          await new Promise2(next);
        }
      }
    } catch (err2) {
      error = aggregateTwoErrors(error, err2);
      throw error;
    } finally {
      if ((error || (options === null || options === undefined ? undefined : options.destroyOnReturn) !== false) && (error === undefined || stream._readableState.autoDestroy)) {
        destroyImpl.destroyer(stream, null);
      } else {
        stream.off("readable", next);
        cleanup();
      }
    }
  }
  ObjectDefineProperties(Readable.prototype, {
    readable: {
      __proto__: null,
      get() {
        const r = this._readableState;
        return !!r && r.readable !== false && !r.destroyed && !r.errorEmitted && !r.endEmitted;
      },
      set(val) {
        if (this._readableState) {
          this._readableState.readable = !!val;
        }
      }
    },
    readableDidRead: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return this._readableState.dataEmitted;
      }
    },
    readableAborted: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return !!(this._readableState.readable !== false && (this._readableState.destroyed || this._readableState.errored) && !this._readableState.endEmitted);
      }
    },
    readableHighWaterMark: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return this._readableState.highWaterMark;
      }
    },
    readableBuffer: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return this._readableState && this._readableState.buffer;
      }
    },
    readableFlowing: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return this._readableState.flowing;
      },
      set: function(state) {
        if (this._readableState) {
          this._readableState.flowing = state;
        }
      }
    },
    readableLength: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState.length;
      }
    },
    readableObjectMode: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState ? this._readableState.objectMode : false;
      }
    },
    readableEncoding: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState ? this._readableState.encoding : null;
      }
    },
    errored: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState ? this._readableState.errored : null;
      }
    },
    closed: {
      __proto__: null,
      get() {
        return this._readableState ? this._readableState.closed : false;
      }
    },
    destroyed: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState ? this._readableState.destroyed : false;
      },
      set(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    },
    readableEnded: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._readableState ? this._readableState.endEmitted : false;
      }
    }
  });
  ObjectDefineProperties(ReadableState.prototype, {
    pipesCount: {
      __proto__: null,
      get() {
        return this.pipes.length;
      }
    },
    paused: {
      __proto__: null,
      get() {
        return this[kPaused] !== false;
      },
      set(value) {
        this[kPaused] = !!value;
      }
    }
  });
  Readable._fromList = fromList;
  function fromList(n, state) {
    if (state.length === 0)
      return null;
    let ret;
    if (state.objectMode)
      ret = state.buffer.shift();
    else if (!n || n >= state.length) {
      if (state.decoder)
        ret = state.buffer.join("");
      else if (state.buffer.length === 1)
        ret = state.buffer.first();
      else
        ret = state.buffer.concat(state.length);
      state.buffer.clear();
    } else {
      ret = state.buffer.consume(n, state.decoder);
    }
    return ret;
  }
  function endReadable(stream) {
    const state = stream._readableState;
    debug2("endReadable", state.endEmitted);
    if (!state.endEmitted) {
      state.ended = true;
      process.nextTick(endReadableNT, state, stream);
    }
  }
  function endReadableNT(state, stream) {
    debug2("endReadableNT", state.endEmitted, state.length);
    if (!state.errored && !state.closeEmitted && !state.endEmitted && state.length === 0) {
      state.endEmitted = true;
      stream.emit("end");
      if (stream.writable && stream.allowHalfOpen === false) {
        process.nextTick(endWritableNT, stream);
      } else if (state.autoDestroy) {
        const wState = stream._writableState;
        const autoDestroy = !wState || wState.autoDestroy && (wState.finished || wState.writable === false);
        if (autoDestroy) {
          stream.destroy();
        }
      }
    }
  }
  function endWritableNT(stream) {
    const writable = stream.writable && !stream.writableEnded && !stream.destroyed;
    if (writable) {
      stream.end();
    }
  }
  Readable.from = function(iterable, opts) {
    return from(Readable, iterable, opts);
  };
  var webStreamsAdapters;
  function lazyWebStreams() {
    if (webStreamsAdapters === undefined)
      webStreamsAdapters = {};
    return webStreamsAdapters;
  }
  Readable.fromWeb = function(readableStream, options) {
    return lazyWebStreams().newStreamReadableFromReadableStream(readableStream, options);
  };
  Readable.toWeb = function(streamReadable, options) {
    return lazyWebStreams().newReadableStreamFromStreamReadable(streamReadable, options);
  };
  Readable.wrap = function(src, options) {
    var _ref, _src$readableObjectMo;
    return new Readable({
      objectMode: (_ref = (_src$readableObjectMo = src.readableObjectMode) !== null && _src$readableObjectMo !== undefined ? _src$readableObjectMo : src.objectMode) !== null && _ref !== undefined ? _ref : true,
      ...options,
      destroy(err2, callback) {
        destroyImpl.destroyer(src, err2);
        callback(err2);
      }
    }).wrap(src);
  };
});

// node_modules/readable-stream/lib/internal/streams/writable.js
var require_writable = __commonJS((exports, module) => {
  var process = require_browser2();
  var {
    ArrayPrototypeSlice,
    Error: Error2,
    FunctionPrototypeSymbolHasInstance,
    ObjectDefineProperty,
    ObjectDefineProperties,
    ObjectSetPrototypeOf,
    StringPrototypeToLowerCase,
    Symbol: Symbol2,
    SymbolHasInstance
  } = require_primordials();
  module.exports = Writable;
  Writable.WritableState = WritableState;
  var { EventEmitter: EE } = (init_events(), __toCommonJS(exports_events));
  var Stream = require_legacy().Stream;
  var { Buffer: Buffer2 } = (init_buffer(), __toCommonJS(exports_buffer));
  var destroyImpl = require_destroy();
  var { addAbortSignal } = require_add_abort_signal();
  var { getHighWaterMark, getDefaultHighWaterMark } = require_state();
  var {
    ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED,
    ERR_STREAM_ALREADY_FINISHED,
    ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING
  } = require_errors().codes;
  var { errorOrDestroy } = destroyImpl;
  ObjectSetPrototypeOf(Writable.prototype, Stream.prototype);
  ObjectSetPrototypeOf(Writable, Stream);
  function nop() {
  }
  var kOnFinished = Symbol2("kOnFinished");
  function WritableState(options, stream, isDuplex) {
    if (typeof isDuplex !== "boolean")
      isDuplex = stream instanceof require_duplex();
    this.objectMode = !!(options && options.objectMode);
    if (isDuplex)
      this.objectMode = this.objectMode || !!(options && options.writableObjectMode);
    this.highWaterMark = options ? getHighWaterMark(this, options, "writableHighWaterMark", isDuplex) : getDefaultHighWaterMark(false);
    this.finalCalled = false;
    this.needDrain = false;
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.destroyed = false;
    const noDecode = !!(options && options.decodeStrings === false);
    this.decodeStrings = !noDecode;
    this.defaultEncoding = options && options.defaultEncoding || "utf8";
    this.length = 0;
    this.writing = false;
    this.corked = 0;
    this.sync = true;
    this.bufferProcessing = false;
    this.onwrite = onwrite.bind(undefined, stream);
    this.writecb = null;
    this.writelen = 0;
    this.afterWriteTickInfo = null;
    resetBuffer(this);
    this.pendingcb = 0;
    this.constructed = true;
    this.prefinished = false;
    this.errorEmitted = false;
    this.emitClose = !options || options.emitClose !== false;
    this.autoDestroy = !options || options.autoDestroy !== false;
    this.errored = null;
    this.closed = false;
    this.closeEmitted = false;
    this[kOnFinished] = [];
  }
  function resetBuffer(state) {
    state.buffered = [];
    state.bufferedIndex = 0;
    state.allBuffers = true;
    state.allNoop = true;
  }
  WritableState.prototype.getBuffer = function getBuffer() {
    return ArrayPrototypeSlice(this.buffered, this.bufferedIndex);
  };
  ObjectDefineProperty(WritableState.prototype, "bufferedRequestCount", {
    __proto__: null,
    get() {
      return this.buffered.length - this.bufferedIndex;
    }
  });
  function Writable(options) {
    const isDuplex = this instanceof require_duplex();
    if (!isDuplex && !FunctionPrototypeSymbolHasInstance(Writable, this))
      return new Writable(options);
    this._writableState = new WritableState(options, this, isDuplex);
    if (options) {
      if (typeof options.write === "function")
        this._write = options.write;
      if (typeof options.writev === "function")
        this._writev = options.writev;
      if (typeof options.destroy === "function")
        this._destroy = options.destroy;
      if (typeof options.final === "function")
        this._final = options.final;
      if (typeof options.construct === "function")
        this._construct = options.construct;
      if (options.signal)
        addAbortSignal(options.signal, this);
    }
    Stream.call(this, options);
    destroyImpl.construct(this, () => {
      const state = this._writableState;
      if (!state.writing) {
        clearBuffer(this, state);
      }
      finishMaybe(this, state);
    });
  }
  ObjectDefineProperty(Writable, SymbolHasInstance, {
    __proto__: null,
    value: function(object) {
      if (FunctionPrototypeSymbolHasInstance(this, object))
        return true;
      if (this !== Writable)
        return false;
      return object && object._writableState instanceof WritableState;
    }
  });
  Writable.prototype.pipe = function() {
    errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE);
  };
  function _write(stream, chunk, encoding, cb) {
    const state = stream._writableState;
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = state.defaultEncoding;
    } else {
      if (!encoding)
        encoding = state.defaultEncoding;
      else if (encoding !== "buffer" && !Buffer2.isEncoding(encoding))
        throw new ERR_UNKNOWN_ENCODING(encoding);
      if (typeof cb !== "function")
        cb = nop;
    }
    if (chunk === null) {
      throw new ERR_STREAM_NULL_VALUES;
    } else if (!state.objectMode) {
      if (typeof chunk === "string") {
        if (state.decodeStrings !== false) {
          chunk = Buffer2.from(chunk, encoding);
          encoding = "buffer";
        }
      } else if (chunk instanceof Buffer2) {
        encoding = "buffer";
      } else if (Stream._isUint8Array(chunk)) {
        chunk = Stream._uint8ArrayToBuffer(chunk);
        encoding = "buffer";
      } else {
        throw new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
    }
    let err2;
    if (state.ending) {
      err2 = new ERR_STREAM_WRITE_AFTER_END;
    } else if (state.destroyed) {
      err2 = new ERR_STREAM_DESTROYED("write");
    }
    if (err2) {
      process.nextTick(cb, err2);
      errorOrDestroy(stream, err2, true);
      return err2;
    }
    state.pendingcb++;
    return writeOrBuffer(stream, state, chunk, encoding, cb);
  }
  Writable.prototype.write = function(chunk, encoding, cb) {
    return _write(this, chunk, encoding, cb) === true;
  };
  Writable.prototype.cork = function() {
    this._writableState.corked++;
  };
  Writable.prototype.uncork = function() {
    const state = this._writableState;
    if (state.corked) {
      state.corked--;
      if (!state.writing)
        clearBuffer(this, state);
    }
  };
  Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    if (typeof encoding === "string")
      encoding = StringPrototypeToLowerCase(encoding);
    if (!Buffer2.isEncoding(encoding))
      throw new ERR_UNKNOWN_ENCODING(encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };
  function writeOrBuffer(stream, state, chunk, encoding, callback) {
    const len = state.objectMode ? 1 : chunk.length;
    state.length += len;
    const ret = state.length < state.highWaterMark;
    if (!ret)
      state.needDrain = true;
    if (state.writing || state.corked || state.errored || !state.constructed) {
      state.buffered.push({
        chunk,
        encoding,
        callback
      });
      if (state.allBuffers && encoding !== "buffer") {
        state.allBuffers = false;
      }
      if (state.allNoop && callback !== nop) {
        state.allNoop = false;
      }
    } else {
      state.writelen = len;
      state.writecb = callback;
      state.writing = true;
      state.sync = true;
      stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    return ret && !state.errored && !state.destroyed;
  }
  function doWrite(stream, state, writev, len, chunk, encoding, cb) {
    state.writelen = len;
    state.writecb = cb;
    state.writing = true;
    state.sync = true;
    if (state.destroyed)
      state.onwrite(new ERR_STREAM_DESTROYED("write"));
    else if (writev)
      stream._writev(chunk, state.onwrite);
    else
      stream._write(chunk, encoding, state.onwrite);
    state.sync = false;
  }
  function onwriteError(stream, state, er, cb) {
    --state.pendingcb;
    cb(er);
    errorBuffer(state);
    errorOrDestroy(stream, er);
  }
  function onwrite(stream, er) {
    const state = stream._writableState;
    const sync = state.sync;
    const cb = state.writecb;
    if (typeof cb !== "function") {
      errorOrDestroy(stream, new ERR_MULTIPLE_CALLBACK);
      return;
    }
    state.writing = false;
    state.writecb = null;
    state.length -= state.writelen;
    state.writelen = 0;
    if (er) {
      er.stack;
      if (!state.errored) {
        state.errored = er;
      }
      if (stream._readableState && !stream._readableState.errored) {
        stream._readableState.errored = er;
      }
      if (sync) {
        process.nextTick(onwriteError, stream, state, er, cb);
      } else {
        onwriteError(stream, state, er, cb);
      }
    } else {
      if (state.buffered.length > state.bufferedIndex) {
        clearBuffer(stream, state);
      }
      if (sync) {
        if (state.afterWriteTickInfo !== null && state.afterWriteTickInfo.cb === cb) {
          state.afterWriteTickInfo.count++;
        } else {
          state.afterWriteTickInfo = {
            count: 1,
            cb,
            stream,
            state
          };
          process.nextTick(afterWriteTick, state.afterWriteTickInfo);
        }
      } else {
        afterWrite(stream, state, 1, cb);
      }
    }
  }
  function afterWriteTick({ stream, state, count, cb }) {
    state.afterWriteTickInfo = null;
    return afterWrite(stream, state, count, cb);
  }
  function afterWrite(stream, state, count, cb) {
    const needDrain = !state.ending && !stream.destroyed && state.length === 0 && state.needDrain;
    if (needDrain) {
      state.needDrain = false;
      stream.emit("drain");
    }
    while (count-- > 0) {
      state.pendingcb--;
      cb();
    }
    if (state.destroyed) {
      errorBuffer(state);
    }
    finishMaybe(stream, state);
  }
  function errorBuffer(state) {
    if (state.writing) {
      return;
    }
    for (let n = state.bufferedIndex;n < state.buffered.length; ++n) {
      var _state$errored;
      const { chunk, callback } = state.buffered[n];
      const len = state.objectMode ? 1 : chunk.length;
      state.length -= len;
      callback((_state$errored = state.errored) !== null && _state$errored !== undefined ? _state$errored : new ERR_STREAM_DESTROYED("write"));
    }
    const onfinishCallbacks = state[kOnFinished].splice(0);
    for (let i = 0;i < onfinishCallbacks.length; i++) {
      var _state$errored2;
      onfinishCallbacks[i]((_state$errored2 = state.errored) !== null && _state$errored2 !== undefined ? _state$errored2 : new ERR_STREAM_DESTROYED("end"));
    }
    resetBuffer(state);
  }
  function clearBuffer(stream, state) {
    if (state.corked || state.bufferProcessing || state.destroyed || !state.constructed) {
      return;
    }
    const { buffered, bufferedIndex, objectMode } = state;
    const bufferedLength = buffered.length - bufferedIndex;
    if (!bufferedLength) {
      return;
    }
    let i = bufferedIndex;
    state.bufferProcessing = true;
    if (bufferedLength > 1 && stream._writev) {
      state.pendingcb -= bufferedLength - 1;
      const callback = state.allNoop ? nop : (err2) => {
        for (let n = i;n < buffered.length; ++n) {
          buffered[n].callback(err2);
        }
      };
      const chunks = state.allNoop && i === 0 ? buffered : ArrayPrototypeSlice(buffered, i);
      chunks.allBuffers = state.allBuffers;
      doWrite(stream, state, true, state.length, chunks, "", callback);
      resetBuffer(state);
    } else {
      do {
        const { chunk, encoding, callback } = buffered[i];
        buffered[i++] = null;
        const len = objectMode ? 1 : chunk.length;
        doWrite(stream, state, false, len, chunk, encoding, callback);
      } while (i < buffered.length && !state.writing);
      if (i === buffered.length) {
        resetBuffer(state);
      } else if (i > 256) {
        buffered.splice(0, i);
        state.bufferedIndex = 0;
      } else {
        state.bufferedIndex = i;
      }
    }
    state.bufferProcessing = false;
  }
  Writable.prototype._write = function(chunk, encoding, cb) {
    if (this._writev) {
      this._writev([
        {
          chunk,
          encoding
        }
      ], cb);
    } else {
      throw new ERR_METHOD_NOT_IMPLEMENTED("_write()");
    }
  };
  Writable.prototype._writev = null;
  Writable.prototype.end = function(chunk, encoding, cb) {
    const state = this._writableState;
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    let err2;
    if (chunk !== null && chunk !== undefined) {
      const ret = _write(this, chunk, encoding);
      if (ret instanceof Error2) {
        err2 = ret;
      }
    }
    if (state.corked) {
      state.corked = 1;
      this.uncork();
    }
    if (err2) {
    } else if (!state.errored && !state.ending) {
      state.ending = true;
      finishMaybe(this, state, true);
      state.ended = true;
    } else if (state.finished) {
      err2 = new ERR_STREAM_ALREADY_FINISHED("end");
    } else if (state.destroyed) {
      err2 = new ERR_STREAM_DESTROYED("end");
    }
    if (typeof cb === "function") {
      if (err2 || state.finished) {
        process.nextTick(cb, err2);
      } else {
        state[kOnFinished].push(cb);
      }
    }
    return this;
  };
  function needFinish(state) {
    return state.ending && !state.destroyed && state.constructed && state.length === 0 && !state.errored && state.buffered.length === 0 && !state.finished && !state.writing && !state.errorEmitted && !state.closeEmitted;
  }
  function callFinal(stream, state) {
    let called = false;
    function onFinish(err2) {
      if (called) {
        errorOrDestroy(stream, err2 !== null && err2 !== undefined ? err2 : ERR_MULTIPLE_CALLBACK());
        return;
      }
      called = true;
      state.pendingcb--;
      if (err2) {
        const onfinishCallbacks = state[kOnFinished].splice(0);
        for (let i = 0;i < onfinishCallbacks.length; i++) {
          onfinishCallbacks[i](err2);
        }
        errorOrDestroy(stream, err2, state.sync);
      } else if (needFinish(state)) {
        state.prefinished = true;
        stream.emit("prefinish");
        state.pendingcb++;
        process.nextTick(finish, stream, state);
      }
    }
    state.sync = true;
    state.pendingcb++;
    try {
      stream._final(onFinish);
    } catch (err2) {
      onFinish(err2);
    }
    state.sync = false;
  }
  function prefinish(stream, state) {
    if (!state.prefinished && !state.finalCalled) {
      if (typeof stream._final === "function" && !state.destroyed) {
        state.finalCalled = true;
        callFinal(stream, state);
      } else {
        state.prefinished = true;
        stream.emit("prefinish");
      }
    }
  }
  function finishMaybe(stream, state, sync) {
    if (needFinish(state)) {
      prefinish(stream, state);
      if (state.pendingcb === 0) {
        if (sync) {
          state.pendingcb++;
          process.nextTick((stream2, state2) => {
            if (needFinish(state2)) {
              finish(stream2, state2);
            } else {
              state2.pendingcb--;
            }
          }, stream, state);
        } else if (needFinish(state)) {
          state.pendingcb++;
          finish(stream, state);
        }
      }
    }
  }
  function finish(stream, state) {
    state.pendingcb--;
    state.finished = true;
    const onfinishCallbacks = state[kOnFinished].splice(0);
    for (let i = 0;i < onfinishCallbacks.length; i++) {
      onfinishCallbacks[i]();
    }
    stream.emit("finish");
    if (state.autoDestroy) {
      const rState = stream._readableState;
      const autoDestroy = !rState || rState.autoDestroy && (rState.endEmitted || rState.readable === false);
      if (autoDestroy) {
        stream.destroy();
      }
    }
  }
  ObjectDefineProperties(Writable.prototype, {
    closed: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.closed : false;
      }
    },
    destroyed: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.destroyed : false;
      },
      set(value) {
        if (this._writableState) {
          this._writableState.destroyed = value;
        }
      }
    },
    writable: {
      __proto__: null,
      get() {
        const w3 = this._writableState;
        return !!w3 && w3.writable !== false && !w3.destroyed && !w3.errored && !w3.ending && !w3.ended;
      },
      set(val) {
        if (this._writableState) {
          this._writableState.writable = !!val;
        }
      }
    },
    writableFinished: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.finished : false;
      }
    },
    writableObjectMode: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.objectMode : false;
      }
    },
    writableBuffer: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.getBuffer();
      }
    },
    writableEnded: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.ending : false;
      }
    },
    writableNeedDrain: {
      __proto__: null,
      get() {
        const wState = this._writableState;
        if (!wState)
          return false;
        return !wState.destroyed && !wState.ending && wState.needDrain;
      }
    },
    writableHighWaterMark: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.highWaterMark;
      }
    },
    writableCorked: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.corked : 0;
      }
    },
    writableLength: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.length;
      }
    },
    errored: {
      __proto__: null,
      enumerable: false,
      get() {
        return this._writableState ? this._writableState.errored : null;
      }
    },
    writableAborted: {
      __proto__: null,
      enumerable: false,
      get: function() {
        return !!(this._writableState.writable !== false && (this._writableState.destroyed || this._writableState.errored) && !this._writableState.finished);
      }
    }
  });
  var destroy = destroyImpl.destroy;
  Writable.prototype.destroy = function(err2, cb) {
    const state = this._writableState;
    if (!state.destroyed && (state.bufferedIndex < state.buffered.length || state[kOnFinished].length)) {
      process.nextTick(errorBuffer, state);
    }
    destroy.call(this, err2, cb);
    return this;
  };
  Writable.prototype._undestroy = destroyImpl.undestroy;
  Writable.prototype._destroy = function(err2, cb) {
    cb(err2);
  };
  Writable.prototype[EE.captureRejectionSymbol] = function(err2) {
    this.destroy(err2);
  };
  var webStreamsAdapters;
  function lazyWebStreams() {
    if (webStreamsAdapters === undefined)
      webStreamsAdapters = {};
    return webStreamsAdapters;
  }
  Writable.fromWeb = function(writableStream, options) {
    return lazyWebStreams().newStreamWritableFromWritableStream(writableStream, options);
  };
  Writable.toWeb = function(streamWritable) {
    return lazyWebStreams().newWritableStreamFromStreamWritable(streamWritable);
  };
});

// node_modules/readable-stream/lib/internal/streams/duplexify.js
var require_duplexify = __commonJS((exports, module) => {
  var process = require_browser2();
  var bufferModule = (init_buffer(), __toCommonJS(exports_buffer));
  var {
    isReadable: isReadable2,
    isWritable,
    isIterable,
    isNodeStream,
    isReadableNodeStream,
    isWritableNodeStream,
    isDuplexNodeStream,
    isReadableStream,
    isWritableStream
  } = require_utils();
  var eos = require_end_of_stream();
  var {
    AbortError,
    codes: { ERR_INVALID_ARG_TYPE, ERR_INVALID_RETURN_VALUE }
  } = require_errors();
  var { destroyer } = require_destroy();
  var Duplex = require_duplex();
  var Readable = require_readable();
  var Writable = require_writable();
  var { createDeferredPromise } = require_util();
  var from = require_from();
  var Blob2 = globalThis.Blob || bufferModule.Blob;
  var isBlob = typeof Blob2 !== "undefined" ? function isBlob(b3) {
    return b3 instanceof Blob2;
  } : function isBlob(b3) {
    return false;
  };
  var AbortController = globalThis.AbortController || require_browser().AbortController;
  var { FunctionPrototypeCall } = require_primordials();

  class Duplexify extends Duplex {
    constructor(options) {
      super(options);
      if ((options === null || options === undefined ? undefined : options.readable) === false) {
        this._readableState.readable = false;
        this._readableState.ended = true;
        this._readableState.endEmitted = true;
      }
      if ((options === null || options === undefined ? undefined : options.writable) === false) {
        this._writableState.writable = false;
        this._writableState.ending = true;
        this._writableState.ended = true;
        this._writableState.finished = true;
      }
    }
  }
  module.exports = function duplexify(body, name) {
    if (isDuplexNodeStream(body)) {
      return body;
    }
    if (isReadableNodeStream(body)) {
      return _duplexify({
        readable: body
      });
    }
    if (isWritableNodeStream(body)) {
      return _duplexify({
        writable: body
      });
    }
    if (isNodeStream(body)) {
      return _duplexify({
        writable: false,
        readable: false
      });
    }
    if (isReadableStream(body)) {
      return _duplexify({
        readable: Readable.fromWeb(body)
      });
    }
    if (isWritableStream(body)) {
      return _duplexify({
        writable: Writable.fromWeb(body)
      });
    }
    if (typeof body === "function") {
      const { value, write, final, destroy } = fromAsyncGen(body);
      if (isIterable(value)) {
        return from(Duplexify, value, {
          objectMode: true,
          write,
          final,
          destroy
        });
      }
      const then2 = value === null || value === undefined ? undefined : value.then;
      if (typeof then2 === "function") {
        let d2;
        const promise = FunctionPrototypeCall(then2, value, (val) => {
          if (val != null) {
            throw new ERR_INVALID_RETURN_VALUE("nully", "body", val);
          }
        }, (err2) => {
          destroyer(d2, err2);
        });
        return d2 = new Duplexify({
          objectMode: true,
          readable: false,
          write,
          final(cb) {
            final(async () => {
              try {
                await promise;
                process.nextTick(cb, null);
              } catch (err2) {
                process.nextTick(cb, err2);
              }
            });
          },
          destroy
        });
      }
      throw new ERR_INVALID_RETURN_VALUE("Iterable, AsyncIterable or AsyncFunction", name, value);
    }
    if (isBlob(body)) {
      return duplexify(body.arrayBuffer());
    }
    if (isIterable(body)) {
      return from(Duplexify, body, {
        objectMode: true,
        writable: false
      });
    }
    if (isReadableStream(body === null || body === undefined ? undefined : body.readable) && isWritableStream(body === null || body === undefined ? undefined : body.writable)) {
      return Duplexify.fromWeb(body);
    }
    if (typeof (body === null || body === undefined ? undefined : body.writable) === "object" || typeof (body === null || body === undefined ? undefined : body.readable) === "object") {
      const readable = body !== null && body !== undefined && body.readable ? isReadableNodeStream(body === null || body === undefined ? undefined : body.readable) ? body === null || body === undefined ? undefined : body.readable : duplexify(body.readable) : undefined;
      const writable = body !== null && body !== undefined && body.writable ? isWritableNodeStream(body === null || body === undefined ? undefined : body.writable) ? body === null || body === undefined ? undefined : body.writable : duplexify(body.writable) : undefined;
      return _duplexify({
        readable,
        writable
      });
    }
    const then = body === null || body === undefined ? undefined : body.then;
    if (typeof then === "function") {
      let d2;
      FunctionPrototypeCall(then, body, (val) => {
        if (val != null) {
          d2.push(val);
        }
        d2.push(null);
      }, (err2) => {
        destroyer(d2, err2);
      });
      return d2 = new Duplexify({
        objectMode: true,
        writable: false,
        read() {
        }
      });
    }
    throw new ERR_INVALID_ARG_TYPE(name, [
      "Blob",
      "ReadableStream",
      "WritableStream",
      "Stream",
      "Iterable",
      "AsyncIterable",
      "Function",
      "{ readable, writable } pair",
      "Promise"
    ], body);
  };
  function fromAsyncGen(fn) {
    let { promise, resolve: resolve2 } = createDeferredPromise();
    const ac = new AbortController;
    const signal = ac.signal;
    const value = fn(async function* () {
      while (true) {
        const _promise = promise;
        promise = null;
        const { chunk, done, cb } = await _promise;
        process.nextTick(cb);
        if (done)
          return;
        if (signal.aborted)
          throw new AbortError(undefined, {
            cause: signal.reason
          });
        ({ promise, resolve: resolve2 } = createDeferredPromise());
        yield chunk;
      }
    }(), {
      signal
    });
    return {
      value,
      write(chunk, encoding, cb) {
        const _resolve = resolve2;
        resolve2 = null;
        _resolve({
          chunk,
          done: false,
          cb
        });
      },
      final(cb) {
        const _resolve = resolve2;
        resolve2 = null;
        _resolve({
          done: true,
          cb
        });
      },
      destroy(err2, cb) {
        ac.abort();
        cb(err2);
      }
    };
  }
  function _duplexify(pair) {
    const r = pair.readable && typeof pair.readable.read !== "function" ? Readable.wrap(pair.readable) : pair.readable;
    const w3 = pair.writable;
    let readable = !!isReadable2(r);
    let writable = !!isWritable(w3);
    let ondrain;
    let onfinish;
    let onreadable;
    let onclose;
    let d2;
    function onfinished(err2) {
      const cb = onclose;
      onclose = null;
      if (cb) {
        cb(err2);
      } else if (err2) {
        d2.destroy(err2);
      }
    }
    d2 = new Duplexify({
      readableObjectMode: !!(r !== null && r !== undefined && r.readableObjectMode),
      writableObjectMode: !!(w3 !== null && w3 !== undefined && w3.writableObjectMode),
      readable,
      writable
    });
    if (writable) {
      eos(w3, (err2) => {
        writable = false;
        if (err2) {
          destroyer(r, err2);
        }
        onfinished(err2);
      });
      d2._write = function(chunk, encoding, callback) {
        if (w3.write(chunk, encoding)) {
          callback();
        } else {
          ondrain = callback;
        }
      };
      d2._final = function(callback) {
        w3.end();
        onfinish = callback;
      };
      w3.on("drain", function() {
        if (ondrain) {
          const cb = ondrain;
          ondrain = null;
          cb();
        }
      });
      w3.on("finish", function() {
        if (onfinish) {
          const cb = onfinish;
          onfinish = null;
          cb();
        }
      });
    }
    if (readable) {
      eos(r, (err2) => {
        readable = false;
        if (err2) {
          destroyer(r, err2);
        }
        onfinished(err2);
      });
      r.on("readable", function() {
        if (onreadable) {
          const cb = onreadable;
          onreadable = null;
          cb();
        }
      });
      r.on("end", function() {
        d2.push(null);
      });
      d2._read = function() {
        while (true) {
          const buf = r.read();
          if (buf === null) {
            onreadable = d2._read;
            return;
          }
          if (!d2.push(buf)) {
            return;
          }
        }
      };
    }
    d2._destroy = function(err2, callback) {
      if (!err2 && onclose !== null) {
        err2 = new AbortError;
      }
      onreadable = null;
      ondrain = null;
      onfinish = null;
      if (onclose === null) {
        callback(err2);
      } else {
        onclose = callback;
        destroyer(w3, err2);
        destroyer(r, err2);
      }
    };
    return d2;
  }
});

// node_modules/readable-stream/lib/internal/streams/duplex.js
var require_duplex = __commonJS((exports, module) => {
  var {
    ObjectDefineProperties,
    ObjectGetOwnPropertyDescriptor,
    ObjectKeys,
    ObjectSetPrototypeOf
  } = require_primordials();
  module.exports = Duplex;
  var Readable = require_readable();
  var Writable = require_writable();
  ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype);
  ObjectSetPrototypeOf(Duplex, Readable);
  {
    const keys = ObjectKeys(Writable.prototype);
    for (let i = 0;i < keys.length; i++) {
      const method = keys[i];
      if (!Duplex.prototype[method])
        Duplex.prototype[method] = Writable.prototype[method];
    }
  }
  function Duplex(options) {
    if (!(this instanceof Duplex))
      return new Duplex(options);
    Readable.call(this, options);
    Writable.call(this, options);
    if (options) {
      this.allowHalfOpen = options.allowHalfOpen !== false;
      if (options.readable === false) {
        this._readableState.readable = false;
        this._readableState.ended = true;
        this._readableState.endEmitted = true;
      }
      if (options.writable === false) {
        this._writableState.writable = false;
        this._writableState.ending = true;
        this._writableState.ended = true;
        this._writableState.finished = true;
      }
    } else {
      this.allowHalfOpen = true;
    }
  }
  ObjectDefineProperties(Duplex.prototype, {
    writable: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writable")
    },
    writableHighWaterMark: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableHighWaterMark")
    },
    writableObjectMode: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableObjectMode")
    },
    writableBuffer: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableBuffer")
    },
    writableLength: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableLength")
    },
    writableFinished: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableFinished")
    },
    writableCorked: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableCorked")
    },
    writableEnded: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableEnded")
    },
    writableNeedDrain: {
      __proto__: null,
      ...ObjectGetOwnPropertyDescriptor(Writable.prototype, "writableNeedDrain")
    },
    destroyed: {
      __proto__: null,
      get() {
        if (this._readableState === undefined || this._writableState === undefined) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set(value) {
        if (this._readableState && this._writableState) {
          this._readableState.destroyed = value;
          this._writableState.destroyed = value;
        }
      }
    }
  });
  var webStreamsAdapters;
  function lazyWebStreams() {
    if (webStreamsAdapters === undefined)
      webStreamsAdapters = {};
    return webStreamsAdapters;
  }
  Duplex.fromWeb = function(pair, options) {
    return lazyWebStreams().newStreamDuplexFromReadableWritablePair(pair, options);
  };
  Duplex.toWeb = function(duplex) {
    return lazyWebStreams().newReadableWritablePairFromDuplex(duplex);
  };
  var duplexify;
  Duplex.from = function(body) {
    if (!duplexify) {
      duplexify = require_duplexify();
    }
    return duplexify(body, "body");
  };
});

// node_modules/readable-stream/lib/internal/streams/transform.js
var require_transform = __commonJS((exports, module) => {
  var { ObjectSetPrototypeOf, Symbol: Symbol2 } = require_primordials();
  module.exports = Transform;
  var { ERR_METHOD_NOT_IMPLEMENTED } = require_errors().codes;
  var Duplex = require_duplex();
  var { getHighWaterMark } = require_state();
  ObjectSetPrototypeOf(Transform.prototype, Duplex.prototype);
  ObjectSetPrototypeOf(Transform, Duplex);
  var kCallback = Symbol2("kCallback");
  function Transform(options) {
    if (!(this instanceof Transform))
      return new Transform(options);
    const readableHighWaterMark = options ? getHighWaterMark(this, options, "readableHighWaterMark", true) : null;
    if (readableHighWaterMark === 0) {
      options = {
        ...options,
        highWaterMark: null,
        readableHighWaterMark,
        writableHighWaterMark: options.writableHighWaterMark || 0
      };
    }
    Duplex.call(this, options);
    this._readableState.sync = false;
    this[kCallback] = null;
    if (options) {
      if (typeof options.transform === "function")
        this._transform = options.transform;
      if (typeof options.flush === "function")
        this._flush = options.flush;
    }
    this.on("prefinish", prefinish);
  }
  function final(cb) {
    if (typeof this._flush === "function" && !this.destroyed) {
      this._flush((er, data) => {
        if (er) {
          if (cb) {
            cb(er);
          } else {
            this.destroy(er);
          }
          return;
        }
        if (data != null) {
          this.push(data);
        }
        this.push(null);
        if (cb) {
          cb();
        }
      });
    } else {
      this.push(null);
      if (cb) {
        cb();
      }
    }
  }
  function prefinish() {
    if (this._final !== final) {
      final.call(this);
    }
  }
  Transform.prototype._final = final;
  Transform.prototype._transform = function(chunk, encoding, callback) {
    throw new ERR_METHOD_NOT_IMPLEMENTED("_transform()");
  };
  Transform.prototype._write = function(chunk, encoding, callback) {
    const rState = this._readableState;
    const wState = this._writableState;
    const length = rState.length;
    this._transform(chunk, encoding, (err2, val) => {
      if (err2) {
        callback(err2);
        return;
      }
      if (val != null) {
        this.push(val);
      }
      if (wState.ended || length === rState.length || rState.length < rState.highWaterMark) {
        callback();
      } else {
        this[kCallback] = callback;
      }
    });
  };
  Transform.prototype._read = function() {
    if (this[kCallback]) {
      const callback = this[kCallback];
      this[kCallback] = null;
      callback();
    }
  };
});

// node_modules/readable-stream/lib/internal/streams/passthrough.js
var require_passthrough = __commonJS((exports, module) => {
  var { ObjectSetPrototypeOf } = require_primordials();
  module.exports = PassThrough;
  var Transform = require_transform();
  ObjectSetPrototypeOf(PassThrough.prototype, Transform.prototype);
  ObjectSetPrototypeOf(PassThrough, Transform);
  function PassThrough(options) {
    if (!(this instanceof PassThrough))
      return new PassThrough(options);
    Transform.call(this, options);
  }
  PassThrough.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
});

// node_modules/readable-stream/lib/internal/streams/pipeline.js
var require_pipeline = __commonJS((exports, module) => {
  var process = require_browser2();
  var { ArrayIsArray, Promise: Promise2, SymbolAsyncIterator, SymbolDispose } = require_primordials();
  var eos = require_end_of_stream();
  var { once } = require_util();
  var destroyImpl = require_destroy();
  var Duplex = require_duplex();
  var {
    aggregateTwoErrors,
    codes: {
      ERR_INVALID_ARG_TYPE,
      ERR_INVALID_RETURN_VALUE,
      ERR_MISSING_ARGS,
      ERR_STREAM_DESTROYED,
      ERR_STREAM_PREMATURE_CLOSE
    },
    AbortError
  } = require_errors();
  var { validateFunction, validateAbortSignal } = require_validators();
  var {
    isIterable,
    isReadable: isReadable2,
    isReadableNodeStream,
    isNodeStream,
    isTransformStream,
    isWebStream,
    isReadableStream,
    isReadableFinished
  } = require_utils();
  var AbortController = globalThis.AbortController || require_browser().AbortController;
  var PassThrough;
  var Readable;
  var addAbortListener;
  function destroyer(stream, reading, writing) {
    let finished = false;
    stream.on("close", () => {
      finished = true;
    });
    const cleanup = eos(stream, {
      readable: reading,
      writable: writing
    }, (err2) => {
      finished = !err2;
    });
    return {
      destroy: (err2) => {
        if (finished)
          return;
        finished = true;
        destroyImpl.destroyer(stream, err2 || new ERR_STREAM_DESTROYED("pipe"));
      },
      cleanup
    };
  }
  function popCallback(streams) {
    validateFunction(streams[streams.length - 1], "streams[stream.length - 1]");
    return streams.pop();
  }
  function makeAsyncIterable(val) {
    if (isIterable(val)) {
      return val;
    } else if (isReadableNodeStream(val)) {
      return fromReadable(val);
    }
    throw new ERR_INVALID_ARG_TYPE("val", ["Readable", "Iterable", "AsyncIterable"], val);
  }
  async function* fromReadable(val) {
    if (!Readable) {
      Readable = require_readable();
    }
    yield* Readable.prototype[SymbolAsyncIterator].call(val);
  }
  async function pumpToNode(iterable, writable, finish, { end }) {
    let error;
    let onresolve = null;
    const resume = (err2) => {
      if (err2) {
        error = err2;
      }
      if (onresolve) {
        const callback = onresolve;
        onresolve = null;
        callback();
      }
    };
    const wait = () => new Promise2((resolve2, reject) => {
      if (error) {
        reject(error);
      } else {
        onresolve = () => {
          if (error) {
            reject(error);
          } else {
            resolve2();
          }
        };
      }
    });
    writable.on("drain", resume);
    const cleanup = eos(writable, {
      readable: false
    }, resume);
    try {
      if (writable.writableNeedDrain) {
        await wait();
      }
      for await (const chunk of iterable) {
        if (!writable.write(chunk)) {
          await wait();
        }
      }
      if (end) {
        writable.end();
        await wait();
      }
      finish();
    } catch (err2) {
      finish(error !== err2 ? aggregateTwoErrors(error, err2) : err2);
    } finally {
      cleanup();
      writable.off("drain", resume);
    }
  }
  async function pumpToWeb(readable, writable, finish, { end }) {
    if (isTransformStream(writable)) {
      writable = writable.writable;
    }
    const writer = writable.getWriter();
    try {
      for await (const chunk of readable) {
        await writer.ready;
        writer.write(chunk).catch(() => {
        });
      }
      await writer.ready;
      if (end) {
        await writer.close();
      }
      finish();
    } catch (err2) {
      try {
        await writer.abort(err2);
        finish(err2);
      } catch (err3) {
        finish(err3);
      }
    }
  }
  function pipeline(...streams) {
    return pipelineImpl(streams, once(popCallback(streams)));
  }
  function pipelineImpl(streams, callback, opts) {
    if (streams.length === 1 && ArrayIsArray(streams[0])) {
      streams = streams[0];
    }
    if (streams.length < 2) {
      throw new ERR_MISSING_ARGS("streams");
    }
    const ac = new AbortController;
    const signal = ac.signal;
    const outerSignal = opts === null || opts === undefined ? undefined : opts.signal;
    const lastStreamCleanup = [];
    validateAbortSignal(outerSignal, "options.signal");
    function abort() {
      finishImpl(new AbortError);
    }
    addAbortListener = addAbortListener || require_util().addAbortListener;
    let disposable;
    if (outerSignal) {
      disposable = addAbortListener(outerSignal, abort);
    }
    let error;
    let value;
    const destroys = [];
    let finishCount = 0;
    function finish(err2) {
      finishImpl(err2, --finishCount === 0);
    }
    function finishImpl(err2, final) {
      var _disposable;
      if (err2 && (!error || error.code === "ERR_STREAM_PREMATURE_CLOSE")) {
        error = err2;
      }
      if (!error && !final) {
        return;
      }
      while (destroys.length) {
        destroys.shift()(error);
      }
      (_disposable = disposable) === null || _disposable === undefined || _disposable[SymbolDispose]();
      ac.abort();
      if (final) {
        if (!error) {
          lastStreamCleanup.forEach((fn) => fn());
        }
        process.nextTick(callback, error, value);
      }
    }
    let ret;
    for (let i = 0;i < streams.length; i++) {
      const stream = streams[i];
      const reading = i < streams.length - 1;
      const writing = i > 0;
      const end = reading || (opts === null || opts === undefined ? undefined : opts.end) !== false;
      const isLastStream = i === streams.length - 1;
      if (isNodeStream(stream)) {
        let onError2 = function(err2) {
          if (err2 && err2.name !== "AbortError" && err2.code !== "ERR_STREAM_PREMATURE_CLOSE") {
            finish(err2);
          }
        };
        var onError = onError2;
        if (end) {
          const { destroy, cleanup } = destroyer(stream, reading, writing);
          destroys.push(destroy);
          if (isReadable2(stream) && isLastStream) {
            lastStreamCleanup.push(cleanup);
          }
        }
        stream.on("error", onError2);
        if (isReadable2(stream) && isLastStream) {
          lastStreamCleanup.push(() => {
            stream.removeListener("error", onError2);
          });
        }
      }
      if (i === 0) {
        if (typeof stream === "function") {
          ret = stream({
            signal
          });
          if (!isIterable(ret)) {
            throw new ERR_INVALID_RETURN_VALUE("Iterable, AsyncIterable or Stream", "source", ret);
          }
        } else if (isIterable(stream) || isReadableNodeStream(stream) || isTransformStream(stream)) {
          ret = stream;
        } else {
          ret = Duplex.from(stream);
        }
      } else if (typeof stream === "function") {
        if (isTransformStream(ret)) {
          var _ret;
          ret = makeAsyncIterable((_ret = ret) === null || _ret === undefined ? undefined : _ret.readable);
        } else {
          ret = makeAsyncIterable(ret);
        }
        ret = stream(ret, {
          signal
        });
        if (reading) {
          if (!isIterable(ret, true)) {
            throw new ERR_INVALID_RETURN_VALUE("AsyncIterable", `transform[${i - 1}]`, ret);
          }
        } else {
          var _ret2;
          if (!PassThrough) {
            PassThrough = require_passthrough();
          }
          const pt2 = new PassThrough({
            objectMode: true
          });
          const then = (_ret2 = ret) === null || _ret2 === undefined ? undefined : _ret2.then;
          if (typeof then === "function") {
            finishCount++;
            then.call(ret, (val) => {
              value = val;
              if (val != null) {
                pt2.write(val);
              }
              if (end) {
                pt2.end();
              }
              process.nextTick(finish);
            }, (err2) => {
              pt2.destroy(err2);
              process.nextTick(finish, err2);
            });
          } else if (isIterable(ret, true)) {
            finishCount++;
            pumpToNode(ret, pt2, finish, {
              end
            });
          } else if (isReadableStream(ret) || isTransformStream(ret)) {
            const toRead = ret.readable || ret;
            finishCount++;
            pumpToNode(toRead, pt2, finish, {
              end
            });
          } else {
            throw new ERR_INVALID_RETURN_VALUE("AsyncIterable or Promise", "destination", ret);
          }
          ret = pt2;
          const { destroy, cleanup } = destroyer(ret, false, true);
          destroys.push(destroy);
          if (isLastStream) {
            lastStreamCleanup.push(cleanup);
          }
        }
      } else if (isNodeStream(stream)) {
        if (isReadableNodeStream(ret)) {
          finishCount += 2;
          const cleanup = pipe(ret, stream, finish, {
            end
          });
          if (isReadable2(stream) && isLastStream) {
            lastStreamCleanup.push(cleanup);
          }
        } else if (isTransformStream(ret) || isReadableStream(ret)) {
          const toRead = ret.readable || ret;
          finishCount++;
          pumpToNode(toRead, stream, finish, {
            end
          });
        } else if (isIterable(ret)) {
          finishCount++;
          pumpToNode(ret, stream, finish, {
            end
          });
        } else {
          throw new ERR_INVALID_ARG_TYPE("val", ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"], ret);
        }
        ret = stream;
      } else if (isWebStream(stream)) {
        if (isReadableNodeStream(ret)) {
          finishCount++;
          pumpToWeb(makeAsyncIterable(ret), stream, finish, {
            end
          });
        } else if (isReadableStream(ret) || isIterable(ret)) {
          finishCount++;
          pumpToWeb(ret, stream, finish, {
            end
          });
        } else if (isTransformStream(ret)) {
          finishCount++;
          pumpToWeb(ret.readable, stream, finish, {
            end
          });
        } else {
          throw new ERR_INVALID_ARG_TYPE("val", ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"], ret);
        }
        ret = stream;
      } else {
        ret = Duplex.from(stream);
      }
    }
    if (signal !== null && signal !== undefined && signal.aborted || outerSignal !== null && outerSignal !== undefined && outerSignal.aborted) {
      process.nextTick(abort);
    }
    return ret;
  }
  function pipe(src, dst, finish, { end }) {
    let ended = false;
    dst.on("close", () => {
      if (!ended) {
        finish(new ERR_STREAM_PREMATURE_CLOSE);
      }
    });
    src.pipe(dst, {
      end: false
    });
    if (end) {
      let endFn2 = function() {
        ended = true;
        dst.end();
      };
      var endFn = endFn2;
      if (isReadableFinished(src)) {
        process.nextTick(endFn2);
      } else {
        src.once("end", endFn2);
      }
    } else {
      finish();
    }
    eos(src, {
      readable: true,
      writable: false
    }, (err2) => {
      const rState = src._readableState;
      if (err2 && err2.code === "ERR_STREAM_PREMATURE_CLOSE" && rState && rState.ended && !rState.errored && !rState.errorEmitted) {
        src.once("end", finish).once("error", finish);
      } else {
        finish(err2);
      }
    });
    return eos(dst, {
      readable: false,
      writable: true
    }, finish);
  }
  module.exports = {
    pipelineImpl,
    pipeline
  };
});

// node_modules/readable-stream/lib/internal/streams/compose.js
var require_compose = __commonJS((exports, module) => {
  var { pipeline } = require_pipeline();
  var Duplex = require_duplex();
  var { destroyer } = require_destroy();
  var {
    isNodeStream,
    isReadable: isReadable2,
    isWritable,
    isWebStream,
    isTransformStream,
    isWritableStream,
    isReadableStream
  } = require_utils();
  var {
    AbortError,
    codes: { ERR_INVALID_ARG_VALUE, ERR_MISSING_ARGS }
  } = require_errors();
  var eos = require_end_of_stream();
  module.exports = function compose(...streams) {
    if (streams.length === 0) {
      throw new ERR_MISSING_ARGS("streams");
    }
    if (streams.length === 1) {
      return Duplex.from(streams[0]);
    }
    const orgStreams = [...streams];
    if (typeof streams[0] === "function") {
      streams[0] = Duplex.from(streams[0]);
    }
    if (typeof streams[streams.length - 1] === "function") {
      const idx = streams.length - 1;
      streams[idx] = Duplex.from(streams[idx]);
    }
    for (let n = 0;n < streams.length; ++n) {
      if (!isNodeStream(streams[n]) && !isWebStream(streams[n])) {
        continue;
      }
      if (n < streams.length - 1 && !(isReadable2(streams[n]) || isReadableStream(streams[n]) || isTransformStream(streams[n]))) {
        throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], "must be readable");
      }
      if (n > 0 && !(isWritable(streams[n]) || isWritableStream(streams[n]) || isTransformStream(streams[n]))) {
        throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], "must be writable");
      }
    }
    let ondrain;
    let onfinish;
    let onreadable;
    let onclose;
    let d2;
    function onfinished(err2) {
      const cb = onclose;
      onclose = null;
      if (cb) {
        cb(err2);
      } else if (err2) {
        d2.destroy(err2);
      } else if (!readable && !writable) {
        d2.destroy();
      }
    }
    const head = streams[0];
    const tail = pipeline(streams, onfinished);
    const writable = !!(isWritable(head) || isWritableStream(head) || isTransformStream(head));
    const readable = !!(isReadable2(tail) || isReadableStream(tail) || isTransformStream(tail));
    d2 = new Duplex({
      writableObjectMode: !!(head !== null && head !== undefined && head.writableObjectMode),
      readableObjectMode: !!(tail !== null && tail !== undefined && tail.readableObjectMode),
      writable,
      readable
    });
    if (writable) {
      if (isNodeStream(head)) {
        d2._write = function(chunk, encoding, callback) {
          if (head.write(chunk, encoding)) {
            callback();
          } else {
            ondrain = callback;
          }
        };
        d2._final = function(callback) {
          head.end();
          onfinish = callback;
        };
        head.on("drain", function() {
          if (ondrain) {
            const cb = ondrain;
            ondrain = null;
            cb();
          }
        });
      } else if (isWebStream(head)) {
        const writable2 = isTransformStream(head) ? head.writable : head;
        const writer = writable2.getWriter();
        d2._write = async function(chunk, encoding, callback) {
          try {
            await writer.ready;
            writer.write(chunk).catch(() => {
            });
            callback();
          } catch (err2) {
            callback(err2);
          }
        };
        d2._final = async function(callback) {
          try {
            await writer.ready;
            writer.close().catch(() => {
            });
            onfinish = callback;
          } catch (err2) {
            callback(err2);
          }
        };
      }
      const toRead = isTransformStream(tail) ? tail.readable : tail;
      eos(toRead, () => {
        if (onfinish) {
          const cb = onfinish;
          onfinish = null;
          cb();
        }
      });
    }
    if (readable) {
      if (isNodeStream(tail)) {
        tail.on("readable", function() {
          if (onreadable) {
            const cb = onreadable;
            onreadable = null;
            cb();
          }
        });
        tail.on("end", function() {
          d2.push(null);
        });
        d2._read = function() {
          while (true) {
            const buf = tail.read();
            if (buf === null) {
              onreadable = d2._read;
              return;
            }
            if (!d2.push(buf)) {
              return;
            }
          }
        };
      } else if (isWebStream(tail)) {
        const readable2 = isTransformStream(tail) ? tail.readable : tail;
        const reader = readable2.getReader();
        d2._read = async function() {
          while (true) {
            try {
              const { value, done } = await reader.read();
              if (!d2.push(value)) {
                return;
              }
              if (done) {
                d2.push(null);
                return;
              }
            } catch {
              return;
            }
          }
        };
      }
    }
    d2._destroy = function(err2, callback) {
      if (!err2 && onclose !== null) {
        err2 = new AbortError;
      }
      onreadable = null;
      ondrain = null;
      onfinish = null;
      if (onclose === null) {
        callback(err2);
      } else {
        onclose = callback;
        if (isNodeStream(tail)) {
          destroyer(tail, err2);
        }
      }
    };
    return d2;
  };
});

// node_modules/readable-stream/lib/internal/streams/operators.js
var require_operators = __commonJS((exports, module) => {
  var AbortController = globalThis.AbortController || require_browser().AbortController;
  var {
    codes: { ERR_INVALID_ARG_VALUE, ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS, ERR_OUT_OF_RANGE },
    AbortError
  } = require_errors();
  var { validateAbortSignal, validateInteger, validateObject } = require_validators();
  var kWeakHandler = require_primordials().Symbol("kWeak");
  var kResistStopPropagation = require_primordials().Symbol("kResistStopPropagation");
  var { finished } = require_end_of_stream();
  var staticCompose = require_compose();
  var { addAbortSignalNoValidate } = require_add_abort_signal();
  var { isWritable, isNodeStream } = require_utils();
  var { deprecate } = require_util();
  var {
    ArrayPrototypePush,
    Boolean: Boolean2,
    MathFloor,
    Number: Number2,
    NumberIsNaN,
    Promise: Promise2,
    PromiseReject,
    PromiseResolve,
    PromisePrototypeThen,
    Symbol: Symbol2
  } = require_primordials();
  var kEmpty = Symbol2("kEmpty");
  var kEof = Symbol2("kEof");
  function compose(stream, options) {
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    if (isNodeStream(stream) && !isWritable(stream)) {
      throw new ERR_INVALID_ARG_VALUE("stream", stream, "must be writable");
    }
    const composedStream = staticCompose(this, stream);
    if (options !== null && options !== undefined && options.signal) {
      addAbortSignalNoValidate(options.signal, composedStream);
    }
    return composedStream;
  }
  function map(fn, options) {
    if (typeof fn !== "function") {
      throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
    }
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    let concurrency = 1;
    if ((options === null || options === undefined ? undefined : options.concurrency) != null) {
      concurrency = MathFloor(options.concurrency);
    }
    let highWaterMark = concurrency - 1;
    if ((options === null || options === undefined ? undefined : options.highWaterMark) != null) {
      highWaterMark = MathFloor(options.highWaterMark);
    }
    validateInteger(concurrency, "options.concurrency", 1);
    validateInteger(highWaterMark, "options.highWaterMark", 0);
    highWaterMark += concurrency;
    return async function* map() {
      const signal = require_util().AbortSignalAny([options === null || options === undefined ? undefined : options.signal].filter(Boolean2));
      const stream = this;
      const queue = [];
      const signalOpt = {
        signal
      };
      let next;
      let resume;
      let done = false;
      let cnt = 0;
      function onCatch() {
        done = true;
        afterItemProcessed();
      }
      function afterItemProcessed() {
        cnt -= 1;
        maybeResume();
      }
      function maybeResume() {
        if (resume && !done && cnt < concurrency && queue.length < highWaterMark) {
          resume();
          resume = null;
        }
      }
      async function pump() {
        try {
          for await (let val of stream) {
            if (done) {
              return;
            }
            if (signal.aborted) {
              throw new AbortError;
            }
            try {
              val = fn(val, signalOpt);
              if (val === kEmpty) {
                continue;
              }
              val = PromiseResolve(val);
            } catch (err2) {
              val = PromiseReject(err2);
            }
            cnt += 1;
            PromisePrototypeThen(val, afterItemProcessed, onCatch);
            queue.push(val);
            if (next) {
              next();
              next = null;
            }
            if (!done && (queue.length >= highWaterMark || cnt >= concurrency)) {
              await new Promise2((resolve2) => {
                resume = resolve2;
              });
            }
          }
          queue.push(kEof);
        } catch (err2) {
          const val = PromiseReject(err2);
          PromisePrototypeThen(val, afterItemProcessed, onCatch);
          queue.push(val);
        } finally {
          done = true;
          if (next) {
            next();
            next = null;
          }
        }
      }
      pump();
      try {
        while (true) {
          while (queue.length > 0) {
            const val = await queue[0];
            if (val === kEof) {
              return;
            }
            if (signal.aborted) {
              throw new AbortError;
            }
            if (val !== kEmpty) {
              yield val;
            }
            queue.shift();
            maybeResume();
          }
          await new Promise2((resolve2) => {
            next = resolve2;
          });
        }
      } finally {
        done = true;
        if (resume) {
          resume();
          resume = null;
        }
      }
    }.call(this);
  }
  function asIndexedPairs(options = undefined) {
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    return async function* asIndexedPairs() {
      let index = 0;
      for await (const val of this) {
        var _options$signal;
        if (options !== null && options !== undefined && (_options$signal = options.signal) !== null && _options$signal !== undefined && _options$signal.aborted) {
          throw new AbortError({
            cause: options.signal.reason
          });
        }
        yield [index++, val];
      }
    }.call(this);
  }
  async function some(fn, options = undefined) {
    for await (const unused of filter.call(this, fn, options)) {
      return true;
    }
    return false;
  }
  async function every(fn, options = undefined) {
    if (typeof fn !== "function") {
      throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
    }
    return !await some.call(this, async (...args) => {
      return !await fn(...args);
    }, options);
  }
  async function find(fn, options) {
    for await (const result of filter.call(this, fn, options)) {
      return result;
    }
    return;
  }
  async function forEach(fn, options) {
    if (typeof fn !== "function") {
      throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
    }
    async function forEachFn(value, options2) {
      await fn(value, options2);
      return kEmpty;
    }
    for await (const unused of map.call(this, forEachFn, options))
      ;
  }
  function filter(fn, options) {
    if (typeof fn !== "function") {
      throw new ERR_INVALID_ARG_TYPE("fn", ["Function", "AsyncFunction"], fn);
    }
    async function filterFn(value, options2) {
      if (await fn(value, options2)) {
        return value;
      }
      return kEmpty;
    }
    return map.call(this, filterFn, options);
  }

  class ReduceAwareErrMissingArgs extends ERR_MISSING_ARGS {
    constructor() {
      super("reduce");
      this.message = "Reduce of an empty stream requires an initial value";
    }
  }
  async function reduce(reducer, initialValue, options) {
    var _options$signal2;
    if (typeof reducer !== "function") {
      throw new ERR_INVALID_ARG_TYPE("reducer", ["Function", "AsyncFunction"], reducer);
    }
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    let hasInitialValue = arguments.length > 1;
    if (options !== null && options !== undefined && (_options$signal2 = options.signal) !== null && _options$signal2 !== undefined && _options$signal2.aborted) {
      const err2 = new AbortError(undefined, {
        cause: options.signal.reason
      });
      this.once("error", () => {
      });
      await finished(this.destroy(err2));
      throw err2;
    }
    const ac = new AbortController;
    const signal = ac.signal;
    if (options !== null && options !== undefined && options.signal) {
      const opts = {
        once: true,
        [kWeakHandler]: this,
        [kResistStopPropagation]: true
      };
      options.signal.addEventListener("abort", () => ac.abort(), opts);
    }
    let gotAnyItemFromStream = false;
    try {
      for await (const value of this) {
        var _options$signal3;
        gotAnyItemFromStream = true;
        if (options !== null && options !== undefined && (_options$signal3 = options.signal) !== null && _options$signal3 !== undefined && _options$signal3.aborted) {
          throw new AbortError;
        }
        if (!hasInitialValue) {
          initialValue = value;
          hasInitialValue = true;
        } else {
          initialValue = await reducer(initialValue, value, {
            signal
          });
        }
      }
      if (!gotAnyItemFromStream && !hasInitialValue) {
        throw new ReduceAwareErrMissingArgs;
      }
    } finally {
      ac.abort();
    }
    return initialValue;
  }
  async function toArray(options) {
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    const result = [];
    for await (const val of this) {
      var _options$signal4;
      if (options !== null && options !== undefined && (_options$signal4 = options.signal) !== null && _options$signal4 !== undefined && _options$signal4.aborted) {
        throw new AbortError(undefined, {
          cause: options.signal.reason
        });
      }
      ArrayPrototypePush(result, val);
    }
    return result;
  }
  function flatMap(fn, options) {
    const values = map.call(this, fn, options);
    return async function* flatMap() {
      for await (const val of values) {
        yield* val;
      }
    }.call(this);
  }
  function toIntegerOrInfinity(number) {
    number = Number2(number);
    if (NumberIsNaN(number)) {
      return 0;
    }
    if (number < 0) {
      throw new ERR_OUT_OF_RANGE("number", ">= 0", number);
    }
    return number;
  }
  function drop(number, options = undefined) {
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    number = toIntegerOrInfinity(number);
    return async function* drop() {
      var _options$signal5;
      if (options !== null && options !== undefined && (_options$signal5 = options.signal) !== null && _options$signal5 !== undefined && _options$signal5.aborted) {
        throw new AbortError;
      }
      for await (const val of this) {
        var _options$signal6;
        if (options !== null && options !== undefined && (_options$signal6 = options.signal) !== null && _options$signal6 !== undefined && _options$signal6.aborted) {
          throw new AbortError;
        }
        if (number-- <= 0) {
          yield val;
        }
      }
    }.call(this);
  }
  function take(number, options = undefined) {
    if (options != null) {
      validateObject(options, "options");
    }
    if ((options === null || options === undefined ? undefined : options.signal) != null) {
      validateAbortSignal(options.signal, "options.signal");
    }
    number = toIntegerOrInfinity(number);
    return async function* take() {
      var _options$signal7;
      if (options !== null && options !== undefined && (_options$signal7 = options.signal) !== null && _options$signal7 !== undefined && _options$signal7.aborted) {
        throw new AbortError;
      }
      for await (const val of this) {
        var _options$signal8;
        if (options !== null && options !== undefined && (_options$signal8 = options.signal) !== null && _options$signal8 !== undefined && _options$signal8.aborted) {
          throw new AbortError;
        }
        if (number-- > 0) {
          yield val;
        }
        if (number <= 0) {
          return;
        }
      }
    }.call(this);
  }
  exports.streamReturningOperators = {
    asIndexedPairs: deprecate(asIndexedPairs, "readable.asIndexedPairs will be removed in a future version."),
    drop,
    filter,
    flatMap,
    map,
    take,
    compose
  };
  exports.promiseReturningOperators = {
    every,
    forEach,
    reduce,
    toArray,
    some,
    find
  };
});

// node_modules/readable-stream/lib/stream/promises.js
var require_promises = __commonJS((exports, module) => {
  var { ArrayPrototypePop, Promise: Promise2 } = require_primordials();
  var { isIterable, isNodeStream, isWebStream } = require_utils();
  var { pipelineImpl: pl } = require_pipeline();
  var { finished } = require_end_of_stream();
  require_stream();
  function pipeline(...streams) {
    return new Promise2((resolve2, reject) => {
      let signal;
      let end;
      const lastArg = streams[streams.length - 1];
      if (lastArg && typeof lastArg === "object" && !isNodeStream(lastArg) && !isIterable(lastArg) && !isWebStream(lastArg)) {
        const options = ArrayPrototypePop(streams);
        signal = options.signal;
        end = options.end;
      }
      pl(streams, (err2, value) => {
        if (err2) {
          reject(err2);
        } else {
          resolve2(value);
        }
      }, {
        signal,
        end
      });
    });
  }
  module.exports = {
    finished,
    pipeline
  };
});

// node_modules/readable-stream/lib/stream.js
var require_stream = __commonJS((exports, module) => {
  var { Buffer: Buffer2 } = (init_buffer(), __toCommonJS(exports_buffer));
  var { ObjectDefineProperty, ObjectKeys, ReflectApply } = require_primordials();
  var {
    promisify: { custom: customPromisify }
  } = require_util();
  var { streamReturningOperators, promiseReturningOperators } = require_operators();
  var {
    codes: { ERR_ILLEGAL_CONSTRUCTOR }
  } = require_errors();
  var compose = require_compose();
  var { setDefaultHighWaterMark, getDefaultHighWaterMark } = require_state();
  var { pipeline } = require_pipeline();
  var { destroyer } = require_destroy();
  var eos = require_end_of_stream();
  var promises = require_promises();
  var utils = require_utils();
  var Stream = module.exports = require_legacy().Stream;
  Stream.isDestroyed = utils.isDestroyed;
  Stream.isDisturbed = utils.isDisturbed;
  Stream.isErrored = utils.isErrored;
  Stream.isReadable = utils.isReadable;
  Stream.isWritable = utils.isWritable;
  Stream.Readable = require_readable();
  for (const key of ObjectKeys(streamReturningOperators)) {
    let fn = function(...args) {
      if (new.target) {
        throw ERR_ILLEGAL_CONSTRUCTOR();
      }
      return Stream.Readable.from(ReflectApply(op, this, args));
    };
    const op = streamReturningOperators[key];
    ObjectDefineProperty(fn, "name", {
      __proto__: null,
      value: op.name
    });
    ObjectDefineProperty(fn, "length", {
      __proto__: null,
      value: op.length
    });
    ObjectDefineProperty(Stream.Readable.prototype, key, {
      __proto__: null,
      value: fn,
      enumerable: false,
      configurable: true,
      writable: true
    });
  }
  for (const key of ObjectKeys(promiseReturningOperators)) {
    let fn = function(...args) {
      if (new.target) {
        throw ERR_ILLEGAL_CONSTRUCTOR();
      }
      return ReflectApply(op, this, args);
    };
    const op = promiseReturningOperators[key];
    ObjectDefineProperty(fn, "name", {
      __proto__: null,
      value: op.name
    });
    ObjectDefineProperty(fn, "length", {
      __proto__: null,
      value: op.length
    });
    ObjectDefineProperty(Stream.Readable.prototype, key, {
      __proto__: null,
      value: fn,
      enumerable: false,
      configurable: true,
      writable: true
    });
  }
  Stream.Writable = require_writable();
  Stream.Duplex = require_duplex();
  Stream.Transform = require_transform();
  Stream.PassThrough = require_passthrough();
  Stream.pipeline = pipeline;
  var { addAbortSignal } = require_add_abort_signal();
  Stream.addAbortSignal = addAbortSignal;
  Stream.finished = eos;
  Stream.destroy = destroyer;
  Stream.compose = compose;
  Stream.setDefaultHighWaterMark = setDefaultHighWaterMark;
  Stream.getDefaultHighWaterMark = getDefaultHighWaterMark;
  ObjectDefineProperty(Stream, "promises", {
    __proto__: null,
    configurable: true,
    enumerable: true,
    get() {
      return promises;
    }
  });
  ObjectDefineProperty(pipeline, customPromisify, {
    __proto__: null,
    enumerable: true,
    get() {
      return promises.pipeline;
    }
  });
  ObjectDefineProperty(eos, customPromisify, {
    __proto__: null,
    enumerable: true,
    get() {
      return promises.finished;
    }
  });
  Stream.Stream = Stream;
  Stream._isUint8Array = function isUint8Array(value) {
    return value instanceof Uint8Array;
  };
  Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  };
});

// node_modules/readable-stream/lib/ours/browser.js
var require_browser3 = __commonJS((exports, module) => {
  var CustomStream = require_stream();
  var promises = require_promises();
  var originalDestroy = CustomStream.Readable.destroy;
  module.exports = CustomStream.Readable;
  module.exports._uint8ArrayToBuffer = CustomStream._uint8ArrayToBuffer;
  module.exports._isUint8Array = CustomStream._isUint8Array;
  module.exports.isDisturbed = CustomStream.isDisturbed;
  module.exports.isErrored = CustomStream.isErrored;
  module.exports.isReadable = CustomStream.isReadable;
  module.exports.Readable = CustomStream.Readable;
  module.exports.Writable = CustomStream.Writable;
  module.exports.Duplex = CustomStream.Duplex;
  module.exports.Transform = CustomStream.Transform;
  module.exports.PassThrough = CustomStream.PassThrough;
  module.exports.addAbortSignal = CustomStream.addAbortSignal;
  module.exports.finished = CustomStream.finished;
  module.exports.destroy = CustomStream.destroy;
  module.exports.destroy = originalDestroy;
  module.exports.pipeline = CustomStream.pipeline;
  module.exports.compose = CustomStream.compose;
  Object.defineProperty(CustomStream, "promises", {
    configurable: true,
    enumerable: true,
    get() {
      return promises;
    }
  });
  module.exports.Stream = CustomStream.Stream;
  module.exports.default = module.exports;
});

// node_modules/shell-quote/index.js
var $quote = require_quote();
var $parse = require_parse();

// src/process.ts
var history = [];
var historyIndex = 0;
function resolveRelativePath(path, cwd) {
  const url = new URL(path, "https://0.0.0.0" + cwd);
  return url.pathname;
}

class Process {
  fs;
  args;
  cwd = "/";
  env = {};
  constructor(fs, ...args) {
    this.fs = fs;
    this.args = args;
  }
  print(data) {
  }
  println(data) {
    this.print(data ? data + `
` : `
`);
  }
  handleInput = (data) => {
    for (const handler of this.onInput) {
      handler[0](data);
    }
    this.onInput = this.onInput.filter((handler) => !handler[1]);
  };
  onInput = [];
  async readKey(show = true, surpressSpecial = true) {
    let char = "";
    do {
      char = await new Promise((resolve) => this.onInput.push([resolve, true]));
      if (char.length > 1 && surpressSpecial)
        char = "";
    } while (char == "");
    if (show)
      this.print(char);
    return char;
  }
  async readLine() {
    const input = document.getElementById("input");
    let result = "";
    console.log(history, historyIndex);
    while (true) {
      const char = await this.readKey(false, false);
      console.log(char);
      if (char == "\b")
        result = result.slice(0, Math.max(result.length - 1, 0));
      else if (char == `
`) {
        input.innerText = "";
        this.print(result + `
`);
        if (result != `
` && result != "") {
          if (historyIndex != history.length)
            history.splice(historyIndex, 1);
          history.push(result);
          historyIndex = history.length;
        }
        return result;
      } else if (char == "ArrowUp") {
        if (historyIndex > 0) {
          historyIndex--;
        }
        result = history[historyIndex] || "";
      } else if (char == "ArrowDown") {
        if (historyIndex < history.length) {
          historyIndex++;
        }
        result = history[historyIndex] || "";
      } else if (char.length == 1)
        result += char;
      input.innerText = result;
    }
  }
  async runSubprocessAndMapInputs(process, cwd, env, print = this.print) {
    process.cwd = resolveRelativePath(cwd || ".", this.cwd);
    process.env = { ...this.env, ...env };
    process.print = print;
    this.onInput.push([process.handleInput, false]);
    await process.main();
    this.onInput = this.onInput.filter((handler) => handler[0] !== process.handleInput);
  }
}

// node_modules/@nyariv/sandboxjs/dist/Sandbox.js
function parseHexToInt(e) {
  return !e.match(/[^a-f0-9]/i) ? parseInt(e, 16) : NaN;
}
function validateAndParseHex(e, t, n) {
  const r = parseHexToInt(e);
  if (Number.isNaN(r) || n !== undefined && n !== e.length)
    throw new SyntaxError(t + ": " + e);
  return r;
}
function parseHexadecimalCode(e) {
  const t = validateAndParseHex(e, "Malformed Hexadecimal", 2);
  return String.fromCharCode(t);
}
function parseUnicodeCode(e, t) {
  const n = validateAndParseHex(e, "Malformed Unicode", 4);
  if (t !== undefined) {
    const e2 = validateAndParseHex(t, "Malformed Unicode", 4);
    return String.fromCharCode(n, e2);
  }
  return String.fromCharCode(n);
}
function isCurlyBraced(e) {
  return e.charAt(0) === "{" && e.charAt(e.length - 1) === "}";
}
function parseUnicodeCodePointCode(e) {
  if (!isCurlyBraced(e))
    throw new SyntaxError("Malformed Unicode: +" + e);
  const t = validateAndParseHex(e.slice(1, -1), "Malformed Unicode");
  try {
    return String.fromCodePoint(t);
  } catch (e2) {
    throw e2 instanceof RangeError ? new SyntaxError("Code Point Limit:" + t) : e2;
  }
}
var singleCharacterEscapes = new Map([["b", "\b"], ["f", "\f"], ["n", `
`], ["r", "\r"], ["t", "\t"], ["v", "\v"], ["0", "\x00"]]);
function parseSingleCharacterCode(e) {
  return singleCharacterEscapes.get(e) || e;
}
var escapeMatch = /\\(?:(\\)|x([\s\S]{0,2})|u(\{[^}]*\}?)|u([\s\S]{4})\\u([^{][\s\S]{0,3})|u([\s\S]{0,4})|([0-3]?[0-7]{1,2})|([\s\S])|$)/g;
function unraw(e) {
  return e.replace(escapeMatch, function(e2, t, n, r, s, i, o, a, c) {
    if (t !== undefined)
      return "\\";
    if (n !== undefined)
      return parseHexadecimalCode(n);
    if (r !== undefined)
      return parseUnicodeCodePointCode(r);
    if (s !== undefined)
      return parseUnicodeCode(s, i);
    if (o !== undefined)
      return parseUnicodeCode(o);
    if (a === "0")
      return "\x00";
    if (a !== undefined)
      throw new SyntaxError("Octal Deprecation: " + a);
    if (c !== undefined)
      return parseSingleCharacterCode(c);
    throw new SyntaxError("End of string");
  });
}
function createLisp(e) {
  return [e.op, e.a, e.b];
}
var lispTypes = new Map;

class ParseError extends Error {
  constructor(e, t) {
    super(e + ": " + t.substring(0, 40)), this.code = t;
  }
}
var inlineIfElse = /^:/;
var elseIf = /^else(?![\w\$])/;
var ifElse = /^if(?![\w\$])/;
var space = /^\s/;
var expectTypes = { splitter: { types: { opHigh: /^(\/|\*\*|\*(?!\*)|\%)(?!\=)/, op: /^(\+(?!(\+))|\-(?!(\-)))(?!\=)/, comparitor: /^(<=|>=|<(?!<)|>(?!>)|!==|!=(?!\=)|===|==)/, boolOp: /^(&&|\|\||instanceof(?![\w\$])|in(?![\w\$]))/, bitwise: /^(&(?!&)|\|(?!\|)|\^|<<|>>(?!>)|>>>)(?!\=)/ }, next: ["modifier", "value", "prop", "incrementerBefore"] }, inlineIf: { types: { inlineIf: /^\?(?!\.(?!\d))/ }, next: ["expEnd"] }, assignment: { types: { assignModify: /^(\-=|\+=|\/=|\*\*=|\*=|%=|\^=|\&=|\|=|>>>=|>>=|<<=)/, assign: /^(=)(?!=)/ }, next: ["modifier", "value", "prop", "incrementerBefore"] }, incrementerBefore: { types: { incrementerBefore: /^(\+\+|\-\-)/ }, next: ["prop"] }, expEdge: { types: { call: /^(\?\.)?[\(]/, incrementerAfter: /^(\+\+|\-\-)/ }, next: ["splitter", "expEdge", "dot", "inlineIf", "expEnd"] }, modifier: { types: { not: /^!/, inverse: /^~/, negative: /^\-(?!\-)/, positive: /^\+(?!\+)/, typeof: /^typeof(?![\w\$])/, delete: /^delete(?![\w\$])/ }, next: ["modifier", "value", "prop", "incrementerBefore"] }, dot: { types: { arrayProp: /^(\?\.)?\[/, dot: /^(\?)?\.(?=\s*[a-zA-Z\$\_])/ }, next: ["splitter", "assignment", "expEdge", "dot", "inlineIf", "expEnd"] }, prop: { types: { prop: /^[a-zA-Z\$\_][a-zA-Z\d\$\_]*/ }, next: ["splitter", "assignment", "expEdge", "dot", "inlineIf", "expEnd"] }, value: { types: { createObject: /^\{/, createArray: /^\[/, number: /^(0x[\da-f]+(_[\da-f]+)*|(\d+(_\d+)*(\.\d+(_\d+)*)?|\.\d+(_\d+)*))(e[\+\-]?\d+(_\d+)*)?(n)?(?!\d)/i, string: /^"(\d+)"/, literal: /^`(\d+)`/, regex: /^\/(\d+)\/r(?![\w\$])/, boolean: /^(true|false)(?![\w\$])/, null: /^null(?![\w\$])/, und: /^undefined(?![\w\$])/, arrowFunctionSingle: /^(async\s+)?([a-zA-Z\$_][a-zA-Z\d\$_]*)\s*=>\s*({)?/, arrowFunction: /^(async\s*)?\(\s*((\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*(\s*,\s*(\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*)*)?\s*\)\s*=>\s*({)?/, inlineFunction: /^(async\s+)?function(\s*[a-zA-Z\$_][a-zA-Z\d\$_]*)?\s*\(\s*((\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*(\s*,\s*(\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*)*)?\s*\)\s*{/, group: /^\(/, NaN: /^NaN(?![\w\$])/, Infinity: /^Infinity(?![\w\$])/, void: /^void(?![\w\$])\s*/, await: /^await(?![\w\$])\s*/, new: /^new(?![\w\$])\s*/ }, next: ["splitter", "expEdge", "dot", "inlineIf", "expEnd"] }, initialize: { types: { initialize: /^(var|let|const)\s+([a-zA-Z\$_][a-zA-Z\d\$_]*)\s*(=)?/, return: /^return(?![\w\$])/, throw: /^throw(?![\w\$])\s*/ }, next: ["modifier", "value", "prop", "incrementerBefore", "expEnd"] }, spreadObject: { types: { spreadObject: /^\.\.\./ }, next: ["value", "prop"] }, spreadArray: { types: { spreadArray: /^\.\.\./ }, next: ["value", "prop"] }, expEnd: { types: {}, next: [] }, expFunction: { types: { function: /^(async\s+)?function(\s*[a-zA-Z\$_][a-zA-Z\d\$_]*)\s*\(\s*((\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*(\s*,\s*(\.\.\.)?\s*[a-zA-Z\$_][a-zA-Z\d\$_]*)*)?\s*\)\s*{/ }, next: ["expEdge", "expEnd"] }, expSingle: { types: { for: /^(([a-zA-Z\$\_][\w\$]*)\s*:)?\s*for\s*\(/, do: /^(([a-zA-Z\$\_][\w\$]*)\s*:)?\s*do(?![\w\$])\s*(\{)?/, while: /^(([a-zA-Z\$\_][\w\$]*)\s*:)?\s*while\s*\(/, loopAction: /^(break|continue)(?![\w\$])\s*([a-zA-Z\$\_][\w\$]*)?/, if: /^((([a-zA-Z\$\_][\w\$]*)\s*:)?\s*)if\s*\(/, try: /^try\s*{/, block: /^{/, switch: /^(([a-zA-Z\$\_][\w\$]*)\s*:)?\s*switch\s*\(/ }, next: ["expEnd"] } };
var closings = { "(": ")", "[": "]", "{": "}", "'": "'", '"': '"', "`": "`" };
function testMultiple(e, t) {
  let n;
  for (let r = 0;r < t.length; r++) {
    if (n = t[r].exec(e), n)
      break;
  }
  return n;
}

class CodeString {
  constructor(e) {
    this.ref = { str: "" }, e instanceof CodeString ? (this.ref = e.ref, this.start = e.start, this.end = e.end) : (this.ref.str = e, this.start = 0, this.end = e.length);
  }
  substring(e, t) {
    if (!this.length)
      return this;
    (e = this.start + e) < 0 && (e = 0), e > this.end && (e = this.end), (t = t === undefined ? this.end : this.start + t) < 0 && (t = 0), t > this.end && (t = this.end);
    const n = new CodeString(this);
    return n.start = e, n.end = t, n;
  }
  get length() {
    const e = this.end - this.start;
    return e < 0 ? 0 : e;
  }
  char(e) {
    if (this.start !== this.end)
      return this.ref.str[this.start + e];
  }
  toString() {
    return this.ref.str.substring(this.start, this.end);
  }
  trimStart() {
    const e = /^\s+/.exec(this.toString()), t = new CodeString(this);
    return e && (t.start += e[0].length), t;
  }
  slice(e, t) {
    return e < 0 && (e = this.end - this.start + e), e < 0 && (e = 0), t === undefined && (t = this.end - this.start), t < 0 && (t = this.end - this.start + t), t < 0 && (t = 0), this.substring(e, t);
  }
  trim() {
    const e = this.trimStart(), t = /\s+$/.exec(e.toString());
    return t && (e.end -= t[0].length), e;
  }
  valueOf() {
    return this.toString();
  }
}
var emptyString = new CodeString("");
var okFirstChars = /^[\+\-~ !]/;
var aNumber = expectTypes.value.types.number;
var wordReg = /^((if|for|else|while|do|function)(?![\w\$])|[\w\$]+)/;
var semiColon = /^;/;
var insertedSemicolons = new WeakMap;
var quoteCache = new WeakMap;
function restOfExp(e, t, n, r, s, i, o = {}) {
  if (!t.length)
    return t;
  o.words = o.words || [];
  let a = true;
  const c = (n = n || []).includes(semiColon);
  c && (n = n.filter((e2) => e2 !== semiColon));
  const p = insertedSemicolons.get(t.ref) || [], l = quoteCache.get(t.ref) || new Map;
  if (quoteCache.set(t.ref, l), r && l.has(t.start - 1))
    return t.substring(0, l.get(t.start - 1) - t.start);
  let d, u = false, f = false, h = "", g = false, x = false;
  for (d = 0;d < t.length && !f; d++) {
    let y = t.char(d);
    if (r === '"' || r === "'" || r === "`") {
      if (r !== "`" || y !== "$" || t.char(d + 1) !== "{" || u) {
        if (y === r && !u)
          return t.substring(0, d);
      } else {
        d += restOfExp(e, t.substring(d + 2), [], "{").length + 2;
      }
      u = !u && y === "\\";
    } else if (closings[y]) {
      if (!x && p[d + t.start]) {
        if (x = true, c)
          break;
        d--, h = ";";
        continue;
      }
      if (g && y === "{" && (g = false), y === s) {
        f = true;
        break;
      }
      {
        let n2 = restOfExp(e, t.substring(d + 1), [], y);
        if (l.set(n2.start - 1, n2.end), d += n2.length + 1, a = false, i) {
          let e2;
          (e2 = testMultiple(t.substring(d).toString(), i)) && (o.regRes = e2, f = true);
        }
      }
    } else if (r) {
      if (y === closings[r])
        return t.substring(0, d);
    } else {
      let e2, r2, s2 = t.substring(d).toString();
      if (i) {
        let e3;
        if (e3 = testMultiple(s2, i)) {
          o.regRes = e3, d++, f = true;
          break;
        }
      }
      if (r2 = aNumber.exec(s2))
        d += r2[0].length - 1, s2 = t.substring(d).toString();
      else if (h != y) {
        let r3;
        if (y === ";" || p[d + t.start] && !a && !x) {
          if (c)
            r3 = [";"];
          else if (p[d + t.start]) {
            x = true, d--, h = ";";
            continue;
          }
          y = s2 = ";";
        } else
          x = false;
        r3 || (r3 = testMultiple(s2, n)), r3 && (f = true), !f && (e2 = wordReg.exec(s2)) && (g = true, e2[0].length > 1 && (o.words.push(e2[1]), o.lastAnyWord = e2[1], e2[2] && (o.lastWord = e2[2])), e2[0].length > 2 && (d += e2[0].length - 2));
      }
      if (a && (okFirstChars.test(s2) ? f = false : a = false), f)
        break;
    }
    h = y;
  }
  if (r)
    throw new SyntaxError("Unclosed '" + r + "'");
  return o && (o.oneliner = g), t.substring(0, d);
}
restOfExp.next = ["splitter", "expEnd", "inlineIf"];
var startingExecpted = ["initialize", "expSingle", "expFunction", "value", "modifier", "prop", "incrementerBefore", "expEnd"];
var setLispType = (e, t) => {
  e.forEach((e2) => {
    lispTypes.set(e2, t);
  });
};
var closingsCreate = { createArray: /^\]/, createObject: /^\}/, group: /^\)/, arrayProp: /^\]/, call: /^\)/ };
var typesCreate = { createArray: 12, createObject: 22, group: 23, arrayProp: 19, call: 5, prop: 1, "?prop": 20, "?call": 21 };
setLispType(["createArray", "createObject", "group", "arrayProp", "call"], (e, t, n, r, s, i) => {
  let o = emptyString, a = [], c = false, p = r[0].length;
  const l = p;
  for (;p < n.length && !c; )
    o = restOfExp(e, n.substring(p), [closingsCreate[t], /^,/]), p += o.length, o.trim().length && a.push(o), n.char(p) !== "," ? c = true : p++;
  const d = ["value", "modifier", "prop", "incrementerBefore", "expEnd"];
  let u, f;
  switch (t) {
    case "group":
    case "arrayProp":
      u = lispifyExpr(e, n.substring(l, p));
      break;
    case "call":
    case "createArray":
      u = a.map((t2) => lispify(e, t2, [...d, "spreadArray"]));
      break;
    case "createObject":
      u = a.map((t2) => {
        let n2;
        t2 = t2.trimStart();
        let r2 = "";
        if (f = expectTypes.expFunction.types.function.exec("function " + t2), f)
          r2 = f[2].trimStart(), n2 = lispify(e, new CodeString("function " + t2.toString().replace(r2, "")));
        else {
          let s2 = restOfExp(e, t2, [/^:/]);
          r2 = lispify(e, s2, [...d, "spreadObject"]), r2[0] === 1 && (r2 = r2[2]), n2 = lispify(e, t2.substring(s2.length + 1));
        }
        return createLisp({ op: 6, a: r2, b: n2 });
      });
  }
  let h = t === "arrayProp" ? r[1] ? 20 : 1 : t === "call" ? r[1] ? 21 : 5 : typesCreate[t];
  i.lispTree = lispify(e, n.substring(p + 1), expectTypes[s].next, createLisp({ op: h, a: i.lispTree, b: u }));
});
var modifierTypes = { inverse: 64, not: 24, positive: 59, negative: 58, typeof: 60, delete: 61 };
setLispType(["inverse", "not", "negative", "positive", "typeof", "delete"], (e, t, n, r, s, i) => {
  let o = restOfExp(e, n.substring(r[0].length), [/^([^\s\.\?\w\$]|\?[^\.])/]);
  i.lispTree = lispify(e, n.substring(o.length + r[0].length), restOfExp.next, createLisp({ op: modifierTypes[t], a: i.lispTree, b: lispify(e, o, expectTypes[s].next) }));
});
var incrementTypes = { "++$": 25, "--$": 27, "$++": 26, "$--": 28 };
setLispType(["incrementerBefore"], (e, t, n, r, s, i) => {
  let o = restOfExp(e, n.substring(2), [/^[^\s\.\w\$]/]);
  i.lispTree = lispify(e, n.substring(o.length + 2), restOfExp.next, createLisp({ op: incrementTypes[r[0] + "$"], a: lispify(e, o, expectTypes[s].next), b: 0 }));
}), setLispType(["incrementerAfter"], (e, t, n, r, s, i) => {
  i.lispTree = lispify(e, n.substring(r[0].length), expectTypes[s].next, createLisp({ op: incrementTypes["$" + r[0]], a: i.lispTree, b: 0 }));
});
var adderTypes = { "&&": 29, "||": 30, instanceof: 62, in: 63, "=": 9, "-=": 65, "+=": 66, "/=": 67, "**=": 68, "*=": 69, "%=": 70, "^=": 71, "&=": 72, "|=": 73, ">>>=": 74, "<<=": 76, ">>=": 75 };
setLispType(["assign", "assignModify", "boolOp"], (e, t, n, r, s, i) => {
  i.lispTree = createLisp({ op: adderTypes[r[0]], a: i.lispTree, b: lispify(e, n.substring(r[0].length), expectTypes[s].next) });
});
var opTypes = { "&": 77, "|": 78, "^": 79, "<<": 80, ">>": 81, ">>>": 82, "<=": 54, ">=": 55, "<": 56, ">": 57, "!==": 31, "!=": 53, "===": 32, "==": 52, "+": 33, "-": 47, "/": 48, "**": 49, "*": 50, "%": 51 };
function extractIfElse(e, t) {
  let n, r, s = 0, i = t.substring(0, 0), o = emptyString, a = true, c = {};
  for (;(i = restOfExp(e, t.substring(i.end - t.start), [elseIf, ifElse, semiColon], undefined, undefined, undefined, c)).length || a; ) {
    a = false;
    const p = t.substring(i.end - t.start).toString();
    if (p.startsWith("if"))
      i.end++, s++;
    else if (p.startsWith("else"))
      n = t.substring(0, i.end - t.start), i.end++, s--, s || i.end--;
    else {
      if (!(r = /^;?\s*else(?![\w\$])/.exec(p))) {
        n = o.length ? n : t.substring(0, i.end - t.start);
        break;
      }
      n = t.substring(0, i.end - t.start), i.end += r[0].length - 1, s--, s || (i.end -= r[0].length - 1);
    }
    if (!s) {
      o = extractIfElse(e, t.substring(i.end - t.start + /^;?\s*else(?![\w\$])/.exec(p)?.[0].length)).all;
      break;
    }
    c = {};
  }
  return n = n || t.substring(0, i.end - t.start), { all: t.substring(0, Math.max(n.end, o.end) - t.start), true: n, false: o };
}
setLispType(["opHigh", "op", "comparitor", "bitwise"], (e, t, n, r, s, i) => {
  const o = [expectTypes.inlineIf.types.inlineIf, inlineIfElse];
  switch (t) {
    case "opHigh":
      o.push(expectTypes.splitter.types.opHigh);
    case "op":
      o.push(expectTypes.splitter.types.op);
    case "comparitor":
      o.push(expectTypes.splitter.types.comparitor);
    case "bitwise":
      o.push(expectTypes.splitter.types.bitwise), o.push(expectTypes.splitter.types.boolOp);
  }
  let a = restOfExp(e, n.substring(r[0].length), o);
  i.lispTree = lispify(e, n.substring(a.length + r[0].length), restOfExp.next, createLisp({ op: opTypes[r[0]], a: i.lispTree, b: lispify(e, a, expectTypes[s].next) }));
}), setLispType(["inlineIf"], (e, t, n, r, s, i) => {
  let o = false, a = n.substring(0, 0), c = 1;
  for (;!o && a.length < n.length; )
    a.end = restOfExp(e, n.substring(a.length + 1), [expectTypes.inlineIf.types.inlineIf, inlineIfElse]).end, n.char(a.length) === "?" ? c++ : c--, c || (o = true);
  a.start = n.start + 1, i.lispTree = createLisp({ op: 15, a: i.lispTree, b: createLisp({ op: 16, a: lispifyExpr(e, a), b: lispifyExpr(e, n.substring(r[0].length + a.length + 1)) }) });
}), setLispType(["if"], (e, t, n, r, s, i) => {
  let o = restOfExp(e, n.substring(r[0].length), [], "(");
  const a = extractIfElse(e, n.substring(r[1].length));
  /^\s*\{/.exec(n.substring(r[0].length + o.length + 1).toString());
  const c = r[0].length - r[1].length + o.length + 1;
  let p = a.true.substring(c), l = a.false;
  o = o.trim(), p = p.trim(), l = l.trim(), p.char(0) === "{" && (p = p.slice(1, -1)), l.char(0) === "{" && (l = l.slice(1, -1)), i.lispTree = createLisp({ op: 13, a: lispifyExpr(e, o), b: createLisp({ op: 14, a: lispifyBlock(p, e), b: lispifyBlock(l, e) }) });
}), setLispType(["switch"], (e, t, n, r, s, i) => {
  const o = restOfExp(e, n.substring(r[0].length), [], "(");
  let a = n.toString().indexOf("{", r[0].length + o.length + 1);
  if (a === -1)
    throw new SyntaxError("Invalid switch");
  let c, p = insertSemicolons(e, restOfExp(e, n.substring(a + 1), [], "{"));
  const l = /^\s*(case\s|default)\s*/;
  let d = [], u = false;
  for (;c = l.exec(p.toString()); ) {
    if (c[1] === "default") {
      if (u)
        throw new SyntaxError("Only one default switch case allowed");
      u = true;
    }
    let t2 = restOfExp(e, p.substring(c[0].length), [/^:/]), n2 = emptyString, r2 = a = c[0].length + t2.length + 1, s2 = /^\s*\{/.exec(p.substring(r2).toString()), i2 = [];
    if (s2)
      r2 += s2[0].length, n2 = restOfExp(e, p.substring(r2), [], "{"), r2 += n2.length + 1, i2 = lispifyBlock(n2, e);
    else {
      let t3 = restOfExp(e, p.substring(r2), [l]);
      if (t3.trim().length) {
        for (;(n2 = restOfExp(e, p.substring(r2), [semiColon])).length && (r2 += n2.length + (p.char(r2 + n2.length) === ";" ? 1 : 0), !l.test(p.substring(r2).toString())); )
          ;
        i2 = lispifyBlock(p.substring(a, n2.end - p.start), e);
      } else
        i2 = [], r2 += t3.length;
    }
    p = p.substring(r2), d.push(createLisp({ op: 41, a: c[1] === "default" ? undefined : lispifyExpr(e, t2), b: i2 }));
  }
  i.lispTree = createLisp({ op: 40, a: lispifyExpr(e, o), b: d });
}), setLispType(["dot", "prop"], (e, t, n, r, s, i) => {
  let o = r[0], a = r[0].length, c = "prop";
  if (t === "dot") {
    r[1] && (c = "?prop");
    let e2 = n.substring(r[0].length).toString().match(expectTypes.prop.types.prop);
    if (!e2 || !e2.length)
      throw new SyntaxError("Hanging  dot");
    o = e2[0], a = o.length + r[0].length;
  }
  i.lispTree = lispify(e, n.substring(a), expectTypes[s].next, createLisp({ op: typesCreate[c], a: i.lispTree, b: o }));
}), setLispType(["spreadArray", "spreadObject"], (e, t, n, r, s, i) => {
  i.lispTree = createLisp({ op: t === "spreadArray" ? 18 : 17, a: 0, b: lispify(e, n.substring(r[0].length), expectTypes[s].next) });
}), setLispType(["return", "throw"], (e, t, n, r, s, i) => {
  i.lispTree = createLisp({ op: t === "return" ? 8 : 46, a: 0, b: lispifyExpr(e, n.substring(r[0].length)) });
}), setLispType(["number", "boolean", "null", "und", "NaN", "Infinity"], (e, t, n, r, s, i) => {
  i.lispTree = lispify(e, n.substring(r[0].length), expectTypes[s].next, createLisp({ op: t === "number" ? r[10] ? 83 : 7 : 35, a: 0, b: r[10] ? r[1] : r[0] }));
}), setLispType(["string", "literal", "regex"], (e, t, n, r, s, i) => {
  i.lispTree = lispify(e, n.substring(r[0].length), expectTypes[s].next, createLisp({ op: t === "string" ? 2 : t === "literal" ? 84 : 85, a: 0, b: r[1] }));
}), setLispType(["initialize"], (e, t, n, r, s, i) => {
  const o = r[1] === "var" ? 34 : r[1] === "let" ? 3 : 4;
  r[3] ? i.lispTree = createLisp({ op: o, a: r[2], b: lispify(e, n.substring(r[0].length), expectTypes[s].next) }) : i.lispTree = lispify(e, n.substring(r[0].length), expectTypes[s].next, createLisp({ op: o, a: r[2], b: 0 }));
}), setLispType(["function", "inlineFunction", "arrowFunction", "arrowFunctionSingle"], (e, t, n, r, s, i) => {
  const o = t !== "function" && t !== "inlineFunction", a = o && !r[r.length - 1], c = o ? 2 : 3, p = r[1] ? 88 : 0, l = r[c] ? r[c].replace(/\s+/g, "").split(/,/g) : [];
  o || l.unshift((r[2] || "").trimStart());
  let d = false;
  l.forEach((e2) => {
    if (d)
      throw new SyntaxError("Rest parameter must be last formal parameter");
    e2.startsWith("...") && (d = true);
  }), l.unshift(p);
  const u = restOfExp(e, n.substring(r[0].length), a ? [/^[,\)\}\]]/, semiColon] : [/^}/]), f = a ? "return " + u : u.toString();
  i.lispTree = lispify(e, n.substring(r[0].length + f.length + 1), expectTypes[s].next, createLisp({ op: o ? 11 : t === "function" ? 37 : 10, a: l, b: e.eager ? lispifyFunction(new CodeString(f), e) : f }));
});
var iteratorRegex = /^((let|var|const)\s+)?\s*([a-zA-Z\$_][a-zA-Z\d\$_]*)\s+(in|of)(?![\w\$])/;
setLispType(["for", "do", "while"], (e, t, n, r, s, i) => {
  let o, a, c, p = 0, l = 88, d = [], u = 0, f = 88, h = 88;
  switch (t) {
    case "while":
      p = n.toString().indexOf("(") + 1;
      let t2 = restOfExp(e, n.substring(p), [], "(");
      a = lispifyReturnExpr(e, t2), c = restOfExp(e, n.substring(p + t2.length + 1)).trim(), c[0] === "{" && (c = c.slice(1, -1));
      break;
    case "for":
      p = n.toString().indexOf("(") + 1;
      let s2, i2 = [], g2 = emptyString;
      for (let t3 = 0;t3 < 3 && (g2 = restOfExp(e, n.substring(p), [/^[;\)]/]), i2.push(g2.trim()), p += g2.length + 1, n.char(p - 1) !== ")"); t3++)
        ;
      if (i2.length === 1 && (s2 = iteratorRegex.exec(i2[0].toString())))
        s2[4] === "of" ? (o = lispifyReturnExpr(e, i2[0].substring(s2[0].length)), d = [ofStart2, ofStart3], a = ofCondition, h = ofStep, u = lispify(e, new CodeString((s2[1] || "let ") + s2[3] + " = $$next.value"), ["initialize"])) : (o = lispifyReturnExpr(e, i2[0].substring(s2[0].length)), d = [inStart2, inStart3], h = inStep, a = inCondition, u = lispify(e, new CodeString((s2[1] || "let ") + s2[3] + " = $$keys[$$keyIndex]"), ["initialize"]));
      else {
        if (i2.length !== 3)
          throw new SyntaxError("Invalid for loop definition");
        l = lispifyExpr(e, i2.shift(), startingExecpted), a = lispifyReturnExpr(e, i2.shift()), h = lispifyExpr(e, i2.shift());
      }
      c = restOfExp(e, n.substring(p)).trim(), c[0] === "{" && (c = c.slice(1, -1));
      break;
    case "do":
      f = 0;
      const x = !!r[3];
      c = restOfExp(e, n.substring(r[0].length), x ? [/^\}/] : [semiColon]), a = lispifyReturnExpr(e, restOfExp(e, n.substring(n.toString().indexOf("(", r[0].length + c.length) + 1), [], "("));
  }
  const g = [f, d, o, l, h, a, u];
  i.lispTree = createLisp({ op: 38, a: g, b: lispifyBlock(c, e) });
}), setLispType(["block"], (e, t, n, r, s, i) => {
  i.lispTree = createLisp({ op: 42, a: lispifyBlock(restOfExp(e, n.substring(1), [], "{"), e), b: 0 });
}), setLispType(["loopAction"], (e, t, n, r, s, i) => {
  i.lispTree = createLisp({ op: 86, a: r[1], b: 0 });
});
var catchReg = /^\s*(catch\s*(\(\s*([a-zA-Z\$_][a-zA-Z\d\$_]*)\s*\))?|finally)\s*\{/;
setLispType(["try"], (e, t, n, r, s, i) => {
  const o = restOfExp(e, n.substring(r[0].length), [], "{");
  let a, c, p = catchReg.exec(n.substring(r[0].length + o.length + 1).toString()), l = "", d = 0;
  p[1].startsWith("catch") ? (p = catchReg.exec(n.substring(r[0].length + o.length + 1).toString()), l = p[2], c = restOfExp(e, n.substring(r[0].length + o.length + 1 + p[0].length), [], "{"), d = r[0].length + o.length + 1 + p[0].length + c.length + 1, (p = catchReg.exec(n.substring(d).toString())) && p[1].startsWith("finally") && (a = restOfExp(e, n.substring(d + p[0].length), [], "{"))) : a = restOfExp(e, n.substring(r[0].length + o.length + 1 + p[0].length), [], "{");
  const u = [l, lispifyBlock(insertSemicolons(e, c || emptyString), e), lispifyBlock(insertSemicolons(e, a || emptyString), e)];
  i.lispTree = createLisp({ op: 39, a: lispifyBlock(insertSemicolons(e, o), e), b: u });
}), setLispType(["void", "await"], (e, t, n, r, s, i) => {
  const o = restOfExp(e, n.substring(r[0].length), [/^([^\s\.\?\w\$]|\?[^\.])/]);
  i.lispTree = lispify(e, n.substring(r[0].length + o.length), expectTypes[s].next, createLisp({ op: t === "void" ? 87 : 44, a: lispify(e, o), b: 0 }));
}), setLispType(["new"], (e, t, n, r, s, i) => {
  let o = r[0].length;
  const a = restOfExp(e, n.substring(o), [], undefined, "(");
  o += a.length + 1;
  const c = [];
  if (n.char(o - 1) === "(") {
    const t2 = restOfExp(e, n.substring(o), [], "(");
    let r2;
    o += t2.length + 1;
    let s2 = 0;
    for (;(r2 = restOfExp(e, t2.substring(s2), [/^,/])).length; )
      s2 += r2.length + 1, c.push(r2.trim());
  }
  i.lispTree = lispify(e, n.substring(o), expectTypes.expEdge.next, createLisp({ op: 45, a: lispify(e, a, expectTypes.initialize.next), b: c.map((t2) => lispify(e, t2, expectTypes.initialize.next)) }));
});
var ofStart2 = lispify(undefined, new CodeString("let $$iterator = $$obj[Symbol.iterator]()"), ["initialize"]);
var ofStart3 = lispify(undefined, new CodeString("let $$next = $$iterator.next()"), ["initialize"]);
var ofCondition = lispify(undefined, new CodeString("return !$$next.done"), ["initialize"]);
var ofStep = lispify(undefined, new CodeString("$$next = $$iterator.next()"));
var inStart2 = lispify(undefined, new CodeString("let $$keys = Object.keys($$obj)"), ["initialize"]);
var inStart3 = lispify(undefined, new CodeString("let $$keyIndex = 0"), ["initialize"]);
var inStep = lispify(undefined, new CodeString("$$keyIndex++"));
var inCondition = lispify(undefined, new CodeString("return $$keyIndex < $$keys.length"), ["initialize"]);
var lastType;
function lispify(e, t, n, r, s = false) {
  if (r = r || [0, 0, 0], n = n || expectTypes.initialize.next, t === undefined)
    return r;
  const i = (t = t.trimStart()).toString();
  if (!t.length && !n.includes("expEnd"))
    throw new SyntaxError("Unexpected end of expression");
  if (!t.length)
    return r;
  let o, a = { lispTree: r };
  for (let r2 of n)
    if (r2 !== "expEnd") {
      for (let n2 in expectTypes[r2].types)
        if (n2 !== "expEnd" && (o = expectTypes[r2].types[n2].exec(i))) {
          lastType = n2;
          try {
            lispTypes.get(n2)(e, n2, t, o, r2, a);
          } catch (e2) {
            if (s && e2 instanceof SyntaxError)
              throw new ParseError(e2.message, i);
            throw e2;
          }
          break;
        }
      if (o)
        break;
    }
  if (!o && t.length) {
    if (t.char(0), s)
      throw new ParseError(`Unexpected token after ${lastType}: ${t.char(0)}`, i);
    throw new SyntaxError(`Unexpected token after ${lastType}: ${t.char(0)}`);
  }
  return a.lispTree;
}
var startingExpectedWithoutSingle = startingExecpted.filter((e) => e !== "expSingle");
function lispifyExpr(e, t, n) {
  if (!t.trimStart().length)
    return;
  let r, s = [], i = 0;
  if ((n = n || expectTypes.initialize.next).includes("expSingle") && testMultiple(t.toString(), Object.values(expectTypes.expSingle.types)))
    return lispify(e, t, ["expSingle"], undefined, true);
  for (n === startingExecpted && (n = startingExpectedWithoutSingle);(r = restOfExp(e, t.substring(i), [/^,/])).length; )
    s.push(r.trimStart()), i += r.length + 1;
  if (s.length === 1)
    return lispify(e, t, n, undefined, true);
  if (n.includes("initialize")) {
    let r2 = expectTypes.initialize.types.initialize.exec(s[0].toString());
    if (r2)
      return createLisp({ op: 42, a: s.map((t2, n2) => lispify(e, n2 ? new CodeString(r2[1] + " " + t2) : t2, ["initialize"], undefined, true)), b: 0 });
    if (expectTypes.initialize.types.return.exec(s[0].toString()))
      return lispify(e, t, n, undefined, true);
  }
  const o = s.map((t2, r2) => lispify(e, t2, n, undefined, true));
  return createLisp({ op: 43, a: o, b: 0 });
}
function lispifyReturnExpr(e, t) {
  return createLisp({ op: 8, a: 0, b: lispifyExpr(e, t) });
}
function lispifyBlock(e, t, n = false) {
  if (!(e = insertSemicolons(t, e)).trim().length)
    return [];
  let r, s = [], i = 0, o = 0, a = {}, c = false, p = false;
  for (;(r = restOfExp(t, e.substring(i), [semiColon], undefined, undefined, undefined, a)).length && (p = e.char(i + r.length) && e.char(i + r.length) !== ";", i += r.length + (p ? 0 : 1), /^\s*else(?![\w\$])/.test(e.substring(i).toString()) || a.words.includes("do") && /^\s*while(?![\w\$])/.test(e.substring(i).toString()) ? c = true : (c = false, s.push(e.substring(o, i - (p ? 0 : 1))), o = i), a = {}, !n); )
    ;
  return c && s.push(e.substring(o, i - (p ? 0 : 1))), s.map((e2) => e2.trimStart()).filter((e2) => e2.length).map((e2, n2) => lispifyExpr(t, e2.trimStart(), startingExecpted));
}
function lispifyFunction(e, t, n = false) {
  if (!e.trim().length)
    return [];
  const r = lispifyBlock(e, t, n);
  let s = [];
  return hoist(r, s), s.concat(r);
}
function isLisp(e) {
  return Array.isArray(e) && typeof e[0] == "number" && e[0] !== 0 && e[0] !== 88;
}
function hoist(e, t) {
  if (isLisp(e)) {
    const [n, r, s] = e;
    if (n === 39 || n === 13 || n === 38 || n === 40)
      hoist(r, t), hoist(s, t);
    else if (n === 34)
      t.push(createLisp({ op: 34, a: r, b: 0 }));
    else if (n === 37 && r[1])
      return t.push(e), true;
  } else if (Array.isArray(e)) {
    const n = [];
    for (let r of e)
      hoist(r, t) || n.push(r);
    n.length !== e.length && (e.length = 0, e.push(...n));
  }
  return false;
}
var closingsNoInsertion = /^(\})\s*(catch|finally|else|while|instanceof)(?![\w\$])/;
var colonsRegex = /^((([\w\$\]\)\"\'\`]|\+\+|\-\-)\s*\r?\n\s*([\w\$\+\-\!~]))|(\}\s*[\w\$\!~\+\-\{\(\"\'\`]))/;
function insertSemicolons(e, t) {
  let n = t, r = emptyString, s = {};
  const i = insertedSemicolons.get(t.ref) || new Array(t.ref.str.length);
  for (;(r = restOfExp(e, n, [], undefined, undefined, [colonsRegex], s)).length; ) {
    let e2 = false, t2 = r, o = r.length;
    if (s.regRes) {
      e2 = true;
      const [, , i2, , , a] = s.regRes;
      if (o = s.regRes[3] === "++" || s.regRes[3] === "--" ? r.length + 1 : r.length, t2 = n.substring(0, o), a) {
        let t3 = closingsNoInsertion.exec(n.substring(r.length - 1).toString());
        t3 ? e2 = t3[2] === "while" && s.lastWord !== "do" : s.lastWord === "function" && s.regRes[5][0] === "}" && s.regRes[5].slice(-1) === "(" && (e2 = false);
      } else
        i2 && (s.lastWord !== "if" && s.lastWord !== "while" && s.lastWord !== "for" && s.lastWord !== "else" || (e2 = false));
    }
    e2 && (i[t2.end] = true), n = n.substring(o), s = {};
  }
  return insertedSemicolons.set(t.ref, i), t;
}
function checkRegex(e) {
  let t = 1, n = false, r = false, s = false;
  for (;t < e.length && !r && !s; )
    r = e[t] === "/" && !n, n = e[t] === "\\" && !n, s = e[t] === `
`, t++;
  let i = e.substring(t);
  if (s = s || !r || /^\s*\d/.test(i), s)
    return null;
  let o = /^[a-z]*/.exec(i);
  return /^\s+[\w\$]/.test(e.substring(t + o[0].length)) ? null : { regex: e.substring(1, t - 1), flags: o && o[0] || "", length: t + (o && o[0].length || 0) };
}
var notDivide = /(typeof|delete|instanceof|return|in|of|throw|new|void|do|if)$/;
var possibleDivide = /^([\w\$\]\)]|\+\+|\-\-)[\s\/]/;
function extractConstants(e, t, n = "") {
  let r, s, i = [], o = false, a = "", c = -1, p = [], l = "";
  const d = [], u = [];
  let f;
  for (var h = 0;h < t.length; h++)
    if (l = t[h], a)
      l === a && (a === "*" && t[h + 1] === "/" ? (a = "", h++) : a === `
` && (a = ""));
    else {
      if (o) {
        o = false, i.push(l);
        continue;
      }
      if (r)
        if (r === "`" && l === "$" && t[h + 1] === "{") {
          let n2 = extractConstants(e, t.substring(h + 2), "{");
          p.push(n2.str), i.push("${", p.length - 1, "}"), h += n2.length + 2;
        } else if (r === l) {
          if (r === "`") {
            const t2 = createLisp({ op: 36, a: unraw(i.join("")), b: [] });
            t2.tempJsStrings = p, e.literals.push(t2), d.push("`", e.literals.length - 1, "`");
          } else
            e.strings.push(unraw(i.join(""))), d.push('"', e.strings.length - 1, '"');
          r = null, i = [];
        } else
          i.push(l);
      else {
        if (l === "'" || l === '"' || l === "`")
          p = [], r = l;
        else {
          if (closings[n] === l && !u.length)
            return { str: d.join(""), length: h };
          closings[l] ? (u.push(l), d.push(l)) : closings[u[u.length - 1]] === l ? (u.pop(), d.push(l)) : l !== "/" || t[h + 1] !== "*" && t[h + 1] !== "/" ? l === "/" && !f && (s = checkRegex(t.substring(h))) ? (e.regexes.push(s), d.push("/", e.regexes.length - 1, "/r"), h += s.length - 1) : d.push(l) : (a = t[h + 1] === "*" ? "*" : `
`, c = h);
        }
        f && space.test(l) || (f = possibleDivide.exec(t.substring(h))) && notDivide.test(t.substring(0, h + f[1].length)) && (f = null);
      }
      o = r && l === "\\";
    }
  if (a && a === "*")
    throw new SyntaxError(`Unclosed comment '/*': ${t.substring(c)}`);
  return { str: d.join(""), length: h };
}
function parse(e, t = false, n = false) {
  if (typeof e != "string")
    throw new ParseError(`Cannot parse ${e}`, e);
  let r = " " + e;
  const s = { strings: [], literals: [], regexes: [], eager: t };
  r = extractConstants(s, r).str;
  for (let e2 of s.literals)
    e2[2] = e2.tempJsStrings.map((e3) => lispifyExpr(s, new CodeString(e3))), delete e2.tempJsStrings;
  return { tree: lispifyFunction(new CodeString(r), s, n), constants: s };
}

class ExecReturn {
  constructor(e, t, n, r = false, s = false) {
    this.auditReport = e, this.result = t, this.returned = n, this.breakLoop = r, this.continueLoop = s;
  }
}

class Prop {
  constructor(e, t, n = false, r = false, s = false) {
    this.context = e, this.prop = t, this.isConst = n, this.isGlobal = r, this.isVariable = s;
  }
  get(e) {
    if (this.context === undefined)
      throw new ReferenceError(`${this.prop} is not defined`);
    return e.getSubscriptions.forEach((e2) => e2(this.context, this.prop)), this.context[this.prop];
  }
}
var optional = {};
var reservedWords = new Set(["instanceof", "typeof", "return", "try", "catch", "if", "finally", "else", "in", "of", "var", "let", "const", "for", "delete", "false", "true", "while", "do", "break", "continue", "new", "function", "async", "await", "switch", "case"]);
var VarType;
function keysOnly(e) {
  const t = Object.assign({}, e);
  for (let e2 in t)
    t[e2] = true;
  return t;
}
(function(e) {
  e.let = "let", e.const = "const", e.var = "var";
})(VarType || (VarType = {}));

class Scope {
  constructor(e, t = {}, n) {
    this.const = {}, this.let = {}, this.var = {};
    const r = n !== undefined || e === null;
    this.parent = e, this.allVars = t, this.let = r ? this.let : keysOnly(t), this.var = r ? keysOnly(t) : this.var, this.globals = e === null ? keysOnly(t) : {}, this.functionThis = n;
  }
  get(e, t = false) {
    if (e === "this" && this.functionThis !== undefined)
      return new Prop({ this: this.functionThis }, e, true, false, true);
    if (reservedWords.has(e))
      throw new SyntaxError("Unexepected token '" + e + "'");
    if (this.parent === null || !t || this.functionThis !== undefined) {
      if (this.globals.hasOwnProperty(e))
        return new Prop(this.functionThis, e, false, true, true);
      if (e in this.allVars && (!(e in {}) || this.allVars.hasOwnProperty(e)))
        return new Prop(this.allVars, e, this.const.hasOwnProperty(e), this.globals.hasOwnProperty(e), true);
      if (this.parent === null)
        return new Prop(undefined, e);
    }
    return this.parent.get(e, t);
  }
  set(e, t) {
    if (e === "this")
      throw new SyntaxError('"this" cannot be assigned');
    if (reservedWords.has(e))
      throw new SyntaxError("Unexepected token '" + e + "'");
    let n = this.get(e);
    if (n.context === undefined)
      throw new ReferenceError(`Variable '${e}' was not declared.`);
    if (n.isConst)
      throw new TypeError(`Cannot assign to const variable '${e}'`);
    if (n.isGlobal)
      throw new SandboxError(`Cannot override global variable '${e}'`);
    return n.context[n.prop] = t, n;
  }
  declare(e, t = null, n = undefined, r = false) {
    if (e === "this")
      throw new SyntaxError('"this" cannot be declared');
    if (reservedWords.has(e))
      throw new SyntaxError("Unexepected token '" + e + "'");
    if (t === "var" && this.functionThis === undefined && this.parent !== null)
      return this.parent.declare(e, t, n, r);
    if ((!this[t].hasOwnProperty(e) || t === "const" || this.globals.hasOwnProperty(e)) && e in this.allVars)
      throw new SandboxError(`Identifier '${e}' has already been declared`);
    return r && (this.globals[e] = true), this[t][e] = true, this.allVars[e] = n, new Prop(this.allVars, e, this.const.hasOwnProperty(e), r);
  }
}
class LocalScope {
}

class SandboxError extends Error {
}
var currentTicks;
function sandboxFunction(e, t) {
  return function SandboxFunction(...n) {
    let r = parse(n.pop() || "");
    return createFunction(n, r.tree, t || currentTicks, { ...e, constants: r.constants, tree: r.tree }, undefined, "anonymous");
  };
}
function generateArgs(e, t) {
  const n = {};
  return e.forEach((e2, r) => {
    e2.startsWith("...") ? n[e2.substring(3)] = t.slice(r) : n[e2] = t[r];
  }), n;
}
var sandboxedFunctions = new WeakSet;
function createFunction(e, t, n, r, s, i) {
  if (r.ctx.options.forbidFunctionCreation)
    throw new SandboxError("Function creation is forbidden");
  let o;
  return o = i === undefined ? (...i2) => {
    const o2 = generateArgs(e, i2);
    return executeTree(n, r, t, s === undefined ? [] : [new Scope(s, o2)]).result;
  } : function(...i2) {
    const o2 = generateArgs(e, i2);
    return executeTree(n, r, t, s === undefined ? [] : [new Scope(s, o2, this)]).result;
  }, r.registerSandboxFunction(o), sandboxedFunctions.add(o), o;
}
function createFunctionAsync(e, t, n, r, s, i) {
  if (r.ctx.options.forbidFunctionCreation)
    throw new SandboxError("Function creation is forbidden");
  if (!r.ctx.prototypeWhitelist?.has(Promise.prototype))
    throw new SandboxError("Async/await not permitted");
  let o;
  return o = i === undefined ? async (...i2) => {
    const o2 = generateArgs(e, i2);
    return (await executeTreeAsync(n, r, t, s === undefined ? [] : [new Scope(s, o2)])).result;
  } : async function(...i2) {
    const o2 = generateArgs(e, i2);
    return (await executeTreeAsync(n, r, t, s === undefined ? [] : [new Scope(s, o2, this)])).result;
  }, r.registerSandboxFunction(o), sandboxedFunctions.add(o), o;
}
function sandboxedEval(e) {
  return function(t) {
    return e(t)();
  };
}
function sandboxedSetTimeout(e) {
  return function(t, ...n) {
    return typeof t != "string" ? setTimeout(t, ...n) : setTimeout(e(t), ...n);
  };
}
function sandboxedSetInterval(e) {
  return function(t, ...n) {
    return typeof t != "string" ? setInterval(t, ...n) : setInterval(e(t), ...n);
  };
}
function assignCheck(e, t, n = "assign") {
  if (e.context === undefined)
    throw new ReferenceError(`Cannot ${n} value to undefined.`);
  if (typeof e.context != "object" && typeof e.context != "function")
    throw new SyntaxError(`Cannot ${n} value to a primitive.`);
  if (e.isConst)
    throw new TypeError(`Cannot set value to const variable '${e.prop}'`);
  if (e.isGlobal)
    throw new SandboxError(`Cannot ${n} property '${e.prop}' of a global object`);
  if (typeof e.context[e.prop] == "function" && !e.context.hasOwnProperty(e.prop))
    throw new SandboxError(`Override prototype property '${e.prop}' not allowed`);
  n === "delete" ? e.context.hasOwnProperty(e.prop) && (t.changeSubscriptions.get(e.context)?.forEach((t2) => t2({ type: "delete", prop: e.prop })), t.changeSubscriptionsGlobal.get(e.context)?.forEach((t2) => t2({ type: "delete", prop: e.prop }))) : e.context.hasOwnProperty(e.prop) ? (t.setSubscriptions.get(e.context)?.get(e.prop)?.forEach((e2) => e2({ type: "replace" })), t.setSubscriptionsGlobal.get(e.context)?.get(e.prop)?.forEach((e2) => e2({ type: "replace" }))) : (t.changeSubscriptions.get(e.context)?.forEach((t2) => t2({ type: "create", prop: e.prop })), t.changeSubscriptionsGlobal.get(e.context)?.forEach((t2) => t2({ type: "create", prop: e.prop })));
}
var arrayChange = new Set([[].push, [].pop, [].shift, [].unshift, [].splice, [].reverse, [].sort, [].copyWithin]);

class KeyVal {
  constructor(e, t) {
    this.key = e, this.val = t;
  }
}

class SpreadObject {
  constructor(e) {
    this.item = e;
  }
}

class SpreadArray {
  constructor(e) {
    this.item = e;
  }
}

class If {
  constructor(e, t) {
    this.t = e, this.f = t;
  }
}
var literalRegex = /(\$\$)*(\$)?\${(\d+)}/g;
var ops = new Map;
function addOps(e, t) {
  ops.set(e, t);
}
function valueOrProp(e, t) {
  return e instanceof Prop ? e.get(t) : e !== optional ? e : undefined;
}
function execMany(e, t, n, r, s, i, o) {
  t === execSync ? _execManySync(e, n, r, s, i, o) : _execManyAsync(e, n, r, s, i, o).catch(r);
}
function _execManySync(e, t, n, r, s, i) {
  let o = [];
  for (let a = 0;a < t.length; a++) {
    let c;
    try {
      c = syncDone((n2) => execSync(e, t[a], r, s, n2, i)).result;
    } catch (e2) {
      return void n(e2);
    }
    if (c instanceof ExecReturn && (c.returned || c.breakLoop || c.continueLoop))
      return void n(undefined, c);
    if (isLisp(t[a]) && t[a][0] === 8)
      return void n(undefined, new ExecReturn(s.ctx.auditReport, c, true));
    o.push(c);
  }
  n(undefined, o);
}
async function _execManyAsync(e, t, n, r, s, i) {
  let o = [];
  for (let a = 0;a < t.length; a++) {
    let c;
    try {
      let n2;
      c = (n2 = asyncDone((n3) => execAsync(e, t[a], r, s, n3, i))).isInstant === true ? n2.instant : (await n2.p).result;
    } catch (e2) {
      return void n(e2);
    }
    if (c instanceof ExecReturn && (c.returned || c.breakLoop || c.continueLoop))
      return void n(undefined, c);
    if (isLisp(t[a]) && t[a][0] === 8)
      return void n(undefined, new ExecReturn(s.ctx.auditReport, c, true));
    o.push(c);
  }
  n(undefined, o);
}
function asyncDone(e) {
  let t, n = false;
  const r = new Promise((r2, s) => {
    e((e2, i) => {
      e2 ? s(e2) : (n = true, t = i, r2({ result: i }));
    });
  });
  return { isInstant: n, instant: t, p: r };
}
function syncDone(e) {
  let t, n;
  if (e((e2, r) => {
    n = e2, t = r;
  }), n)
    throw n;
  return { result: t };
}
async function execAsync(e, t, n, r, s, i) {
  let o = s;
  const a = new Promise((e2) => {
    o = (t2, n2) => {
      s(t2, n2), e2();
    };
  });
  if (_execNoneRecurse(e, t, n, r, o, true, i))
    ;
  else if (isLisp(t)) {
    let s2, a2 = t[0];
    try {
      let o2;
      s2 = (o2 = asyncDone((s3) => execAsync(e, t[1], n, r, s3, i))).isInstant === true ? o2.instant : (await o2.p).result;
    } catch (e2) {
      return void o(e2);
    }
    let c, p = s2;
    try {
      p = s2 instanceof Prop ? s2.get(r) : s2;
    } catch (e2) {
      return void o(e2);
    }
    if (a2 === 20 || a2 === 21) {
      if (p == null)
        return void o(undefined, optional);
      a2 = a2 === 20 ? 1 : 5;
    }
    if (p === optional) {
      if (a2 === 1 || a2 === 5)
        return void o(undefined, p);
      p = undefined;
    }
    try {
      let s3;
      c = (s3 = asyncDone((s4) => execAsync(e, t[2], n, r, s4, i))).isInstant === true ? s3.instant : (await s3.p).result;
    } catch (e2) {
      return void o(e2);
    }
    let l = c;
    try {
      l = c instanceof Prop ? c.get(r) : c;
    } catch (e2) {
      return void o(e2);
    }
    if (l === optional && (l = undefined), ops.has(a2))
      try {
        ops.get(a2)(execAsync, o, e, p, l, s2, r, n, c, i);
      } catch (e2) {
        o(e2);
      }
    else
      o(new SyntaxError("Unknown operator: " + a2));
  }
  await a;
}
function execSync(e, t, n, r, s, i) {
  if (_execNoneRecurse(e, t, n, r, s, false, i))
    ;
  else if (isLisp(t)) {
    let o, a = t[0];
    try {
      o = syncDone((s2) => execSync(e, t[1], n, r, s2, i)).result;
    } catch (e2) {
      return void s(e2);
    }
    let c, p = o;
    try {
      p = o instanceof Prop ? o.get(r) : o;
    } catch (e2) {
      return void s(e2);
    }
    if (a === 20 || a === 21) {
      if (p == null)
        return void s(undefined, optional);
      a = a === 20 ? 1 : 5;
    }
    if (p === optional) {
      if (a === 1 || a === 5)
        return void s(undefined, p);
      p = undefined;
    }
    try {
      c = syncDone((s2) => execSync(e, t[2], n, r, s2, i)).result;
    } catch (e2) {
      return void s(e2);
    }
    let l = c;
    try {
      l = c instanceof Prop ? c.get(r) : c;
    } catch (e2) {
      return void s(e2);
    }
    if (l === optional && (l = undefined), ops.has(a))
      try {
        ops.get(a)(execSync, s, e, p, l, o, r, n, c, i);
      } catch (e2) {
        s(e2);
      }
    else
      s(new SyntaxError("Unknown operator: " + a));
  }
}
addOps(1, (e, t, n, r, s, i, o, a) => {
  if (r === null)
    throw new TypeError(`Cannot get property ${s} of null`);
  const c = typeof r;
  if (c === "undefined" && i === undefined) {
    let e2 = a.get(s);
    if (e2.context === o.ctx.sandboxGlobal) {
      o.ctx.options.audit && o.ctx.auditReport.globalsAccess.add(s);
      const e3 = o.ctx.globalsWhitelist.has(o.ctx.sandboxGlobal[s]) ? o.evals.get(o.ctx.sandboxGlobal[s]) : undefined;
      if (e3)
        return void t(undefined, e3);
    }
    return e2.context && e2.context[s] === globalThis ? void t(undefined, o.ctx.globalScope.get("this")) : void t(undefined, e2);
  }
  if (r === undefined)
    throw new SandboxError("Cannot get property '" + s + "' of undefined");
  if (c !== "object")
    c === "number" ? r = new Number(r) : c === "string" ? r = new String(r) : c === "boolean" && (r = new Boolean(r));
  else if (r.hasOwnProperty === undefined)
    return void t(undefined, new Prop(undefined, s));
  const p = c === "function";
  let l = p || !(r.hasOwnProperty(s) || typeof s == "number");
  if (o.ctx.options.audit && l && typeof s == "string") {
    let e2 = Object.getPrototypeOf(r);
    do {
      e2.hasOwnProperty(s) && (o.ctx.auditReport.prototypeAccess[e2.constructor.name] || (o.ctx.auditReport.prototypeAccess[e2.constructor.name] = new Set), o.ctx.auditReport.prototypeAccess[e2.constructor.name].add(s));
    } while (e2 = Object.getPrototypeOf(e2));
  }
  if (l) {
    if (p) {
      if (!["name", "length", "constructor"].includes(s) && r.hasOwnProperty(s)) {
        const e2 = o.ctx.prototypeWhitelist.get(r.prototype), n2 = o.ctx.options.prototypeReplacements.get(r);
        if (n2)
          return void t(undefined, new Prop(n2(r, true), s));
        if (!e2 || e2.size && !e2.has(s))
          throw new SandboxError(`Static method or property access not permitted: ${r.name}.${s}`);
      }
    } else if (s !== "constructor") {
      let e2 = r;
      for (;e2 = Object.getPrototypeOf(e2); )
        if (e2.hasOwnProperty(s)) {
          const n2 = o.ctx.prototypeWhitelist.get(e2), i2 = o.ctx.options.prototypeReplacements.get(e2.constuctor);
          if (i2)
            return void t(undefined, new Prop(i2(r, false), s));
          if (n2 && (!n2.size || n2.has(s)))
            break;
          throw new SandboxError(`Method or property access not permitted: ${e2.constructor.name}.${s}`);
        }
    }
  }
  if (o.evals.has(r[s]))
    return void t(undefined, o.evals.get(r[s]));
  if (r[s] === globalThis)
    return void t(undefined, o.ctx.globalScope.get("this"));
  let d = i.isGlobal || p && !sandboxedFunctions.has(r) || o.ctx.globalsWhitelist.has(r);
  t(undefined, new Prop(r, s, false, d));
}), addOps(5, (e, t, n, r, s, i, o, a) => {
  if (o.ctx.options.forbidFunctionCalls)
    throw new SandboxError("Function invocations are not allowed");
  if (typeof r != "function")
    throw new TypeError(`${typeof i.prop == "symbol" ? "Symbol" : i.prop} is not a function`);
  const c = s.map((e2) => e2 instanceof SpreadArray ? [...e2.item] : [e2]).flat().map((e2) => valueOrProp(e2, o));
  if (typeof i != "function") {
    if (i.context[i.prop] === JSON.stringify && o.getSubscriptions.size) {
      const e2 = new Set, t2 = (n2) => {
        if (n2 && typeof n2 == "object" && !e2.has(n2)) {
          e2.add(n2);
          for (let e3 in n2)
            o.getSubscriptions.forEach((t3) => t3(n2, e3)), t2(n2[e3]);
        }
      };
      t2(c[0]);
    }
    if (i.context instanceof Array && arrayChange.has(i.context[i.prop]) && (o.changeSubscriptions.get(i.context) || o.changeSubscriptionsGlobal.get(i.context))) {
      let e2, t2 = false;
      if (i.prop === "push")
        e2 = { type: "push", added: c }, t2 = !!c.length;
      else if (i.prop === "pop")
        e2 = { type: "pop", removed: i.context.slice(-1) }, t2 = !!e2.removed.length;
      else if (i.prop === "shift")
        e2 = { type: "shift", removed: i.context.slice(0, 1) }, t2 = !!e2.removed.length;
      else if (i.prop === "unshift")
        e2 = { type: "unshift", added: c }, t2 = !!c.length;
      else if (i.prop === "splice")
        e2 = { type: "splice", startIndex: c[0], deleteCount: c[1] === undefined ? i.context.length : c[1], added: c.slice(2), removed: i.context.slice(c[0], c[1] === undefined ? undefined : c[0] + c[1]) }, t2 = !!e2.added.length || !!e2.removed.length;
      else if (i.prop === "reverse" || i.prop === "sort")
        e2 = { type: i.prop }, t2 = !!i.context.length;
      else if (i.prop === "copyWithin") {
        let n2 = c[2] === undefined ? i.context.length - c[1] : Math.min(i.context.length, c[2] - c[1]);
        e2 = { type: "copyWithin", startIndex: c[0], endIndex: c[0] + n2, added: i.context.slice(c[1], c[1] + n2), removed: i.context.slice(c[0], c[0] + n2) }, t2 = !!e2.added.length || !!e2.removed.length;
      }
      t2 && (o.changeSubscriptions.get(i.context)?.forEach((t3) => t3(e2)), o.changeSubscriptionsGlobal.get(i.context)?.forEach((t3) => t3(e2)));
    }
    i.get(o), t(undefined, i.context[i.prop](...c));
  } else
    t(undefined, i(...c));
}), addOps(22, (e, t, n, r, s, i, o, a) => {
  let c = {};
  for (let e2 of s)
    e2.key instanceof SpreadObject ? c = { ...c, ...e2.key.item } : c[e2.key] = e2.val;
  t(undefined, c);
}), addOps(6, (e, t, n, r, s) => t(undefined, new KeyVal(r, s))), addOps(12, (e, t, n, r, s, i, o, a) => {
  t(undefined, s.map((e2) => e2 instanceof SpreadArray ? [...e2.item] : [e2]).flat().map((e2) => valueOrProp(e2, o)));
}), addOps(23, (e, t, n, r, s) => t(undefined, s)), addOps(35, (e, t, n, r, s) => {
  switch (s) {
    case "true":
      return t(undefined, true);
    case "false":
      return t(undefined, false);
    case "null":
      return t(undefined, null);
    case "undefined":
      return t(undefined, undefined);
    case "NaN":
      return t(undefined, NaN);
    case "Infinity":
      return t(undefined, 1 / 0);
  }
  t(new Error("Unknown symbol: " + s));
}), addOps(7, (e, t, n, r, s) => t(undefined, Number(s))), addOps(83, (e, t, n, r, s) => t(undefined, BigInt(s))), addOps(2, (e, t, n, r, s, i, o) => t(undefined, o.constants.strings[parseInt(s)])), addOps(85, (e, t, n, r, s, i, o) => {
  const a = o.constants.regexes[parseInt(s)];
  if (!o.ctx.globalsWhitelist.has(RegExp))
    throw new SandboxError("Regex not permitted");
  t(undefined, new RegExp(a.regex, a.flags));
}), addOps(84, (e, t, n, r, s, i, o, a) => {
  let c = o.constants.literals[parseInt(s)];
  const [, p, l] = c;
  let d, u = [], f = [];
  for (;d = literalRegex.exec(p); )
    d[2] || (u.push(l[parseInt(d[3], 10)]), f.push(d[3]));
  e(n, u, a, o, (e2, n2) => {
    const r2 = {};
    if (e2)
      t(e2);
    else {
      for (let e3 in f) {
        const t2 = f[e3];
        r2[t2] = n2[e3];
      }
      t(undefined, p.replace(/(\\\\)*(\\)?\${(\d+)}/g, (e3, t2, n3, s2) => {
        if (n3)
          return e3;
        return (t2 || "") + `${valueOrProp(r2[s2], o)}`;
      }));
    }
  });
}), addOps(18, (e, t, n, r, s, i, o, a) => {
  t(undefined, new SpreadArray(s));
}), addOps(17, (e, t, n, r, s, i, o, a) => {
  t(undefined, new SpreadObject(s));
}), addOps(24, (e, t, n, r, s) => t(undefined, !s)), addOps(64, (e, t, n, r, s) => t(undefined, ~s)), addOps(25, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, ++i.context[i.prop]);
}), addOps(26, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop]++);
}), addOps(27, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, --i.context[i.prop]);
}), addOps(28, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop]--);
}), addOps(9, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] = s);
}), addOps(66, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] += s);
}), addOps(65, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] -= s);
}), addOps(67, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] /= s);
}), addOps(69, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] *= s);
}), addOps(68, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] **= s);
}), addOps(70, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] %= s);
}), addOps(71, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] ^= s);
}), addOps(72, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] &= s);
}), addOps(73, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] |= s);
}), addOps(76, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] <<= s);
}), addOps(75, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] >>= s);
}), addOps(74, (e, t, n, r, s, i, o) => {
  assignCheck(i, o), t(undefined, i.context[i.prop] >>= s);
}), addOps(57, (e, t, n, r, s) => t(undefined, r > s)), addOps(56, (e, t, n, r, s) => t(undefined, r < s)), addOps(55, (e, t, n, r, s) => t(undefined, r >= s)), addOps(54, (e, t, n, r, s) => t(undefined, r <= s)), addOps(52, (e, t, n, r, s) => t(undefined, r == s)), addOps(32, (e, t, n, r, s) => t(undefined, r === s)), addOps(53, (e, t, n, r, s) => t(undefined, r != s)), addOps(31, (e, t, n, r, s) => t(undefined, r !== s)), addOps(29, (e, t, n, r, s) => t(undefined, r && s)), addOps(30, (e, t, n, r, s) => t(undefined, r || s)), addOps(77, (e, t, n, r, s) => t(undefined, r & s)), addOps(78, (e, t, n, r, s) => t(undefined, r | s)), addOps(33, (e, t, n, r, s) => t(undefined, r + s)), addOps(47, (e, t, n, r, s) => t(undefined, r - s)), addOps(59, (e, t, n, r, s) => t(undefined, +s)), addOps(58, (e, t, n, r, s) => t(undefined, -s)), addOps(48, (e, t, n, r, s) => t(undefined, r / s)), addOps(79, (e, t, n, r, s) => t(undefined, r ^ s)), addOps(50, (e, t, n, r, s) => t(undefined, r * s)), addOps(51, (e, t, n, r, s) => t(undefined, r % s)), addOps(80, (e, t, n, r, s) => t(undefined, r << s)), addOps(81, (e, t, n, r, s) => t(undefined, r >> s)), addOps(82, (e, t, n, r, s) => t(undefined, r >>> s)), addOps(60, (e, t, n, r, s, i, o, a) => {
  e(n, s, a, o, (e2, n2) => {
    t(undefined, typeof valueOrProp(n2, o));
  });
}), addOps(62, (e, t, n, r, s) => t(undefined, r instanceof s)), addOps(63, (e, t, n, r, s) => t(undefined, r in s)), addOps(61, (e, t, n, r, s, i, o, a, c) => {
  c.context !== undefined ? (assignCheck(c, o, "delete"), c.isVariable ? t(undefined, false) : t(undefined, delete c.context[c.prop])) : t(undefined, true);
}), addOps(8, (e, t, n, r, s, i, o) => t(undefined, s)), addOps(34, (e, t, n, r, s, i, o, a, c) => {
  t(undefined, a.declare(r, VarType.var, s));
}), addOps(3, (e, t, n, r, s, i, o, a, c) => {
  t(undefined, a.declare(r, VarType.let, s, c && c.isGlobal));
}), addOps(4, (e, t, n, r, s, i, o, a, c) => {
  t(undefined, a.declare(r, VarType.const, s));
}), addOps(11, (e, t, n, r, s, i, o, a) => {
  r = [...r], (typeof i[2] == "string" || i[2] instanceof CodeString) && (i[2] = s = lispifyFunction(new CodeString(i[2]), o.constants)), r.shift() ? t(undefined, createFunctionAsync(r, s, n, o, a)) : t(undefined, createFunction(r, s, n, o, a));
}), addOps(37, (e, t, n, r, s, i, o, a) => {
  (typeof i[2] == "string" || i[2] instanceof CodeString) && (i[2] = s = lispifyFunction(new CodeString(i[2]), o.constants));
  let c, p = r.shift(), l = r.shift();
  c = p === 88 ? createFunctionAsync(r, s, n, o, a, l) : createFunction(r, s, n, o, a, l), l && a.declare(l, VarType.var, c), t(undefined, c);
}), addOps(10, (e, t, n, r, s, i, o, a) => {
  (typeof i[2] == "string" || i[2] instanceof CodeString) && (i[2] = s = lispifyFunction(new CodeString(i[2]), o.constants));
  let c, p = r.shift(), l = r.shift();
  l && (a = new Scope(a, {})), c = p === 88 ? createFunctionAsync(r, s, n, o, a, l) : createFunction(r, s, n, o, a, l), l && a.declare(l, VarType.let, c), t(undefined, c);
}), addOps(38, (e, t, n, r, s, i, o, a) => {
  const [c, p, l, d, u, f, h] = r;
  let g = true;
  const x = new Scope(a, {});
  let y = { $$obj: undefined };
  const b = new Scope(x, y);
  if (e === execAsync)
    (async () => {
      let r2;
      for (r2 = asyncDone((t2) => e(n, d, x, o, t2)), y.$$obj = (r2 = asyncDone((t2) => e(n, l, x, o, t2))).isInstant === true ? r2.instant : (await r2.p).result, r2 = asyncDone((t2) => e(n, p, b, o, t2)), c && (g = (r2 = asyncDone((t2) => e(n, f, b, o, t2))).isInstant === true ? r2.instant : (await r2.p).result);g; ) {
        let i2 = {};
        r2 = asyncDone((t2) => e(n, h, new Scope(b, i2), o, t2)), r2.isInstant === true ? r2.instant : (await r2.p).result;
        let a2 = await executeTreeAsync(n, o, s, [new Scope(x, i2)], "loop");
        if (a2 instanceof ExecReturn && a2.returned)
          return void t(undefined, a2);
        if (a2 instanceof ExecReturn && a2.breakLoop)
          break;
        r2 = asyncDone((t2) => e(n, u, b, o, t2)), g = (r2 = asyncDone((t2) => e(n, f, b, o, t2))).isInstant === true ? r2.instant : (await r2.p).result;
      }
      t();
    })().catch(t);
  else {
    for (syncDone((t2) => e(n, d, x, o, t2)), y.$$obj = syncDone((t2) => e(n, l, x, o, t2)).result, syncDone((t2) => e(n, p, b, o, t2)), c && (g = syncDone((t2) => e(n, f, b, o, t2)).result);g; ) {
      let r2 = {};
      syncDone((t2) => e(n, h, new Scope(b, r2), o, t2));
      let i2 = executeTree(n, o, s, [new Scope(x, r2)], "loop");
      if (i2 instanceof ExecReturn && i2.returned)
        return void t(undefined, i2);
      if (i2 instanceof ExecReturn && i2.breakLoop)
        break;
      syncDone((t2) => e(n, u, b, o, t2)), g = syncDone((t2) => e(n, f, b, o, t2)).result;
    }
    t();
  }
}), addOps(86, (e, t, n, r, s, i, o, a, c, p) => {
  if (p === "switch" && r === "continue" || !p)
    throw new SandboxError("Illegal " + r + " statement");
  t(undefined, new ExecReturn(o.ctx.auditReport, undefined, false, r === "break", r === "continue"));
}), addOps(13, (e, t, n, r, s, i, o, a, c, p) => {
  e(n, valueOrProp(r, o) ? s.t : s.f, a, o, t);
}), addOps(15, (e, t, n, r, s, i, o, a) => {
  e(n, valueOrProp(r, o) ? s.t : s.f, a, o, t);
}), addOps(16, (e, t, n, r, s) => t(undefined, new If(r, s))), addOps(14, (e, t, n, r, s) => t(undefined, new If(r, s))), addOps(40, (e, t, n, r, s, i, o, a) => {
  e(n, r, a, o, (r2, i2) => {
    if (r2)
      t(r2);
    else if (i2 = valueOrProp(i2, o), e === execSync) {
      let r3, c = false;
      for (let p of s)
        if (c || (c = !p[1] || i2 === valueOrProp(syncDone((t2) => e(n, p[1], a, o, t2)).result, o))) {
          if (!p[2])
            continue;
          if (r3 = executeTree(n, o, p[2], [a], "switch"), r3.breakLoop)
            break;
          if (r3.returned)
            return void t(undefined, r3);
          if (!p[1])
            break;
        }
      t();
    } else
      (async () => {
        let r3, c = false;
        for (let p of s) {
          let s2;
          if (c || (c = !p[1] || i2 === valueOrProp((s2 = asyncDone((t2) => e(n, p[1], a, o, t2))).isInstant === true ? s2.instant : (await s2.p).result, o))) {
            if (!p[2])
              continue;
            if (r3 = await executeTreeAsync(n, o, p[2], [a], "switch"), r3.breakLoop)
              break;
            if (r3.returned)
              return void t(undefined, r3);
            if (!p[1])
              break;
          }
        }
        t();
      })().catch(t);
  });
}), addOps(39, (e, t, n, r, s, i, o, a, c, p) => {
  const [l, d, u] = s;
  executeTreeWithDone(e, (r2, s2) => {
    executeTreeWithDone(e, (i2) => {
      i2 ? t(i2) : r2 ? executeTreeWithDone(e, t, n, o, d, [new Scope(a)], p) : t(undefined, s2);
    }, n, o, u, [new Scope(a, {})]);
  }, n, o, r, [new Scope(a)], p);
}), addOps(87, (e, t, n, r) => {
  t();
}), addOps(45, (e, t, n, r, s, i, o) => {
  if (!o.ctx.globalsWhitelist.has(r) && !sandboxedFunctions.has(r))
    throw new SandboxError(`Object construction not allowed: ${r.constructor.name}`);
  t(undefined, new r(...s));
}), addOps(46, (e, t, n, r, s) => {
  t(s);
}), addOps(43, (e, t, n, r) => t(undefined, r.pop())), addOps(0, (e, t, n, r) => t());
var unexecTypes = new Set([11, 37, 10, 38, 39, 40, 14, 16, 60]);
function _execNoneRecurse(e, t, n, r, s, i, o) {
  const a = i ? execAsync : execSync;
  if (!(r.ctx.options.executionQuota <= e.ticks) || typeof r.ctx.options.onExecutionQuotaReached == "function" && r.ctx.options.onExecutionQuotaReached(e, n, r, t)) {
    if (e.ticks++, currentTicks = e, t instanceof Prop)
      try {
        s(undefined, t.get(r));
      } catch (e2) {
        s(e2);
      }
    else if (t === optional)
      s();
    else if (Array.isArray(t) && !isLisp(t))
      t[0] === 0 ? s() : execMany(e, a, t, s, n, r, o);
    else if (isLisp(t))
      if (t[0] === 42)
        execMany(e, a, t[1], s, n, r, o);
      else if (t[0] === 44)
        i ? r.ctx.prototypeWhitelist?.has(Promise.prototype) ? execAsync(e, t[1], n, r, async (e2, t2) => {
          if (e2)
            s(e2);
          else
            try {
              s(undefined, await valueOrProp(t2, r));
            } catch (e3) {
              s(e3);
            }
        }, o).catch(s) : s(new SandboxError("Async/await is not permitted")) : s(new SandboxError("Illegal use of 'await', must be inside async function"));
      else {
        if (!unexecTypes.has(t[0]))
          return false;
        try {
          ops.get(t[0])(a, s, e, t[1], t[2], t, r, n, undefined, o);
        } catch (e2) {
          s(e2);
        }
      }
    else
      s(undefined, t);
    return true;
  }
  s(new SandboxError("Execution quota exceeded"));
}
function executeTree(e, t, n, r = [], s) {
  return syncDone((i) => executeTreeWithDone(execSync, i, e, t, n, r, s)).result;
}
async function executeTreeAsync(e, t, n, r = [], s) {
  let i;
  return (i = asyncDone((i2) => executeTreeWithDone(execAsync, i2, e, t, n, r, s))).isInstant === true ? i.instant : (await i.p).result;
}
function executeTreeWithDone(e, t, n, r, s, i = [], o) {
  if (!s)
    return void t();
  if (!(s instanceof Array))
    throw new SyntaxError("Bad execution tree");
  let a, c = r.ctx.globalScope;
  for (;a = i.shift(); )
    typeof a == "object" && (c = a instanceof Scope ? a : new Scope(c, a, a instanceof LocalScope ? undefined : null));
  r.ctx.options.audit && !r.ctx.auditReport && (r.ctx.auditReport = { globalsAccess: new Set, prototypeAccess: {} }), e === execSync ? _executeWithDoneSync(t, n, r, s, c, o) : _executeWithDoneAsync(t, n, r, s, c, o).catch(t);
}
function _executeWithDoneSync(e, t, n, r, s, i) {
  if (!(r instanceof Array))
    throw new SyntaxError("Bad execution tree");
  let o = 0;
  for (o = 0;o < r.length; o++) {
    let a, c;
    const p = r[o];
    try {
      execSync(t, p, s, n, (e2, t2) => {
        c = e2, a = t2;
      }, i);
    } catch (e2) {
      c = e2;
    }
    if (c)
      return void e(c);
    if (a instanceof ExecReturn)
      return void e(undefined, a);
    if (isLisp(p) && p[0] === 8)
      return void e(undefined, new ExecReturn(n.ctx.auditReport, a, true));
  }
  e(undefined, new ExecReturn(n.ctx.auditReport, undefined, false));
}
async function _executeWithDoneAsync(e, t, n, r, s, i) {
  if (!(r instanceof Array))
    throw new SyntaxError("Bad execution tree");
  let o = 0;
  for (o = 0;o < r.length; o++) {
    let a, c;
    const p = r[o];
    try {
      await execAsync(t, p, s, n, (e2, t2) => {
        c = e2, a = t2;
      }, i);
    } catch (e2) {
      c = e2;
    }
    if (c)
      return void e(c);
    if (a instanceof ExecReturn)
      return void e(undefined, a);
    if (isLisp(p) && p[0] === 8)
      return void e(undefined, new ExecReturn(n.ctx.auditReport, a, true));
  }
  e(undefined, new ExecReturn(n.ctx.auditReport, undefined, false));
}

class SandboxGlobal {
  constructor(e) {
    if (e === globalThis)
      return globalThis;
    for (let t in e)
      this[t] = e[t];
  }
}

class ExecContext {
  constructor(e, t, n, r, s, i, o, a, c, p) {
    this.ctx = e, this.constants = t, this.tree = n, this.getSubscriptions = r, this.setSubscriptions = s, this.changeSubscriptions = i, this.setSubscriptionsGlobal = o, this.changeSubscriptionsGlobal = a, this.evals = c, this.registerSandboxFunction = p;
  }
}
function subscribeSet(e, t, n, r) {
  const s = r.setSubscriptions.get(e) || new Map;
  r.setSubscriptions.set(e, s);
  const i = s.get(t) || new Set;
  let o;
  return s.set(t, i), i.add(n), e && e[t] && typeof e[t] == "object" && (o = r.changeSubscriptions.get(e[t]) || new Set, o.add(n), r.changeSubscriptions.set(e[t], o)), { unsubscribe: () => {
    i.delete(n), o?.delete(n);
  } };
}

class Sandbox {
  constructor(e) {
    this.setSubscriptions = new WeakMap, this.changeSubscriptions = new WeakMap, this.sandboxFunctions = new WeakMap, e = Object.assign({ audit: false, forbidFunctionCalls: false, forbidFunctionCreation: false, globals: Sandbox.SAFE_GLOBALS, prototypeWhitelist: Sandbox.SAFE_PROTOTYPES, prototypeReplacements: new Map }, e || {});
    const t = new SandboxGlobal(e.globals);
    this.context = { sandbox: this, globalsWhitelist: new Set(Object.values(e.globals)), prototypeWhitelist: new Map([...e.prototypeWhitelist].map((e2) => [e2[0].prototype, e2[1]])), options: e, globalScope: new Scope(null, e.globals, t), sandboxGlobal: t }, this.context.prototypeWhitelist.set(Object.getPrototypeOf([][Symbol.iterator]()), new Set);
  }
  static get SAFE_GLOBALS() {
    return { Function, console: { debug: console.debug, error: console.error, info: console.info, log: console.log, table: console.table, warn: console.warn }, isFinite, isNaN, parseFloat, parseInt, decodeURI, decodeURIComponent, encodeURI, encodeURIComponent, escape, unescape, Boolean, Number, BigInt, String, Object, Array, Symbol, Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, Map, Set, WeakMap, WeakSet, Promise, Intl, JSON, Math, Date, RegExp };
  }
  static get SAFE_PROTOTYPES() {
    let e = [SandboxGlobal, Function, Boolean, Number, BigInt, String, Date, Error, Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, Map, Set, WeakMap, WeakSet, Promise, Symbol, Date, RegExp], t = new Map;
    return e.forEach((e2) => {
      t.set(e2, new Set);
    }), t.set(Object, new Set(["entries", "fromEntries", "getOwnPropertyNames", "is", "keys", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf", "values"])), t;
  }
  subscribeGet(e, t) {
    return t.getSubscriptions.add(e), { unsubscribe: () => t.getSubscriptions.delete(e) };
  }
  subscribeSet(e, t, n, r) {
    return subscribeSet(e, t, n, r);
  }
  subscribeSetGlobal(e, t, n) {
    return subscribeSet(e, t, n, this);
  }
  static audit(e, t = []) {
    const n = {};
    for (let e2 of Object.getOwnPropertyNames(globalThis))
      n[e2] = globalThis[e2];
    const r = new Sandbox({ globals: n, audit: true });
    return r.executeTree(r.createContext(r.context, parse(e)), t);
  }
  static parse(e) {
    return parse(e);
  }
  createContext(context, executionTree) {
    const evals = new Map, execContext = new ExecContext(context, executionTree.constants, executionTree.tree, new Set, new WeakMap, new WeakMap, this.setSubscriptions, this.changeSubscriptions, evals, (e) => this.sandboxFunctions.set(e, execContext)), func = sandboxFunction(execContext);
    return evals.set(Function, func), evals.set(eval, sandboxedEval(func)), evals.set(setTimeout, sandboxedSetTimeout(func)), evals.set(setInterval, sandboxedSetInterval(func)), execContext;
  }
  getContext(e) {
    return this.sandboxFunctions.get(e);
  }
  executeTree(e, t = []) {
    return executeTree({ ticks: BigInt(0) }, e, e.tree, t);
  }
  executeTreeAsync(e, t = []) {
    return executeTreeAsync({ ticks: BigInt(0) }, e, e.tree, t);
  }
  compile(e, t = false) {
    const n = parse(e, t);
    return (...e2) => {
      const t2 = this.createContext(this.context, n);
      return { context: t2, run: () => this.executeTree(t2, [...e2]).result };
    };
  }
  compileAsync(e, t = false) {
    const n = parse(e, t);
    return (...e2) => {
      const t2 = this.createContext(this.context, n);
      return { context: t2, run: () => this.executeTreeAsync(t2, [...e2]).then((e3) => e3.result) };
    };
  }
  compileExpression(e, t = false) {
    const n = parse(e, t, true);
    return (...e2) => {
      const t2 = this.createContext(this.context, n);
      return { context: t2, run: () => this.executeTree(t2, [...e2]).result };
    };
  }
  compileExpressionAsync(e, t = false) {
    const n = parse(e, t, true);
    return (...e2) => {
      const t2 = this.createContext(this.context, n);
      return { context: t2, run: () => this.executeTreeAsync(t2, [...e2]).then((e3) => e3.result) };
    };
  }
}

// src/execute.ts
var import_xxhashjs = __toESM(require_lib(), 1);
var sandbox = new Sandbox;
var cache = {};

class Node extends Process {
  async main() {
    if (!this.args[0])
      return;
    const globals = {
      process: {
        args: this.args.slice(1),
        fs: this.fs,
        cwd: this.cwd,
        print: this.print.bind(this),
        println: this.println.bind(this),
        readKey: this.readKey.bind(this),
        readLine: this.readLine.bind(this),
        resolveRelativePath
      }
    };
    let file = await this.fs.promises.readFile(resolveRelativePath(this.args[0], this.cwd), "utf-8");
    if (!file)
      return;
    if (typeof file !== "string")
      return;
    const [firstLine, ...lines] = file.split(`
`);
    const code = lines.join(`
`);
    if (firstLine != "#!/usr/bin/node") {
      this.println("Invalid executable");
      return;
    }
    const hash = import_xxhashjs.h32(code, 0).toNumber();
    if (!cache[hash]) {
      const ctx = sandbox.compileAsync(code);
      cache[hash] = ctx;
    }
    await cache[hash](globals).run();
  }
}

// src/bin/PATH.ts
var PATH = {
  bash: () => Bash,
  node: () => Node
};
var PATH_default = PATH;

// src/util.ts
async function findAsync(arr, asyncCallback) {
  const promises = arr.map(asyncCallback);
  const results = await Promise.all(promises);
  const index = results.findIndex((result) => result);
  return index == -1 ? undefined : arr[index];
}

// src/bin/bash.ts
function hasGoodQuotes(s) {
  let q = "";
  let escape2 = false;
  for (const ch of s) {
    if (escape2) {
      escape2 = false;
      continue;
    }
    if (ch == "\\") {
      escape2 = true;
      continue;
    }
    if (["`", "'", `"`].includes(ch)) {
      if (!q)
        q = ch;
      else if (q == ch)
        q = "";
    }
  }
  return q == "";
}

class Bash extends Process {
  async main() {
    while (true) {
      this.print(`guest@${window.location.host || "VirtualTerminal"} ${this.cwd} $ `);
      let line = "";
      do {
        if (line)
          this.print("> ");
        line += await this.readLine() + `
`;
      } while (line.endsWith("\\\n") || !hasGoodQuotes(line));
      line = line.replace("\\\n", "");
      const parsed = $parse(line, this.env);
      console.log(parsed);
      let command = [];
      let env = {};
      let redirect, valid = true;
      for (const word of parsed) {
        if (typeof word == "object" && "comment" in word)
          continue;
        if (redirect === true) {
          if (typeof word == "string")
            redirect = word;
          else {
            this.println("bash: syntax error near unexpected token '>'");
            valid = false;
            break;
          }
        } else if (typeof word == "object" && "op" in word) {
          if (word.op === ">")
            redirect = true;
          else {
            this.println("bash: unsupported token");
            valid = false;
            break;
          }
        } else if (typeof word == "string") {
          if (word.includes("=")) {
            const [key, value] = word.split("=");
            env[key] = value;
          } else
            command.push(word);
        } else {
          this.println("bash: unsupported token");
          valid = false;
          break;
        }
      }
      if (redirect === true)
        continue;
      if (!valid)
        continue;
      if (!command.length) {
        this.env = { ...this.env, ...env };
        continue;
      }
      switch (command[0]) {
        case "":
          break;
        case "exit":
          return;
        case "cd":
          if (command[1]) {
            let to = resolveRelativePath(command[1], this.cwd);
            if (!to.endsWith("/"))
              to += "/";
            try {
              await this.fs.promises.readdir(to);
              this.cwd = to;
            } catch (e) {
              if (e instanceof Error)
                this.println(e.message);
              else
                throw e;
            }
          } else {
            this.println(this.cwd);
          }
          this.println();
          break;
        default: {
          let executable = PATH_default[command[0]]?.();
          let removeFirstArg = true;
          if (!executable) {
            if (command[0].includes("/")) {
              if (await this.fs.promises.exists(resolveRelativePath(command[0], this.cwd))) {
                executable = PATH_default["node"]();
                removeFirstArg = false;
              } else {
                this.println(`${command[0]}: command not found`);
                break;
              }
            } else {
              const path = (this.env.PATH || "").split(":").filter(Boolean);
              const firstValidDir = await findAsync(path, (dir) => this.fs.promises.exists(dir + "/" + command[0]));
              if (!firstValidDir) {
                this.println(`${command[0]}: command not found`);
                break;
              }
              command[0] = firstValidDir + "/" + command[0];
              executable = PATH_default["node"]();
              removeFirstArg = false;
            }
          }
          if (removeFirstArg)
            command = command.slice(1);
          if (redirect) {
            let output = "";
            await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), ".", env, (data) => output += data);
            await this.fs.promises.writeFile(resolveRelativePath(redirect, this.cwd), output, "utf-8");
          } else
            await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), ".", env);
          break;
        }
      }
    }
  }
}

// src/defaultFs.ts
var DefaultFS = [
  ["usr", [
    ["bin", [
      [
        "cat",
        `#!/usr/bin/node
                if(process.args.length > 0) {
                    await Promise.all(process.args.map(async file => {
                        const path = process.resolveRelativePath(file, process.cwd);
                        await process.fs.promises.readFile(path, 'utf-8').then(
                            file=> process.println(file),
                            e=> {
                                if (e instanceof Error) process.println(e.message);
                                else throw e;
                            });
                    }));
                } else {
                    while(true) {
                        process.println(await process.readLine());
                    }
                }`
      ],
      [
        "mkdir",
        `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("mkdir: Missing operand");
                    return;
                }
            `
      ],
      [
        "rmdir",
        `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("rmdir: Missing operand");
                    return;
                }
                await Promise.all(process.args.map(async dir => {
                    await process.fs.promises.rmdir(process.resolveRelativePath(dir, process.cwd)).catch(e=> {
                        if (e instanceof Error) process.println(e.message);
                        else throw e;
                    })
                }));
                `
      ],
      [
        "node",
        `#!/usr/bin/node
                // virtual file`
      ],
      [
        "touch",
        `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("touch: Missing file operand");
                    return;
                }
                await Promise.all(process.args.map(async file => {
                    const path = process.resolveRelativePath(file, process.cwd);
                    if(await process.fs.promises.exists(path)) {
                        await process.fs.promises.utimes(path, new Date(), new Date());
                    } else {
                        await process.fs.promises.writeFile(path, '', 'utf-8');
                    }
                }));
                `
      ],
      ["ls", `#!/usr/bin/node
                const res = await process.fs.promises.readdir(process.resolveRelativePath(process.args[0] || '.', process.cwd));
                for (const item of res) {
                    process.println(item);
                }`],
      ["echo", `#!/usr/bin/node
                process.println(process.args.join(' '));`]
    ]]
  ]]
];

// node_modules/@zenfs/core/dist/internal/error.js
var Errno;
(function(Errno2) {
  Errno2[Errno2["EPERM"] = 1] = "EPERM";
  Errno2[Errno2["ENOENT"] = 2] = "ENOENT";
  Errno2[Errno2["EINTR"] = 4] = "EINTR";
  Errno2[Errno2["EIO"] = 5] = "EIO";
  Errno2[Errno2["ENXIO"] = 6] = "ENXIO";
  Errno2[Errno2["EBADF"] = 9] = "EBADF";
  Errno2[Errno2["EAGAIN"] = 11] = "EAGAIN";
  Errno2[Errno2["ENOMEM"] = 12] = "ENOMEM";
  Errno2[Errno2["EACCES"] = 13] = "EACCES";
  Errno2[Errno2["EFAULT"] = 14] = "EFAULT";
  Errno2[Errno2["ENOTBLK"] = 15] = "ENOTBLK";
  Errno2[Errno2["EBUSY"] = 16] = "EBUSY";
  Errno2[Errno2["EEXIST"] = 17] = "EEXIST";
  Errno2[Errno2["EXDEV"] = 18] = "EXDEV";
  Errno2[Errno2["ENODEV"] = 19] = "ENODEV";
  Errno2[Errno2["ENOTDIR"] = 20] = "ENOTDIR";
  Errno2[Errno2["EISDIR"] = 21] = "EISDIR";
  Errno2[Errno2["EINVAL"] = 22] = "EINVAL";
  Errno2[Errno2["ENFILE"] = 23] = "ENFILE";
  Errno2[Errno2["EMFILE"] = 24] = "EMFILE";
  Errno2[Errno2["ETXTBSY"] = 26] = "ETXTBSY";
  Errno2[Errno2["EFBIG"] = 27] = "EFBIG";
  Errno2[Errno2["ENOSPC"] = 28] = "ENOSPC";
  Errno2[Errno2["ESPIPE"] = 29] = "ESPIPE";
  Errno2[Errno2["EROFS"] = 30] = "EROFS";
  Errno2[Errno2["EMLINK"] = 31] = "EMLINK";
  Errno2[Errno2["EPIPE"] = 32] = "EPIPE";
  Errno2[Errno2["EDOM"] = 33] = "EDOM";
  Errno2[Errno2["ERANGE"] = 34] = "ERANGE";
  Errno2[Errno2["EDEADLK"] = 35] = "EDEADLK";
  Errno2[Errno2["ENAMETOOLONG"] = 36] = "ENAMETOOLONG";
  Errno2[Errno2["ENOLCK"] = 37] = "ENOLCK";
  Errno2[Errno2["ENOSYS"] = 38] = "ENOSYS";
  Errno2[Errno2["ENOTEMPTY"] = 39] = "ENOTEMPTY";
  Errno2[Errno2["ELOOP"] = 40] = "ELOOP";
  Errno2[Errno2["ENOMSG"] = 42] = "ENOMSG";
  Errno2[Errno2["EBADE"] = 52] = "EBADE";
  Errno2[Errno2["EBADR"] = 53] = "EBADR";
  Errno2[Errno2["EXFULL"] = 54] = "EXFULL";
  Errno2[Errno2["ENOANO"] = 55] = "ENOANO";
  Errno2[Errno2["EBADRQC"] = 56] = "EBADRQC";
  Errno2[Errno2["ENOSTR"] = 60] = "ENOSTR";
  Errno2[Errno2["ENODATA"] = 61] = "ENODATA";
  Errno2[Errno2["ETIME"] = 62] = "ETIME";
  Errno2[Errno2["ENOSR"] = 63] = "ENOSR";
  Errno2[Errno2["ENONET"] = 64] = "ENONET";
  Errno2[Errno2["EREMOTE"] = 66] = "EREMOTE";
  Errno2[Errno2["ENOLINK"] = 67] = "ENOLINK";
  Errno2[Errno2["ECOMM"] = 70] = "ECOMM";
  Errno2[Errno2["EPROTO"] = 71] = "EPROTO";
  Errno2[Errno2["EBADMSG"] = 74] = "EBADMSG";
  Errno2[Errno2["EOVERFLOW"] = 75] = "EOVERFLOW";
  Errno2[Errno2["EBADFD"] = 77] = "EBADFD";
  Errno2[Errno2["ESTRPIPE"] = 86] = "ESTRPIPE";
  Errno2[Errno2["ENOTSOCK"] = 88] = "ENOTSOCK";
  Errno2[Errno2["EDESTADDRREQ"] = 89] = "EDESTADDRREQ";
  Errno2[Errno2["EMSGSIZE"] = 90] = "EMSGSIZE";
  Errno2[Errno2["EPROTOTYPE"] = 91] = "EPROTOTYPE";
  Errno2[Errno2["ENOPROTOOPT"] = 92] = "ENOPROTOOPT";
  Errno2[Errno2["EPROTONOSUPPORT"] = 93] = "EPROTONOSUPPORT";
  Errno2[Errno2["ESOCKTNOSUPPORT"] = 94] = "ESOCKTNOSUPPORT";
  Errno2[Errno2["ENOTSUP"] = 95] = "ENOTSUP";
  Errno2[Errno2["ENETDOWN"] = 100] = "ENETDOWN";
  Errno2[Errno2["ENETUNREACH"] = 101] = "ENETUNREACH";
  Errno2[Errno2["ENETRESET"] = 102] = "ENETRESET";
  Errno2[Errno2["ETIMEDOUT"] = 110] = "ETIMEDOUT";
  Errno2[Errno2["ECONNREFUSED"] = 111] = "ECONNREFUSED";
  Errno2[Errno2["EHOSTDOWN"] = 112] = "EHOSTDOWN";
  Errno2[Errno2["EHOSTUNREACH"] = 113] = "EHOSTUNREACH";
  Errno2[Errno2["EALREADY"] = 114] = "EALREADY";
  Errno2[Errno2["EINPROGRESS"] = 115] = "EINPROGRESS";
  Errno2[Errno2["ESTALE"] = 116] = "ESTALE";
  Errno2[Errno2["EREMOTEIO"] = 121] = "EREMOTEIO";
  Errno2[Errno2["EDQUOT"] = 122] = "EDQUOT";
})(Errno || (Errno = {}));
var errorMessages = {
  [Errno.EPERM]: "Operation not permitted",
  [Errno.ENOENT]: "No such file or directory",
  [Errno.EINTR]: "Interrupted system call",
  [Errno.EIO]: "Input/output error",
  [Errno.ENXIO]: "No such device or address",
  [Errno.EBADF]: "Bad file descriptor",
  [Errno.EAGAIN]: "Resource temporarily unavailable",
  [Errno.ENOMEM]: "Cannot allocate memory",
  [Errno.EACCES]: "Permission denied",
  [Errno.EFAULT]: "Bad address",
  [Errno.ENOTBLK]: "Block device required",
  [Errno.EBUSY]: "Resource busy or locked",
  [Errno.EEXIST]: "File exists",
  [Errno.EXDEV]: "Invalid cross-device link",
  [Errno.ENODEV]: "No such device",
  [Errno.ENOTDIR]: "File is not a directory",
  [Errno.EISDIR]: "File is a directory",
  [Errno.EINVAL]: "Invalid argument",
  [Errno.ENFILE]: "Too many open files in system",
  [Errno.EMFILE]: "Too many open files",
  [Errno.ETXTBSY]: "Text file busy",
  [Errno.EFBIG]: "File is too big",
  [Errno.ENOSPC]: "No space left on disk",
  [Errno.ESPIPE]: "Illegal seek",
  [Errno.EROFS]: "Cannot modify a read-only file system",
  [Errno.EMLINK]: "Too many links",
  [Errno.EPIPE]: "Broken pipe",
  [Errno.EDOM]: "Numerical argument out of domain",
  [Errno.ERANGE]: "Numerical result out of range",
  [Errno.EDEADLK]: "Resource deadlock would occur",
  [Errno.ENAMETOOLONG]: "File name too long",
  [Errno.ENOLCK]: "No locks available",
  [Errno.ENOSYS]: "Function not implemented",
  [Errno.ENOTEMPTY]: "Directory is not empty",
  [Errno.ELOOP]: "Too many levels of symbolic links",
  [Errno.ENOMSG]: "No message of desired type",
  [Errno.EBADE]: "Invalid exchange",
  [Errno.EBADR]: "Invalid request descriptor",
  [Errno.EXFULL]: "Exchange full",
  [Errno.ENOANO]: "No anode",
  [Errno.EBADRQC]: "Invalid request code",
  [Errno.ENOSTR]: "Device not a stream",
  [Errno.ENODATA]: "No data available",
  [Errno.ETIME]: "Timer expired",
  [Errno.ENOSR]: "Out of streams resources",
  [Errno.ENONET]: "Machine is not on the network",
  [Errno.EREMOTE]: "Object is remote",
  [Errno.ENOLINK]: "Link has been severed",
  [Errno.ECOMM]: "Communication error on send",
  [Errno.EPROTO]: "Protocol error",
  [Errno.EBADMSG]: "Bad message",
  [Errno.EOVERFLOW]: "Value too large for defined data type",
  [Errno.EBADFD]: "File descriptor in bad state",
  [Errno.ESTRPIPE]: "Streams pipe error",
  [Errno.ENOTSOCK]: "Socket operation on non-socket",
  [Errno.EDESTADDRREQ]: "Destination address required",
  [Errno.EMSGSIZE]: "Message too long",
  [Errno.EPROTOTYPE]: "Protocol wrong type for socket",
  [Errno.ENOPROTOOPT]: "Protocol not available",
  [Errno.EPROTONOSUPPORT]: "Protocol not supported",
  [Errno.ESOCKTNOSUPPORT]: "Socket type not supported",
  [Errno.ENOTSUP]: "Operation is not supported",
  [Errno.ENETDOWN]: "Network is down",
  [Errno.ENETUNREACH]: "Network is unreachable",
  [Errno.ENETRESET]: "Network dropped connection on reset",
  [Errno.ETIMEDOUT]: "Connection timed out",
  [Errno.ECONNREFUSED]: "Connection refused",
  [Errno.EHOSTDOWN]: "Host is down",
  [Errno.EHOSTUNREACH]: "No route to host",
  [Errno.EALREADY]: "Operation already in progress",
  [Errno.EINPROGRESS]: "Operation now in progress",
  [Errno.ESTALE]: "Stale file handle",
  [Errno.EREMOTEIO]: "Remote I/O error",
  [Errno.EDQUOT]: "Disk quota exceeded"
};

class ErrnoError extends Error {
  static fromJSON(json) {
    const err = new ErrnoError(json.errno, json.message, json.path, json.syscall);
    err.code = json.code;
    err.stack = json.stack;
    return err;
  }
  static With(code, path, syscall) {
    return new ErrnoError(Errno[code], errorMessages[Errno[code]], path, syscall);
  }
  constructor(errno, message = errorMessages[errno], path, syscall = "") {
    super(message);
    this.errno = errno;
    this.message = message;
    this.path = path;
    this.syscall = syscall;
    this.code = Errno[errno];
  }
  toString() {
    return this.code + ": " + this.message + (this.path ? `, '${this.path}'` : "");
  }
  toJSON() {
    return {
      errno: this.errno,
      code: this.code,
      path: this.path,
      stack: this.stack,
      message: this.message,
      syscall: this.syscall
    };
  }
  bufferSize() {
    return 4 + JSON.stringify(this.toJSON()).length;
  }
}

// node_modules/@zenfs/core/dist/internal/log.js
var exports_log = {};
__export(exports_log, {
  warn: () => warn,
  notice: () => notice,
  log_deprecated: () => log_deprecated,
  log: () => log,
  levels: () => levels,
  levelOf: () => levelOf,
  isEnabled: () => isEnabled,
  info: () => info,
  formats: () => formats,
  format: () => format,
  err: () => err,
  entries: () => entries,
  emerg: () => emerg,
  debug: () => debug,
  crit: () => crit,
  configure: () => configure,
  alert: () => alert,
  Level: () => Level
});

// node_modules/eventemitter3/index.mjs
var import__ = __toESM(require_eventemitter3(), 1);

// node_modules/utilium/dist/list.js
class List extends import__.default {
  [Symbol.toStringTag] = "List";
  constructor(values) {
    super();
    if (values) {
      this.push(...values);
    }
  }
  data = new Set;
  toSet() {
    return new Set(this.data);
  }
  toArray() {
    return Array.from(this.data);
  }
  toJSON() {
    return JSON.stringify(Array.from(this.data));
  }
  toString() {
    return this.join(",");
  }
  _set(index, value, _delete = false) {
    if (Math.abs(index) > this.data.size) {
      throw new ReferenceError("Can not set an element outside the bounds of the list");
    }
    const data = Array.from(this.data);
    data.splice(index, +_delete, value);
    this.data = new Set(data);
    this.emit("update");
  }
  set(index, value) {
    this._set(index, value, true);
  }
  deleteAt(index) {
    if (Math.abs(index) > this.data.size) {
      throw new ReferenceError("Can not delete an element outside the bounds of the list");
    }
    this.delete(Array.from(this.data).at(index));
  }
  insert(value, index = this.data.size) {
    this._set(index, value, false);
  }
  at(index) {
    if (Math.abs(index) > this.data.size) {
      throw new ReferenceError("Can not access an element outside the bounds of the list");
    }
    return Array.from(this.data).at(index);
  }
  pop() {
    const item = Array.from(this.data).pop();
    if (item !== undefined) {
      this.delete(item);
    }
    return item;
  }
  push(...items) {
    for (const item of items) {
      this.add(item);
    }
    return this.data.size;
  }
  join(separator) {
    return Array.from(this.data).join(separator);
  }
  splice(start, deleteCount, ...items) {
    if (Math.abs(start) > this.data.size) {
      throw new ReferenceError("Can not splice elements outside the bounds of the list");
    }
    const data = Array.from(this.data);
    const deleted = data.splice(start, deleteCount, ...items);
    this.data = new Set(data);
    this.emit("update");
    return deleted;
  }
  add(value) {
    this.data.add(value);
    this.emit("update");
    this.emit("add", value);
    return this;
  }
  clear() {
    this.data.clear();
    this.emit("update");
  }
  delete(value) {
    const success = this.data.delete(value);
    this.emit("update");
    return success;
  }
  has(value) {
    return this.data.has(value);
  }
  get size() {
    return this.data.size;
  }
  entries() {
    return this.toArray().entries();
  }
  keys() {
    return this.toArray().keys();
  }
  values() {
    return this.data.values();
  }
  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }
}
// node_modules/utilium/dist/misc.js
function canary(error = new Error) {
  const timeout = setTimeout(() => {
    throw error;
  }, 5000);
  return () => clearTimeout(timeout);
}
function _throw(e) {
  throw e;
}
// node_modules/utilium/dist/numbers.js
var __formatter = Intl.NumberFormat("en", { notation: "compact" });
var formatCompact = __formatter.format.bind(__formatter);
// node_modules/utilium/dist/objects.js
function pick(object, ...keys) {
  const picked = {};
  for (const key of keys.flat()) {
    picked[key] = object[key];
  }
  return picked;
}
function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
function* getAllPrototypes(object) {
  for (let prototype = object;prototype; prototype = Object.getPrototypeOf(prototype)) {
    yield prototype;
  }
}
// node_modules/utilium/dist/random.js
function randomInt(min = 0, max = 1) {
  return Math.round(Math.random() * (max - min) + min);
}
// node_modules/utilium/dist/string.js
function capitalize(value) {
  return value.at(0).toUpperCase() + value.slice(1);
}
// node_modules/utilium/dist/internal/primitives.js
var types = [
  "int8",
  "uint8",
  "int16",
  "uint16",
  "int32",
  "uint32",
  "int64",
  "uint64",
  "int128",
  "uint128",
  "float32",
  "float64",
  "float128"
];
var valids = [...types, ...types.map((t) => capitalize(t)), "char"];
var regex = /^(u?int|float)(8|16|32|64|128)$/i;
function normalize(type) {
  return type == "char" ? "uint8" : type.toLowerCase();
}
function isType(type) {
  return regex.test(type.toString());
}
function isValid(type) {
  return type == "char" || regex.test(type.toString().toLowerCase());
}
function checkValid(type) {
  if (!isValid(type)) {
    throw new TypeError("Not a valid primitive type: " + type);
  }
}
var mask64 = BigInt("0xffffffffffffffff");

// node_modules/utilium/dist/internal/struct.js
Symbol.struct_init ||= Symbol("struct_init");
Symbol.struct_metadata ||= Symbol("struct_metadata");
var init = Symbol.struct_init;
var metadata = Symbol.struct_metadata;
function isValidMetadata(arg) {
  return arg != null && typeof arg == "object" && Symbol.struct_metadata in arg;
}
Symbol.metadata ??= Symbol.for("Symbol.metadata");
function _polyfill_contextMetadata(target) {
  if (!Symbol?.metadata) {
    return;
  }
  if (Symbol.metadata in target) {
    return;
  }
  Object.defineProperty(target, Symbol.metadata, {
    enumerable: true,
    configurable: true,
    writable: true,
    value: Object.create(null)
  });
}
function symbol_metadata(arg) {
  const symbol_metadata2 = Symbol.metadata || Object.getOwnPropertySymbols(arg).find((s) => s.description == "Symbol.metadata");
  _polyfill_contextMetadata(arg);
  if (!symbol_metadata2) {
    throw new ReferenceError("Could not get a reference to Symbol.metadata");
  }
  return symbol_metadata2;
}
function isStatic(arg) {
  return typeof arg == "function" && symbol_metadata(arg) in arg && isValidMetadata(arg[symbol_metadata(arg)]);
}
function isInstance(arg) {
  return arg != null && typeof arg == "object" && isStatic(arg.constructor);
}
function checkInstance(arg) {
  if (!isInstance(arg)) {
    throw new TypeError((typeof arg == "function" ? arg.name : typeof arg == "object" && arg ? arg.constructor.name : arg) + " is not a struct instance");
  }
}
function isStruct(arg) {
  return isInstance(arg) || isStatic(arg);
}
function checkStruct(arg) {
  if (!isStruct(arg)) {
    throw new TypeError((typeof arg == "function" ? arg.name : typeof arg == "object" && arg ? arg.constructor.name : arg) + " is not a struct");
  }
}

// node_modules/utilium/dist/struct.js
function sizeof(type) {
  if (typeof type == "string") {
    checkValid(type);
    return +normalize(type).match(regex)[2] / 8;
  }
  checkStruct(type);
  const struct = isStatic(type) ? type : type.constructor;
  return struct[symbol_metadata(struct)][Symbol.struct_metadata].size;
}
function offsetof(type, memberName) {
  checkStruct(type);
  const struct = isStatic(type) ? type : type.constructor;
  const metadata2 = struct[symbol_metadata(struct)][Symbol.struct_metadata];
  const member = metadata2.members.get(memberName);
  if (!member)
    throw new Error("Struct does not have member: " + memberName);
  return member.offset;
}
function align(value, alignment) {
  return Math.ceil(value / alignment) * alignment;
}
function struct(options = {}) {
  return function _decorateStruct(target, context) {
    context.metadata ??= {};
    context.metadata[Symbol.struct_init] ||= [];
    let size = 0;
    const members = new Map;
    for (const _ of context.metadata[Symbol.struct_init]) {
      const { name, type, length } = _;
      if (!isValid(type) && !isStatic(type)) {
        throw new TypeError("Not a valid type: " + type);
      }
      members.set(name, {
        offset: options.isUnion ? 0 : size,
        type: isValid(type) ? normalize(type) : type,
        length
      });
      const memberSize = sizeof(type) * (length || 1);
      size = options.isUnion ? Math.max(size, memberSize) : size + memberSize;
      size = align(size, options.align || 1);
    }
    context.metadata[Symbol.struct_metadata] = { options, members, size };
    return target;
  };
}
function member(type, length) {
  return function(value, context) {
    let name = context.name;
    if (typeof name == "symbol") {
      console.warn("Symbol used for struct member name will be coerced to string: " + name.toString());
      name = name.toString();
    }
    if (!name) {
      throw new ReferenceError("Invalid name for struct member");
    }
    context.metadata ??= {};
    context.metadata[Symbol.struct_init] ||= [];
    context.metadata[Symbol.struct_init].push({ name, type, length });
    return value;
  };
}
function serialize(instance) {
  checkInstance(instance);
  const { options, members } = instance.constructor[symbol_metadata(instance.constructor)][Symbol.struct_metadata];
  const buffer = new Uint8Array(sizeof(instance));
  const view = new DataView(buffer.buffer);
  for (const [name, { type, length, offset }] of members) {
    for (let i = 0;i < (length || 1); i++) {
      const iOff = offset + sizeof(type) * i;
      let value = length > 0 ? instance[name][i] : instance[name];
      if (typeof value == "string") {
        value = value.charCodeAt(0);
      }
      if (!isType(type)) {
        buffer.set(value ? serialize(value) : new Uint8Array(sizeof(type)), iOff);
        continue;
      }
      const fn = `set${capitalize(type)}`;
      if (fn == "setInt64") {
        view.setBigInt64(iOff, BigInt(value), !options.bigEndian);
        continue;
      }
      if (fn == "setUint64") {
        view.setBigUint64(iOff, BigInt(value), !options.bigEndian);
        continue;
      }
      if (fn == "setInt128") {
        view.setBigUint64(iOff + (!options.bigEndian ? 0 : 8), value & mask64, !options.bigEndian);
        view.setBigInt64(iOff + (!options.bigEndian ? 8 : 0), value >> BigInt(64), !options.bigEndian);
        continue;
      }
      if (fn == "setUint128") {
        view.setBigUint64(iOff + (!options.bigEndian ? 0 : 8), value & mask64, !options.bigEndian);
        view.setBigUint64(iOff + (!options.bigEndian ? 8 : 0), value >> BigInt(64), !options.bigEndian);
        continue;
      }
      if (fn == "setFloat128") {
        view.setFloat64(iOff + (!options.bigEndian ? 0 : 8), Number(value), !options.bigEndian);
        view.setBigUint64(iOff + (!options.bigEndian ? 8 : 0), BigInt(0), !options.bigEndian);
        continue;
      }
      view[fn](iOff, Number(value), !options.bigEndian);
    }
  }
  return buffer;
}
function deserialize(instance, _buffer) {
  checkInstance(instance);
  const { options, members } = instance.constructor[symbol_metadata(instance.constructor)][Symbol.struct_metadata];
  const buffer = _buffer instanceof Uint8Array ? _buffer : new Uint8Array("buffer" in _buffer ? _buffer.buffer : _buffer);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  for (const [name, { type, offset, length }] of members) {
    for (let i = 0;i < (length || 1); i++) {
      let object = length > 0 ? instance[name] : instance;
      const key = length > 0 ? i : name, iOff = offset + sizeof(type) * i;
      if (typeof instance[name] == "string") {
        instance[name] = instance[name].slice(0, i) + String.fromCharCode(view.getUint8(iOff)) + instance[name].slice(i + 1);
        continue;
      }
      if (!isType(type)) {
        if (object[key] === null || object[key] === undefined) {
          continue;
        }
        deserialize(object[key], new Uint8Array(buffer.slice(iOff, iOff + sizeof(type))));
        continue;
      }
      if (length > 0) {
        object ||= [];
      }
      const fn = `get${capitalize(type)}`;
      if (fn == "getInt64") {
        object[key] = view.getBigInt64(iOff, !options.bigEndian);
        continue;
      }
      if (fn == "getUint64") {
        object[key] = view.getBigUint64(iOff, !options.bigEndian);
        continue;
      }
      if (fn == "getInt128") {
        object[key] = view.getBigInt64(iOff + (!options.bigEndian ? 8 : 0), !options.bigEndian) << BigInt(64) | view.getBigUint64(iOff + (!options.bigEndian ? 0 : 8), !options.bigEndian);
        continue;
      }
      if (fn == "getUint128") {
        object[key] = view.getBigUint64(iOff + (!options.bigEndian ? 8 : 0), !options.bigEndian) << BigInt(64) | view.getBigUint64(iOff + (!options.bigEndian ? 0 : 8), !options.bigEndian);
        continue;
      }
      if (fn == "getFloat128") {
        object[key] = view.getFloat64(iOff + (!options.bigEndian ? 0 : 8), !options.bigEndian);
        continue;
      }
      object[key] = view[fn](iOff, !options.bigEndian);
    }
  }
}
function _member(type) {
  function _structMemberDecorator(valueOrLength, context) {
    if (typeof valueOrLength == "number") {
      return member(type, valueOrLength);
    }
    return member(type)(valueOrLength, context);
  }
  return _structMemberDecorator;
}
var types2 = Object.fromEntries(valids.map((t) => [t, _member(t)]));
// node_modules/@zenfs/core/dist/vfs/path.js
var cwd = "/";
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = "\x00";
  for (let i = 0;i <= path.length; ++i) {
    if (i < path.length) {
      char = path[i];
    } else if (char == "/") {
      break;
    } else {
      char = "/";
    }
    if (char == "/") {
      if (lastSlash === i - 1 || dots === 1) {
      } else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.at(-1) !== "." || res.at(-2) !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += "/" + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function resolve(...parts) {
  let resolved = "";
  for (const part of [...parts.reverse(), cwd]) {
    if (!part.length) {
      continue;
    }
    resolved = `${part}/${resolved}`;
    if (part.startsWith("/")) {
      break;
    }
  }
  const absolute = resolved.startsWith("/");
  resolved = normalizeString(resolved, !absolute);
  if (absolute) {
    return `/${resolved}`;
  }
  return resolved.length ? resolved : "/";
}
function normalize2(path) {
  if (!path.length)
    return ".";
  const isAbsolute = path.startsWith("/");
  const trailingSeparator = path.endsWith("/");
  path = normalizeString(path, !isAbsolute);
  if (!path.length) {
    if (isAbsolute)
      return "/";
    return trailingSeparator ? "./" : ".";
  }
  if (trailingSeparator)
    path += "/";
  return isAbsolute ? `/${path}` : path;
}
function join(...parts) {
  if (!parts.length)
    return ".";
  const joined = parts.join("/");
  if (!(joined === null || joined === undefined ? undefined : joined.length))
    return ".";
  return normalize2(joined);
}
function relative(from, to) {
  if (from === to)
    return "";
  from = resolve(from);
  to = resolve(to);
  if (from === to)
    return "";
  const fromStart = 1;
  const fromEnd = from.length;
  const fromLen = fromEnd - fromStart;
  const toStart = 1;
  const toLen = to.length - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for (;i < length; i++) {
    const fromCode = from[fromStart + i];
    if (fromCode !== to[toStart + i])
      break;
    else if (fromCode === "/")
      lastCommonSep = i;
  }
  if (i === length) {
    if (toLen > length) {
      if (to[toStart + i] === "/") {
        return to.slice(toStart + i + 1);
      }
      if (i === 0) {
        return to.slice(toStart + i);
      }
    } else if (fromLen > length) {
      if (from[fromStart + i] === "/") {
        lastCommonSep = i;
      } else if (i === 0) {
        lastCommonSep = 0;
      }
    }
  }
  let out = "";
  for (i = fromStart + lastCommonSep + 1;i <= fromEnd; ++i) {
    if (i === fromEnd || from[i] === "/") {
      out += out.length === 0 ? ".." : "/..";
    }
  }
  return `${out}${to.slice(toStart + lastCommonSep)}`;
}
function dirname(path) {
  if (path.length === 0)
    return ".";
  const hasRoot = path[0] === "/";
  let end = -1;
  let matchedSlash = true;
  for (let i = path.length - 1;i >= 1; --i) {
    if (path[i] === "/") {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }
  if (end === -1)
    return hasRoot ? "/" : ".";
  if (hasRoot && end === 1)
    return "//";
  return path.slice(0, end);
}
function basename(path, suffix) {
  let start = 0;
  let end = -1;
  let matchedSlash = true;
  if (suffix !== undefined && suffix.length > 0 && suffix.length <= path.length) {
    if (suffix === path)
      return "";
    let extIdx = suffix.length - 1;
    let firstNonSlashEnd = -1;
    for (let i = path.length - 1;i >= 0; --i) {
      if (path[i] === "/") {
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1) {
          matchedSlash = false;
          firstNonSlashEnd = i + 1;
        }
        if (extIdx >= 0) {
          if (path[i] === suffix[extIdx]) {
            if (--extIdx === -1) {
              end = i;
            }
          } else {
            extIdx = -1;
            end = firstNonSlashEnd;
          }
        }
      }
    }
    if (start === end)
      end = firstNonSlashEnd;
    else if (end === -1)
      end = path.length;
    return path.slice(start, end);
  }
  for (let i = path.length - 1;i >= 0; --i) {
    if (path[i] === "/") {
      if (!matchedSlash) {
        start = i + 1;
        break;
      }
    } else if (end === -1) {
      matchedSlash = false;
      end = i + 1;
    }
  }
  if (end === -1)
    return "";
  return path.slice(start, end);
}
function parse2(path) {
  const isAbsolute = path.startsWith("/");
  const ret = { root: isAbsolute ? "/" : "", dir: "", base: "", ext: "", name: "" };
  if (path.length === 0)
    return ret;
  const start = isAbsolute ? 1 : 0;
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let i = path.length - 1;
  let preDotState = 0;
  for (;i >= start; --i) {
    if (path[i] === "/") {
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i + 1;
    }
    if (path[i] === ".") {
      if (startDot === -1)
        startDot = i;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (end !== -1) {
    const start2 = startPart === 0 && isAbsolute ? 1 : startPart;
    if (startDot === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      ret.base = ret.name = path.slice(start2, end);
    } else {
      ret.name = path.slice(start2, startDot);
      ret.base = path.slice(start2, end);
      ret.ext = path.slice(startDot, end);
    }
  }
  if (startPart > 0)
    ret.dir = path.slice(0, startPart - 1);
  else if (isAbsolute)
    ret.dir = "/";
  return ret;
}

// node_modules/@zenfs/core/dist/internal/log.js
var Level;
(function(Level2) {
  Level2[Level2["EMERG"] = 0] = "EMERG";
  Level2[Level2["ALERT"] = 1] = "ALERT";
  Level2[Level2["CRIT"] = 2] = "CRIT";
  Level2[Level2["ERR"] = 3] = "ERR";
  Level2[Level2["WARN"] = 4] = "WARN";
  Level2[Level2["NOTICE"] = 5] = "NOTICE";
  Level2[Level2["INFO"] = 6] = "INFO";
  Level2[Level2["DEBUG"] = 7] = "DEBUG";
})(Level || (Level = {}));
var levels = {
  [Level.EMERG]: "emergency",
  [Level.ALERT]: "alert",
  [Level.CRIT]: "critical",
  [Level.ERR]: "error",
  [Level.WARN]: "warning",
  [Level.NOTICE]: "notice",
  [Level.INFO]: "info",
  [Level.DEBUG]: "debug"
};
function levelOf(value) {
  return Object.values(levels).indexOf(value);
}
var entries = new List;
function log(level, message) {
  if (!isEnabled)
    return;
  const entry = {
    level,
    message,
    timestamp: new Date,
    elapsedMs: performance.now()
  };
  entries.add(entry);
  output(entry);
}
function _messageString(msg, options) {
  var _a, _b;
  if (!(msg instanceof ErrnoError))
    return msg.toString();
  const beforePath = msg.code + ": " + msg.message;
  if (!msg.path)
    return beforePath;
  const mountPoint = typeof options.fs == "string" ? options.fs : (_b = (_a = options.fs) === null || _a === undefined ? undefined : _a._mountPoint) !== null && _b !== undefined ? _b : "<unknown>";
  return beforePath + ": " + join(mountPoint, msg.path);
}
function _shortcut(level) {
  return function(message, options = {}) {
    log(level, _messageString(message, options));
    return message;
  };
}
var emerg = _shortcut(Level.EMERG);
var alert = _shortcut(Level.ALERT);
var crit = _shortcut(Level.CRIT);
var err = _shortcut(Level.ERR);
var warn = _shortcut(Level.WARN);
var notice = _shortcut(Level.NOTICE);
var info = _shortcut(Level.INFO);
var debug = _shortcut(Level.DEBUG);
function log_deprecated(symbol) {
  log(Level.WARN, symbol + " is deprecated and should not be used.");
}
function ansi(text, format) {
  return `\x1B[${format}m${text}\x1B[0m`;
}
function _prettyMs(entry, style) {
  const text = "[" + (entry.elapsedMs / 1000).toFixed(3).padStart(10) + "] ";
  switch (style) {
    case "ansi":
      return ansi(text, "2;37");
    case "css":
      return ["%c" + text, "opacity: 0.8; color: white;"];
    default:
      return text;
  }
}
var _ansiLevelColor = {
  [Level.EMERG]: "1;4;37;41",
  [Level.ALERT]: "1;37;41",
  [Level.CRIT]: "1;35",
  [Level.ERR]: "1;31",
  [Level.WARN]: "1;33",
  [Level.NOTICE]: "1;36",
  [Level.INFO]: "1;37",
  [Level.DEBUG]: "0;2;37"
};
var _ansiMessageColor = {
  [Level.EMERG]: "1;31",
  [Level.ALERT]: "1;31",
  [Level.CRIT]: "1;31",
  [Level.ERR]: "31",
  [Level.WARN]: "33",
  [Level.NOTICE]: "1;37",
  [Level.INFO]: "37",
  [Level.DEBUG]: "2;37"
};
var _cssLevelColor = {
  [Level.EMERG]: "font-weight: bold; text-decoration: underline; color: white; background-color: red;",
  [Level.ALERT]: "font-weight: bold; color: white; background-color: red;",
  [Level.CRIT]: "font-weight: bold; color: magenta;",
  [Level.ERR]: "font-weight: bold; color: red;",
  [Level.WARN]: "font-weight: bold; color: yellow;",
  [Level.NOTICE]: "font-weight: bold; color: cyan;",
  [Level.INFO]: "font-weight: bold; color: white;",
  [Level.DEBUG]: "opacity: 0.8; color: white;"
};
var _cssMessageColor = {
  [Level.EMERG]: "font-weight: bold; color: red;",
  [Level.ALERT]: "font-weight: bold; color: red;",
  [Level.CRIT]: "font-weight: bold; color: red;",
  [Level.ERR]: "color: red;",
  [Level.WARN]: "color: yellow;",
  [Level.NOTICE]: "font-weight: bold; color: white;",
  [Level.INFO]: "color: white;",
  [Level.DEBUG]: "opacity: 0.8; color: white;"
};
var formats = {
  ansi_level(entry) {
    const levelText = ansi(levels[entry.level].toUpperCase(), _ansiLevelColor[entry.level]);
    return [_prettyMs(entry, "ansi"), levelText, entry.message];
  },
  ansi_message(entry) {
    let msg = _prettyMs(entry, "ansi");
    const isImportant = entry.level < Level.CRIT;
    if (isImportant)
      msg += ansi(levels[entry.level].toUpperCase(), _ansiLevelColor[entry.level]) + ": ";
    msg += ansi(entry.message, _ansiMessageColor[entry.level]);
    return msg;
  },
  css_level(entry) {
    const levelLabel = levels[entry.level].toUpperCase();
    return [..._prettyMs(entry, "css"), "%c" + levelLabel, _cssLevelColor[entry.level], entry.message];
  },
  css_message(entry) {
    const text = _prettyMs(entry, "css");
    const isImportant = entry.level < Level.CRIT;
    if (isImportant) {
      const levelLabel = levels[entry.level].toUpperCase();
      text.push("%c" + levelLabel, _cssLevelColor[entry.level]);
    }
    text.push("%c" + entry.message, _cssMessageColor[entry.level]);
    return text;
  },
  default(entry) {
    return [_prettyMs(entry), entry.message];
  }
};
var _format = formats.default;
function format(entry) {
  const formatted = _format(entry);
  return Array.isArray(formatted) ? formatted : [formatted];
}
var _output = console.error;
function output(entry) {
  if (entry.level > minLevel)
    return;
  _output(...format(entry));
}
var minLevel = Level.ALERT;
var isEnabled = true;
function configure(options) {
  var _a, _b, _c, _d;
  _format = (_a = options.format) !== null && _a !== undefined ? _a : _format;
  _output = (_b = options.output) !== null && _b !== undefined ? _b : _output;
  minLevel = typeof options.level == "string" ? levelOf(options.level) : (_c = options.level) !== null && _c !== undefined ? _c : minLevel;
  isEnabled = (_d = options.enabled) !== null && _d !== undefined ? _d : isEnabled;
  if (!options.dumpBacklog)
    return;
  for (const entry of entries) {
    output(entry);
  }
}

// node_modules/@zenfs/core/dist/backends/backend.js
function isBackend(arg) {
  return arg != null && typeof arg == "object" && "create" in arg && typeof arg.create == "function";
}
async function checkOptions(backend, options) {
  if (typeof options != "object" || options === null) {
    throw err(new ErrnoError(Errno.EINVAL, "Invalid options"));
  }
  for (const [optName, opt] of Object.entries(backend.options)) {
    const value = options === null || options === undefined ? undefined : options[optName];
    if (value === undefined || value === null) {
      if (!opt.required) {
        debug("Missing non-required option: " + optName);
        continue;
      }
      throw err(new ErrnoError(Errno.EINVAL, "Missing required option: " + optName));
    }
    const isType2 = (type, _ = value) => typeof type == "function" ? value instanceof type : typeof value === type;
    if (Array.isArray(opt.type) ? !opt.type.some((v) => isType2(v)) : !isType2(opt.type)) {
      const type = typeof value == "object" && "constructor" in value ? value.constructor.name : typeof value;
      const name = (type2) => typeof type2 == "function" ? type2.name : type2;
      const expected = Array.isArray(opt.type) ? `one of ${opt.type.map(name).join(", ")}` : name(opt.type);
      throw err(new ErrnoError(Errno.EINVAL, `Incorrect type for "${optName}": ${type} (expected ${expected})`));
    }
    debug("Using custom validator for option: " + optName);
    if (opt.validator)
      await opt.validator(value);
  }
}
function isBackendConfig(arg) {
  return arg != null && typeof arg == "object" && "backend" in arg && isBackend(arg.backend);
}
// node_modules/utilium/dist/buffer.js
function extendBuffer(buffer, newByteLength) {
  if (buffer.byteLength >= newByteLength)
    return buffer;
  if (ArrayBuffer.isView(buffer)) {
    const newBuffer = extendBuffer(buffer.buffer, newByteLength);
    return new buffer.constructor(newBuffer, buffer.byteOffset, newByteLength);
  }
  const isShared = typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
  if (buffer.maxByteLength > newByteLength) {
    isShared ? buffer.grow(newByteLength) : buffer.resize(newByteLength);
    return buffer;
  }
  if (isShared) {
    const newBuffer = new SharedArrayBuffer(newByteLength);
    new Uint8Array(newBuffer).set(new Uint8Array(buffer));
    return newBuffer;
  }
  try {
    return buffer.transfer(newByteLength);
  } catch {
    const newBuffer = new ArrayBuffer(newByteLength);
    new Uint8Array(newBuffer).set(new Uint8Array(buffer));
    return newBuffer;
  }
}

// node_modules/@zenfs/core/dist/internal/credentials.js
var credentials = {
  uid: 0,
  gid: 0,
  suid: 0,
  sgid: 0,
  euid: 0,
  egid: 0,
  groups: []
};
function createCredentials(source) {
  return {
    suid: source.uid,
    sgid: source.gid,
    euid: source.uid,
    egid: source.gid,
    groups: [],
    ...source
  };
}
function useCredentials(source) {
  Object.assign(credentials, createCredentials(source));
}

// node_modules/@zenfs/core/dist/vfs/constants.js
var exports_constants = {};
__export(exports_constants, {
  size_max: () => size_max,
  X_OK: () => X_OK,
  W_OK: () => W_OK,
  UV_FS_O_FILEMAP: () => UV_FS_O_FILEMAP,
  S_IXUSR: () => S_IXUSR,
  S_IXOTH: () => S_IXOTH,
  S_IXGRP: () => S_IXGRP,
  S_IWUSR: () => S_IWUSR,
  S_IWOTH: () => S_IWOTH,
  S_IWGRP: () => S_IWGRP,
  S_ISVTX: () => S_ISVTX,
  S_ISUID: () => S_ISUID,
  S_ISGID: () => S_ISGID,
  S_IRWXU: () => S_IRWXU,
  S_IRWXO: () => S_IRWXO,
  S_IRWXG: () => S_IRWXG,
  S_IRUSR: () => S_IRUSR,
  S_IROTH: () => S_IROTH,
  S_IRGRP: () => S_IRGRP,
  S_IFSOCK: () => S_IFSOCK,
  S_IFREG: () => S_IFREG,
  S_IFMT: () => S_IFMT,
  S_IFLNK: () => S_IFLNK,
  S_IFIFO: () => S_IFIFO,
  S_IFDIR: () => S_IFDIR,
  S_IFCHR: () => S_IFCHR,
  S_IFBLK: () => S_IFBLK,
  R_OK: () => R_OK,
  O_WRONLY: () => O_WRONLY,
  O_TRUNC: () => O_TRUNC,
  O_SYNC: () => O_SYNC,
  O_SYMLINK: () => O_SYMLINK,
  O_RDWR: () => O_RDWR,
  O_RDONLY: () => O_RDONLY,
  O_NONBLOCK: () => O_NONBLOCK,
  O_NOFOLLOW: () => O_NOFOLLOW,
  O_NOCTTY: () => O_NOCTTY,
  O_NOATIME: () => O_NOATIME,
  O_EXCL: () => O_EXCL,
  O_DSYNC: () => O_DSYNC,
  O_DIRECTORY: () => O_DIRECTORY,
  O_DIRECT: () => O_DIRECT,
  O_CREAT: () => O_CREAT,
  O_APPEND: () => O_APPEND,
  F_OK: () => F_OK,
  COPYFILE_FICLONE_FORCE: () => COPYFILE_FICLONE_FORCE,
  COPYFILE_FICLONE: () => COPYFILE_FICLONE,
  COPYFILE_EXCL: () => COPYFILE_EXCL
});
var F_OK = 0;
var R_OK = 4;
var W_OK = 2;
var X_OK = 1;
var COPYFILE_EXCL = 1;
var COPYFILE_FICLONE = 2;
var COPYFILE_FICLONE_FORCE = 4;
var O_RDONLY = 0;
var O_WRONLY = 1;
var O_RDWR = 2;
var O_CREAT = 64;
var O_EXCL = 128;
var O_NOCTTY = 256;
var O_TRUNC = 512;
var O_APPEND = 1024;
var O_DIRECTORY = 65536;
var O_NOATIME = 262144;
var O_NOFOLLOW = 131072;
var O_SYNC = 1052672;
var O_DSYNC = 4096;
var O_SYMLINK = 32768;
var O_DIRECT = 16384;
var O_NONBLOCK = 2048;
var S_IFMT = 61440;
var S_IFSOCK = 49152;
var S_IFLNK = 40960;
var S_IFREG = 32768;
var S_IFBLK = 24576;
var S_IFDIR = 16384;
var S_IFCHR = 8192;
var S_IFIFO = 4096;
var S_ISUID = 2048;
var S_ISGID = 1024;
var S_ISVTX = 512;
var S_IRWXU = 448;
var S_IRUSR = 256;
var S_IWUSR = 128;
var S_IXUSR = 64;
var S_IRWXG = 56;
var S_IRGRP = 32;
var S_IWGRP = 16;
var S_IXGRP = 8;
var S_IRWXO = 7;
var S_IROTH = 4;
var S_IWOTH = 2;
var S_IXOTH = 1;
var UV_FS_O_FILEMAP = 0;
var size_max = 4294967295;

// node_modules/@zenfs/core/dist/internal/inode.js
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== undefined && typeof f !== "function")
      throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1;i >= 0; i--) {
    var context = {};
    for (var p in contextIn)
      context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access)
      context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done)
        throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === undefined)
        continue;
      if (result === null || typeof result !== "object")
        throw new TypeError("Object expected");
      if (_ = accept(result.get))
        descriptor.get = _;
      if (_ = accept(result.set))
        descriptor.set = _;
      if (_ = accept(result.init))
        initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field")
        initializers.unshift(_);
      else
        descriptor[key] = _;
    }
  }
  if (target)
    Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __runInitializers = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0;i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : undefined;
};
var __setFunctionName = function(f, name, prefix) {
  if (typeof name === "symbol")
    name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var rootIno = 0;
var _inode_fields = ["ino", "data", "size", "mode", "flags", "nlink", "uid", "gid", "atimeMs", "birthtimeMs", "mtimeMs", "ctimeMs"];
var _inode_version = 3;
var Inode = (() => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
  let _classDecorators = [struct()];
  let _classDescriptor;
  let _classExtraInitializers = [];
  let _classThis;
  let _data_decorators;
  let _data_initializers = [];
  let _data_extraInitializers = [];
  let ___data_old_decorators;
  let ___data_old_initializers = [];
  let ___data_old_extraInitializers = [];
  let _size_decorators;
  let _size_initializers = [];
  let _size_extraInitializers = [];
  let _mode_decorators;
  let _mode_initializers = [];
  let _mode_extraInitializers = [];
  let _nlink_decorators;
  let _nlink_initializers = [];
  let _nlink_extraInitializers = [];
  let _uid_decorators;
  let _uid_initializers = [];
  let _uid_extraInitializers = [];
  let _gid_decorators;
  let _gid_initializers = [];
  let _gid_extraInitializers = [];
  let _atimeMs_decorators;
  let _atimeMs_initializers = [];
  let _atimeMs_extraInitializers = [];
  let _birthtimeMs_decorators;
  let _birthtimeMs_initializers = [];
  let _birthtimeMs_extraInitializers = [];
  let _mtimeMs_decorators;
  let _mtimeMs_initializers = [];
  let _mtimeMs_extraInitializers = [];
  let _ctimeMs_decorators;
  let _ctimeMs_initializers = [];
  let _ctimeMs_extraInitializers = [];
  let _ino_decorators;
  let _ino_initializers = [];
  let _ino_extraInitializers = [];
  let ___ino_old_decorators;
  let ___ino_old_initializers = [];
  let ___ino_old_extraInitializers = [];
  let _flags_decorators;
  let _flags_initializers = [];
  let _flags_extraInitializers = [];
  let ___padding_decorators;
  let ___padding_initializers = [];
  let ___padding_extraInitializers = [];
  var Inode2 = _classThis = class {
    constructor(data) {
      this.data = __runInitializers(this, _data_initializers, randomInt(0, size_max));
      this.__data_old = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, ___data_old_initializers, 0));
      this.size = (__runInitializers(this, ___data_old_extraInitializers), __runInitializers(this, _size_initializers, 0));
      this.mode = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _mode_initializers, 0));
      this.nlink = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _nlink_initializers, 1));
      this.uid = (__runInitializers(this, _nlink_extraInitializers), __runInitializers(this, _uid_initializers, 0));
      this.gid = (__runInitializers(this, _uid_extraInitializers), __runInitializers(this, _gid_initializers, 0));
      this.atimeMs = (__runInitializers(this, _gid_extraInitializers), __runInitializers(this, _atimeMs_initializers, Date.now()));
      this.birthtimeMs = (__runInitializers(this, _atimeMs_extraInitializers), __runInitializers(this, _birthtimeMs_initializers, Date.now()));
      this.mtimeMs = (__runInitializers(this, _birthtimeMs_extraInitializers), __runInitializers(this, _mtimeMs_initializers, Date.now()));
      this.ctimeMs = (__runInitializers(this, _mtimeMs_extraInitializers), __runInitializers(this, _ctimeMs_initializers, Date.now()));
      this.ino = (__runInitializers(this, _ctimeMs_extraInitializers), __runInitializers(this, _ino_initializers, randomInt(0, size_max)));
      this.__ino_old = (__runInitializers(this, _ino_extraInitializers), __runInitializers(this, ___ino_old_initializers, 0));
      this.flags = (__runInitializers(this, ___ino_old_extraInitializers), __runInitializers(this, _flags_initializers, 0));
      this.__padding = (__runInitializers(this, _flags_extraInitializers), __runInitializers(this, ___padding_initializers, 0));
      __runInitializers(this, ___padding_extraInitializers);
      if (!data)
        return;
      if (!("byteLength" in data)) {
        Object.assign(this, data);
        return;
      }
      if (data.byteLength < 58) {
        throw crit(new RangeError("Can not create an inode from a buffer less than 58 bytes"));
      }
      if (data.byteLength < __inode_sz) {
        const buf = ArrayBuffer.isView(data) ? data.buffer : data;
        const newBuffer = new Uint8Array(__inode_sz);
        newBuffer.set(new Uint8Array(buf));
        debug("Extending undersized buffer for inode");
        data = newBuffer;
      }
      deserialize(this, data);
    }
    toString() {
      return `<Inode ${this.ino}>`;
    }
    toJSON() {
      return pick(this, _inode_fields);
    }
    toStats() {
      return new Stats(this);
    }
    update(data) {
      if (!data)
        return false;
      let hasChanged = false;
      for (const key of _inode_fields) {
        if (data[key] === undefined)
          continue;
        if (key == "ino" || key == "data")
          continue;
        if (this[key] === data[key])
          continue;
        this[key] = data[key];
        hasChanged = true;
      }
      return hasChanged;
    }
  };
  __setFunctionName(_classThis, "Inode");
  (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : undefined;
    _data_decorators = [(_a = types2).uint32.bind(_a)];
    ___data_old_decorators = [(_b = types2).uint32.bind(_b)];
    _size_decorators = [(_c = types2).uint32.bind(_c)];
    _mode_decorators = [(_d = types2).uint16.bind(_d)];
    _nlink_decorators = [(_e = types2).uint32.bind(_e)];
    _uid_decorators = [(_f = types2).uint32.bind(_f)];
    _gid_decorators = [(_g = types2).uint32.bind(_g)];
    _atimeMs_decorators = [(_h = types2).float64.bind(_h)];
    _birthtimeMs_decorators = [(_j = types2).float64.bind(_j)];
    _mtimeMs_decorators = [(_k = types2).float64.bind(_k)];
    _ctimeMs_decorators = [(_l = types2).float64.bind(_l)];
    _ino_decorators = [(_m = types2).uint32.bind(_m)];
    ___ino_old_decorators = [(_o = types2).uint32.bind(_o)];
    _flags_decorators = [(_p = types2).uint32.bind(_p)];
    ___padding_decorators = [(_q = types2).uint16.bind(_q)];
    __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: (obj) => ("data" in obj), get: (obj) => obj.data, set: (obj, value) => {
      obj.data = value;
    } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
    __esDecorate(null, null, ___data_old_decorators, { kind: "field", name: "__data_old", static: false, private: false, access: { has: (obj) => ("__data_old" in obj), get: (obj) => obj.__data_old, set: (obj, value) => {
      obj.__data_old = value;
    } }, metadata: _metadata }, ___data_old_initializers, ___data_old_extraInitializers);
    __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: (obj) => ("size" in obj), get: (obj) => obj.size, set: (obj, value) => {
      obj.size = value;
    } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
    __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: (obj) => ("mode" in obj), get: (obj) => obj.mode, set: (obj, value) => {
      obj.mode = value;
    } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
    __esDecorate(null, null, _nlink_decorators, { kind: "field", name: "nlink", static: false, private: false, access: { has: (obj) => ("nlink" in obj), get: (obj) => obj.nlink, set: (obj, value) => {
      obj.nlink = value;
    } }, metadata: _metadata }, _nlink_initializers, _nlink_extraInitializers);
    __esDecorate(null, null, _uid_decorators, { kind: "field", name: "uid", static: false, private: false, access: { has: (obj) => ("uid" in obj), get: (obj) => obj.uid, set: (obj, value) => {
      obj.uid = value;
    } }, metadata: _metadata }, _uid_initializers, _uid_extraInitializers);
    __esDecorate(null, null, _gid_decorators, { kind: "field", name: "gid", static: false, private: false, access: { has: (obj) => ("gid" in obj), get: (obj) => obj.gid, set: (obj, value) => {
      obj.gid = value;
    } }, metadata: _metadata }, _gid_initializers, _gid_extraInitializers);
    __esDecorate(null, null, _atimeMs_decorators, { kind: "field", name: "atimeMs", static: false, private: false, access: { has: (obj) => ("atimeMs" in obj), get: (obj) => obj.atimeMs, set: (obj, value) => {
      obj.atimeMs = value;
    } }, metadata: _metadata }, _atimeMs_initializers, _atimeMs_extraInitializers);
    __esDecorate(null, null, _birthtimeMs_decorators, { kind: "field", name: "birthtimeMs", static: false, private: false, access: { has: (obj) => ("birthtimeMs" in obj), get: (obj) => obj.birthtimeMs, set: (obj, value) => {
      obj.birthtimeMs = value;
    } }, metadata: _metadata }, _birthtimeMs_initializers, _birthtimeMs_extraInitializers);
    __esDecorate(null, null, _mtimeMs_decorators, { kind: "field", name: "mtimeMs", static: false, private: false, access: { has: (obj) => ("mtimeMs" in obj), get: (obj) => obj.mtimeMs, set: (obj, value) => {
      obj.mtimeMs = value;
    } }, metadata: _metadata }, _mtimeMs_initializers, _mtimeMs_extraInitializers);
    __esDecorate(null, null, _ctimeMs_decorators, { kind: "field", name: "ctimeMs", static: false, private: false, access: { has: (obj) => ("ctimeMs" in obj), get: (obj) => obj.ctimeMs, set: (obj, value) => {
      obj.ctimeMs = value;
    } }, metadata: _metadata }, _ctimeMs_initializers, _ctimeMs_extraInitializers);
    __esDecorate(null, null, _ino_decorators, { kind: "field", name: "ino", static: false, private: false, access: { has: (obj) => ("ino" in obj), get: (obj) => obj.ino, set: (obj, value) => {
      obj.ino = value;
    } }, metadata: _metadata }, _ino_initializers, _ino_extraInitializers);
    __esDecorate(null, null, ___ino_old_decorators, { kind: "field", name: "__ino_old", static: false, private: false, access: { has: (obj) => ("__ino_old" in obj), get: (obj) => obj.__ino_old, set: (obj, value) => {
      obj.__ino_old = value;
    } }, metadata: _metadata }, ___ino_old_initializers, ___ino_old_extraInitializers);
    __esDecorate(null, null, _flags_decorators, { kind: "field", name: "flags", static: false, private: false, access: { has: (obj) => ("flags" in obj), get: (obj) => obj.flags, set: (obj, value) => {
      obj.flags = value;
    } }, metadata: _metadata }, _flags_initializers, _flags_extraInitializers);
    __esDecorate(null, null, ___padding_decorators, { kind: "field", name: "__padding", static: false, private: false, access: { has: (obj) => ("__padding" in obj), get: (obj) => obj.__padding, set: (obj, value) => {
      obj.__padding = value;
    } }, metadata: _metadata }, ___padding_initializers, ___padding_extraInitializers);
    __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
    Inode2 = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return Inode2 = _classThis;
})();
var __inode_sz = sizeof(Inode);

// node_modules/@zenfs/core/dist/stats.js
var n1000 = BigInt(1000);

class StatsCommon {
  _convert(arg) {
    return this._isBigint ? BigInt(arg) : Number(arg);
  }
  get blocks() {
    return this._convert(Math.ceil(Number(this.size) / 512));
  }
  set blocks(value) {
  }
  get atime() {
    return new Date(Number(this.atimeMs));
  }
  set atime(value) {
    this.atimeMs = this._convert(value.getTime());
  }
  get mtime() {
    return new Date(Number(this.mtimeMs));
  }
  set mtime(value) {
    this.mtimeMs = this._convert(value.getTime());
  }
  get ctime() {
    return new Date(Number(this.ctimeMs));
  }
  set ctime(value) {
    this.ctimeMs = this._convert(value.getTime());
  }
  get birthtime() {
    return new Date(Number(this.birthtimeMs));
  }
  set birthtime(value) {
    this.birthtimeMs = this._convert(value.getTime());
  }
  constructor({ atimeMs, mtimeMs, ctimeMs, birthtimeMs, uid, gid, size, mode, ino, ...rest } = {}) {
    this.dev = this._convert(0);
    this.ino = this._convert(0);
    this.rdev = this._convert(0);
    this.nlink = this._convert(1);
    this.blksize = this._convert(4096);
    this.uid = this._convert(0);
    this.gid = this._convert(0);
    const now = Date.now();
    this.atimeMs = this._convert(atimeMs !== null && atimeMs !== undefined ? atimeMs : now);
    this.mtimeMs = this._convert(mtimeMs !== null && mtimeMs !== undefined ? mtimeMs : now);
    this.ctimeMs = this._convert(ctimeMs !== null && ctimeMs !== undefined ? ctimeMs : now);
    this.birthtimeMs = this._convert(birthtimeMs !== null && birthtimeMs !== undefined ? birthtimeMs : now);
    this.uid = this._convert(uid !== null && uid !== undefined ? uid : 0);
    this.gid = this._convert(gid !== null && gid !== undefined ? gid : 0);
    this.size = this._convert(size !== null && size !== undefined ? size : 0);
    this.ino = this._convert(ino !== null && ino !== undefined ? ino : 0);
    this.mode = this._convert(mode !== null && mode !== undefined ? mode : 420 & S_IFREG);
    if ((this.mode & S_IFMT) == 0) {
      this.mode = this.mode | this._convert(S_IFREG);
    }
    Object.assign(this, rest);
  }
  isFile() {
    return (this.mode & S_IFMT) === S_IFREG;
  }
  isDirectory() {
    return (this.mode & S_IFMT) === S_IFDIR;
  }
  isSymbolicLink() {
    return (this.mode & S_IFMT) === S_IFLNK;
  }
  isSocket() {
    return (this.mode & S_IFMT) === S_IFSOCK;
  }
  isBlockDevice() {
    return (this.mode & S_IFMT) === S_IFBLK;
  }
  isCharacterDevice() {
    return (this.mode & S_IFMT) === S_IFCHR;
  }
  isFIFO() {
    return (this.mode & S_IFMT) === S_IFIFO;
  }
  toJSON() {
    return pick(this, _inode_fields);
  }
  hasAccess(mode, context) {
    const creds = (context === null || context === undefined ? undefined : context.credentials) || credentials;
    if (this.isSymbolicLink() || creds.euid === 0 || creds.egid === 0)
      return true;
    let perm = 0;
    if (creds.uid === this.uid) {
      if (this.mode & S_IRUSR)
        perm |= R_OK;
      if (this.mode & S_IWUSR)
        perm |= W_OK;
      if (this.mode & S_IXUSR)
        perm |= X_OK;
    }
    if (creds.gid === this.gid || creds.groups.includes(Number(this.gid))) {
      if (this.mode & S_IRGRP)
        perm |= R_OK;
      if (this.mode & S_IWGRP)
        perm |= W_OK;
      if (this.mode & S_IXGRP)
        perm |= X_OK;
    }
    if (this.mode & S_IROTH)
      perm |= R_OK;
    if (this.mode & S_IWOTH)
      perm |= W_OK;
    if (this.mode & S_IXOTH)
      perm |= X_OK;
    return (perm & mode) === mode;
  }
  chmod(mode) {
    log_deprecated("StatsCommon#chmod");
    this.mode = this._convert(this.mode & S_IFMT | mode);
  }
  chown(uid, gid) {
    log_deprecated("StatsCommon#chown");
    uid = Number(uid);
    gid = Number(gid);
    if (!isNaN(uid) && 0 <= uid && uid < 2 ** 32) {
      this.uid = this._convert(uid);
    }
    if (!isNaN(gid) && 0 <= gid && gid < 2 ** 32) {
      this.gid = this._convert(gid);
    }
  }
  get atimeNs() {
    return BigInt(this.atimeMs) * n1000;
  }
  get mtimeNs() {
    return BigInt(this.mtimeMs) * n1000;
  }
  get ctimeNs() {
    return BigInt(this.ctimeMs) * n1000;
  }
  get birthtimeNs() {
    return BigInt(this.birthtimeMs) * n1000;
  }
}
function _chown(stats, uid, gid) {
  if (!isNaN(uid) && 0 <= uid && uid < size_max) {
    stats.uid = uid;
  }
  if (!isNaN(gid) && 0 <= gid && gid < 2 ** 32) {
    stats.gid = gid;
  }
}

class Stats extends StatsCommon {
  constructor() {
    super(...arguments);
    this._isBigint = false;
  }
}

class BigIntStats extends StatsCommon {
  constructor() {
    super(...arguments);
    this._isBigint = true;
  }
}
function isStatsEqual(left, right) {
  return left.size == right.size && +left.atime == +right.atime && +left.mtime == +right.mtime && +left.ctime == +right.ctime && left.mode == right.mode;
}
class StatsFs {
  constructor() {
    this.type = 525687744115;
    this.bsize = 4096;
    this.blocks = 0;
    this.bfree = 0;
    this.bavail = 0;
    this.files = size_max;
    this.ffree = size_max;
  }
}

class BigIntStatsFs {
  constructor() {
    this.type = BigInt("0x7a656e6673");
    this.bsize = BigInt(4096);
    this.blocks = BigInt(0);
    this.bfree = BigInt(0);
    this.bavail = BigInt(0);
    this.files = BigInt(size_max);
    this.ffree = BigInt(size_max);
  }
}

// node_modules/@zenfs/core/dist/vfs/config.js
var config = {
  checkAccess: true,
  updateOnRead: true,
  syncImmediately: true,
  unsafeBufferReplace: false
};

// node_modules/@zenfs/core/dist/polyfills.js
var _a;
var _b;
var _c;
(_a = Promise.withResolvers) !== null && _a !== undefined || (Promise.withResolvers = (warn("Using a polyfill of Promise.withResolvers"), function() {
  let _resolve, _reject;
  const promise = new Promise((resolve2, reject) => {
    _resolve = resolve2;
    _reject = reject;
  });
  return { promise, resolve: _resolve, reject: _reject };
}));
(_b = Symbol["dispose"]) !== null && _b !== undefined || (Symbol["dispose"] = (warn("Using a polyfill of Symbol.dispose"), Symbol("Symbol.dispose")));
(_c = Symbol["asyncDispose"]) !== null && _c !== undefined || (Symbol["asyncDispose"] = (warn("Using a polyfill of Symbol.asyncDispose"), Symbol("Symbol.asyncDispose")));

// node_modules/@zenfs/core/dist/internal/file.js
var validFlags = ["r", "r+", "rs", "rs+", "w", "wx", "w+", "wx+", "a", "ax", "a+", "ax+"];
function parseFlag(flag) {
  if (typeof flag === "number") {
    return flagToString(flag);
  }
  if (!validFlags.includes(flag)) {
    throw new Error("Invalid flag string: " + flag);
  }
  return flag;
}
function flagToString(flag) {
  switch (flag) {
    case O_RDONLY:
      return "r";
    case O_RDONLY | O_SYNC:
      return "rs";
    case O_RDWR:
      return "r+";
    case O_RDWR | O_SYNC:
      return "rs+";
    case O_TRUNC | O_CREAT | O_WRONLY:
      return "w";
    case O_TRUNC | O_CREAT | O_WRONLY | O_EXCL:
      return "wx";
    case O_TRUNC | O_CREAT | O_RDWR:
      return "w+";
    case O_TRUNC | O_CREAT | O_RDWR | O_EXCL:
      return "wx+";
    case O_APPEND | O_CREAT | O_WRONLY:
      return "a";
    case O_APPEND | O_CREAT | O_WRONLY | O_EXCL:
      return "ax";
    case O_APPEND | O_CREAT | O_RDWR:
      return "a+";
    case O_APPEND | O_CREAT | O_RDWR | O_EXCL:
      return "ax+";
    default:
      throw new Error("Invalid flag number: " + flag);
  }
}
function flagToMode(flag) {
  let mode = 0;
  mode <<= 1;
  mode += +isReadable(flag);
  mode <<= 1;
  mode += +isWriteable(flag);
  mode <<= 1;
  return mode;
}
function isReadable(flag) {
  return flag.indexOf("r") !== -1 || flag.indexOf("+") !== -1;
}
function isWriteable(flag) {
  return flag.indexOf("w") !== -1 || flag.indexOf("a") !== -1 || flag.indexOf("+") !== -1;
}
function isTruncating(flag) {
  return flag.indexOf("w") !== -1;
}
function isAppendable(flag) {
  return flag.indexOf("a") !== -1;
}
function isExclusive(flag) {
  return flag.indexOf("x") !== -1;
}

class File {
  constructor(fs, path) {
    this.fs = fs;
    this.path = path;
  }
  async[Symbol.asyncDispose]() {
    await this.close();
  }
  [Symbol.dispose]() {
    this.closeSync();
  }
  datasync() {
    return this.sync();
  }
  datasyncSync() {
    return this.syncSync();
  }
  streamRead(options) {
    return this.fs.streamRead(this.path, options);
  }
  streamWrite(options) {
    return this.fs.streamWrite(this.path, options);
  }
}
class LazyFile extends File {
  get position() {
    return isAppendable(this.flag) ? this.stats.size : this._position;
  }
  set position(value) {
    this._position = value;
  }
  constructor(fs, path, flag, stats) {
    super(fs, path);
    this.flag = flag;
    this.stats = stats;
    this._position = 0;
    this.dirty = false;
    this.closed = false;
  }
  async sync() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "sync");
    if (!this.dirty)
      return;
    if (!this.fs.attributes.has("no_write"))
      await this.fs.sync(this.path, undefined, this.stats);
    this.dirty = false;
  }
  syncSync() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "sync");
    if (!this.dirty)
      return;
    if (!this.fs.attributes.has("no_write"))
      this.fs.syncSync(this.path, undefined, this.stats);
    this.dirty = false;
  }
  async close() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "close");
    await this.sync();
    this.dispose();
  }
  closeSync() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "close");
    this.syncSync();
    this.dispose();
  }
  dispose(force) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "dispose");
    if (this.dirty && !force)
      throw ErrnoError.With("EBUSY", this.path, "dispose");
    this.closed = true;
  }
  stat() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "stat");
    return Promise.resolve(new Stats(this.stats));
  }
  statSync() {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "stat");
    return new Stats(this.stats);
  }
  async truncate(length) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "truncate");
    this.dirty = true;
    if (!isWriteable(this.flag)) {
      throw new ErrnoError(Errno.EPERM, "File not opened with a writeable mode");
    }
    this.stats.mtimeMs = Date.now();
    this.stats.size = length;
    if (config.syncImmediately)
      await this.sync();
  }
  truncateSync(length) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "truncate");
    this.dirty = true;
    if (!isWriteable(this.flag)) {
      throw new ErrnoError(Errno.EPERM, "File not opened with a writeable mode");
    }
    this.stats.mtimeMs = Date.now();
    this.stats.size = length;
    if (config.syncImmediately)
      this.syncSync();
  }
  prepareWrite(buffer, offset, length, position) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "write");
    if (!isWriteable(this.flag)) {
      throw new ErrnoError(Errno.EPERM, "File not opened with a writeable mode");
    }
    this.dirty = true;
    const end = position + length;
    const slice = buffer.subarray(offset, offset + length);
    if (end > this.stats.size)
      this.stats.size = end;
    this.stats.mtimeMs = Date.now();
    this._position = position + slice.byteLength;
    return slice;
  }
  async write(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    const slice = this.prepareWrite(buffer, offset, length, position);
    await this.fs.write(this.path, slice, position);
    if (config.syncImmediately)
      await this.sync();
    return slice.byteLength;
  }
  writeSync(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    const slice = this.prepareWrite(buffer, offset, length, position);
    this.fs.writeSync(this.path, slice, position);
    if (config.syncImmediately)
      this.syncSync();
    return slice.byteLength;
  }
  prepareRead(length, position) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "read");
    if (!isReadable(this.flag))
      throw new ErrnoError(Errno.EPERM, "File not opened with a readable mode");
    if (config.updateOnRead)
      this.dirty = true;
    this.stats.atimeMs = Date.now();
    let end = position + length;
    if (end > this.stats.size) {
      end = position + Math.max(this.stats.size - position, 0);
    }
    this._position = end;
    return end;
  }
  async read(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    const end = this.prepareRead(length, position);
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    await this.fs.read(this.path, uint8.subarray(offset, offset + length), position, end);
    if (config.syncImmediately)
      await this.sync();
    return { bytesRead: end - position, buffer };
  }
  readSync(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    const end = this.prepareRead(length, position);
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.fs.readSync(this.path, uint8.subarray(offset, offset + length), position, end);
    if (config.syncImmediately)
      this.syncSync();
    return end - position;
  }
  async chmod(mode) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "chmod");
    this.dirty = true;
    this.stats.mode = this.stats.mode & (mode > S_IFMT ? ~S_IFMT : S_IFMT) | mode;
    if (config.syncImmediately || mode > S_IFMT)
      await this.sync();
  }
  chmodSync(mode) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "chmod");
    this.dirty = true;
    this.stats.mode = this.stats.mode & (mode > S_IFMT ? ~S_IFMT : S_IFMT) | mode;
    if (config.syncImmediately || mode > S_IFMT)
      this.syncSync();
  }
  async chown(uid, gid) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "chown");
    this.dirty = true;
    _chown(this.stats, uid, gid);
    if (config.syncImmediately)
      await this.sync();
  }
  chownSync(uid, gid) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "chown");
    this.dirty = true;
    _chown(this.stats, uid, gid);
    if (config.syncImmediately)
      this.syncSync();
  }
  async utimes(atime, mtime) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "utimes");
    this.dirty = true;
    this.stats.atimeMs = atime;
    this.stats.mtimeMs = mtime;
    if (config.syncImmediately)
      await this.sync();
  }
  utimesSync(atime, mtime) {
    if (this.closed)
      throw ErrnoError.With("EBADF", this.path, "utimes");
    this.dirty = true;
    this.stats.atimeMs = atime;
    this.stats.mtimeMs = mtime;
    if (config.syncImmediately)
      this.syncSync();
  }
}

// node_modules/@zenfs/core/dist/internal/filesystem.js
var _chunkSize = 4096;

class FileSystem {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.attributes = new Map;
    if (this.streamRead === FileSystem.prototype.streamRead)
      this.attributes.set("default_stream_read");
    if (this.streamWrite === FileSystem.prototype.streamWrite)
      this.attributes.set("default_stream_write");
  }
  toString() {
    var _a2;
    return `${this.name} ${(_a2 = this.label) !== null && _a2 !== undefined ? _a2 : ""} (${this._mountPoint ? "mounted on " + this._mountPoint : "unmounted"})`;
  }
  usage() {
    return {
      totalSpace: 0,
      freeSpace: 0
    };
  }
  metadata() {
    return {
      ...this.usage(),
      name: this.name,
      readonly: this.attributes.has("no_write"),
      noResizableBuffers: this.attributes.has("no_buffer_resize"),
      noAsyncCache: this.attributes.has("no_async"),
      features: Array.from(this.attributes.keys()),
      type: this.id
    };
  }
  async ready() {
  }
  async exists(path) {
    try {
      await this.stat(path);
      return true;
    } catch (e) {
      return e.code != "ENOENT";
    }
  }
  existsSync(path) {
    try {
      this.statSync(path);
      return true;
    } catch (e) {
      return e.code != "ENOENT";
    }
  }
  streamRead(path, options) {
    return new ReadableStream({
      start: async (controller) => {
        const { size } = await this.stat(path);
        const { start = 0, end = size } = options;
        for (let offset = start;offset < end; offset += _chunkSize) {
          const bytesRead = offset + _chunkSize > end ? end - offset : _chunkSize;
          const buffer = new Uint8Array(bytesRead);
          await this.read(path, buffer, offset, offset + bytesRead).catch(controller.error.bind(controller));
          controller.enqueue(buffer);
        }
        controller.close();
      },
      type: "bytes"
    });
  }
  streamWrite(path, options) {
    var _a2;
    let position = (_a2 = options.start) !== null && _a2 !== undefined ? _a2 : 0;
    return new WritableStream({
      write: async (chunk, controller) => {
        await this.write(path, chunk, position).catch(controller.error.bind(controller));
        position += chunk.byteLength;
      }
    });
  }
}

// node_modules/@zenfs/core/dist/internal/file_index.js
var version = 1;

class Index extends Map {
  constructor() {
    super(...arguments);
    this.maxSize = size_max;
  }
  toJSON() {
    return {
      version,
      maxSize: this.maxSize,
      entries: Object.fromEntries([...this].map(([k, v]) => [k, v.toJSON()]))
    };
  }
  toString() {
    return JSON.stringify(this.toJSON());
  }
  get byteSize() {
    let size = this.size * __inode_sz;
    for (const entry of this.values())
      size += entry.size;
    return size;
  }
  usage() {
    return {
      totalSpace: this.maxSize,
      freeSpace: this.maxSize - this.byteSize
    };
  }
  pathOf(id) {
    for (const [path, inode] of this) {
      if (inode.ino == id || inode.data == id)
        return path;
    }
  }
  getByID(id) {
    var _a2;
    return (_a2 = this.entryByID(id)) === null || _a2 === undefined ? undefined : _a2.inode;
  }
  entryByID(id) {
    for (const [path, inode] of this) {
      if (inode.ino == id || inode.data == id)
        return { path, inode };
    }
  }
  directoryEntries(path) {
    const node = this.get(path);
    if (!node)
      throw ErrnoError.With("ENOENT", path);
    if ((node.mode & S_IFMT) != S_IFDIR)
      throw ErrnoError.With("ENOTDIR", path);
    const entries2 = {};
    for (const entry of this.keys()) {
      if (dirname(entry) == path && entry != path) {
        entries2[basename(entry)] = this.get(entry).ino;
      }
    }
    return entries2;
  }
  _alloc() {
    return Math.max(...[...this.values()].flatMap((i) => [i.ino, i.data])) + 1;
  }
  directories() {
    const dirs = new Map;
    for (const [path, node] of this) {
      if ((node.mode & S_IFMT) != S_IFDIR)
        continue;
      const entries2 = {};
      for (const entry of this.keys()) {
        if (dirname(entry) == path && entry != path)
          entries2[basename(entry)] = this.get(entry).ino;
      }
      dirs.set(path, entries2);
    }
    return dirs;
  }
  fromJSON(json) {
    var _a2;
    if (json.version != version) {
      throw new ErrnoError(Errno.EINVAL, "Index version mismatch");
    }
    this.clear();
    for (const [path, node] of Object.entries(json.entries)) {
      (_a2 = node.data) !== null && _a2 !== undefined || (node.data = randomInt(1, size_max));
      if (path == "/")
        node.ino = 0;
      this.set(path, new Inode(node));
    }
    return this;
  }
  static parse(data) {
    if (!isJSON(data))
      throw new ErrnoError(Errno.EINVAL, "Invalid JSON");
    const json = JSON.parse(data);
    const index = new Index;
    index.fromJSON(json);
    return index;
  }
}

// node_modules/@zenfs/core/dist/utils.js
function encodeRaw(input) {
  if (typeof input != "string") {
    throw new ErrnoError(Errno.EINVAL, "Can not encode a non-string");
  }
  return new Uint8Array(Array.from(input).map((char) => char.charCodeAt(0)));
}
function decodeRaw(input) {
  if (!(input instanceof Uint8Array)) {
    throw new ErrnoError(Errno.EINVAL, "Can not decode a non-Uint8Array");
  }
  return Array.from(input).map((char) => String.fromCharCode(char)).join("");
}
var encoder = new TextEncoder;
function encodeUTF8(input) {
  if (typeof input != "string") {
    throw new ErrnoError(Errno.EINVAL, "Can not encode a non-string");
  }
  return encoder.encode(input);
}
var decoder = new TextDecoder;
function decodeUTF8(input) {
  if (!(input instanceof Uint8Array)) {
    throw new ErrnoError(Errno.EINVAL, "Can not decode a non-Uint8Array");
  }
  return decoder.decode(input);
}
function decodeDirListing(data) {
  return JSON.parse(decodeUTF8(data), (k, v) => k == "" ? v : typeof v == "string" ? BigInt(v).toString(16).slice(0, Math.min(v.length, 8)) : v);
}
function encodeDirListing(data) {
  return encodeUTF8(JSON.stringify(data));
}
function normalizeMode(mode, def) {
  if (typeof mode == "number")
    return mode;
  if (typeof mode == "string") {
    const parsed = parseInt(mode, 8);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  if (typeof def == "number")
    return def;
  throw new ErrnoError(Errno.EINVAL, "Invalid mode: " + (mode === null || mode === undefined ? undefined : mode.toString()));
}
function normalizeTime(time) {
  if (time instanceof Date)
    return time.getTime();
  try {
    return Number(time);
  } catch {
    throw new ErrnoError(Errno.EINVAL, "Invalid time.");
  }
}
function normalizePath(p, noResolve = false) {
  if (p instanceof URL) {
    if (p.protocol != "file:")
      throw new ErrnoError(Errno.EINVAL, "URLs must use the file: protocol");
    p = p.pathname;
  }
  p = p.toString();
  if (p.startsWith("file://"))
    p = p.slice("file://".length);
  if (p.includes("\x00")) {
    throw new ErrnoError(Errno.EINVAL, "Path can not contain null character");
  }
  if (p.length == 0) {
    throw new ErrnoError(Errno.EINVAL, "Path can not be empty");
  }
  p = p.replaceAll(/[/\\]+/g, "/");
  return noResolve ? p : resolve(p);
}
function normalizeOptions(options, encoding = "utf8", flag, mode = 0) {
  if (typeof options != "object" || options === null) {
    return {
      encoding: typeof options == "string" ? options : encoding !== null && encoding !== undefined ? encoding : null,
      flag,
      mode
    };
  }
  return {
    encoding: typeof (options === null || options === undefined ? undefined : options.encoding) == "string" ? options.encoding : encoding !== null && encoding !== undefined ? encoding : null,
    flag: typeof (options === null || options === undefined ? undefined : options.flag) == "string" ? options.flag : flag,
    mode: normalizeMode("mode" in options ? options === null || options === undefined ? undefined : options.mode : null, mode)
  };
}

// node_modules/utilium/dist/cache.js
class Resource {
  id;
  _size;
  options;
  regions = [];
  get size() {
    return this._size;
  }
  set size(value) {
    if (value >= this._size) {
      this._size = value;
      return;
    }
    this._size = value;
    for (let i = this.regions.length - 1;i >= 0; i--) {
      const region = this.regions[i];
      if (region.offset >= value) {
        this.regions.splice(i, 1);
        continue;
      }
      const maxLength = value - region.offset;
      if (region.data.byteLength > maxLength) {
        region.data = region.data.subarray(0, maxLength);
      }
      region.ranges = region.ranges.filter((range) => range.start < value).map((range) => {
        if (range.end > value) {
          return { start: range.start, end: value };
        }
        return range;
      });
    }
  }
  constructor(id, _size, options, resources) {
    this.id = id;
    this._size = _size;
    this.options = options;
    options.sparse ??= true;
    if (!options.sparse)
      this.regions.push({ offset: 0, data: new Uint8Array(_size), ranges: [] });
    resources?.set(id, this);
  }
  collect() {
    if (!this.options.sparse)
      return;
    const { regionGapThreshold = 4095 } = this.options;
    for (let i = 0;i < this.regions.length - 1; ) {
      const current = this.regions[i];
      const next = this.regions[i + 1];
      if (next.offset - (current.offset + current.data.byteLength) > regionGapThreshold) {
        i++;
        continue;
      }
      current.ranges.push(...next.ranges);
      current.ranges.sort((a, b) => a.start - b.start);
      current.ranges = current.ranges.reduce((acc, range) => {
        if (!acc.length || acc.at(-1).end < range.start) {
          acc.push(range);
        } else {
          acc.at(-1).end = Math.max(acc.at(-1).end, range.end);
        }
        return acc;
      }, []);
      current.data = extendBuffer(current.data, next.offset + next.data.byteLength);
      current.data.set(next.data, next.offset - current.offset);
      this.regions.splice(i + 1, 1);
    }
  }
  missing(start, end) {
    const missingRanges = [];
    for (const region of this.regions) {
      if (region.offset >= end)
        break;
      for (const range of region.ranges) {
        if (range.end <= start)
          continue;
        if (range.start >= end)
          break;
        if (range.start > start) {
          missingRanges.push({ start, end: Math.min(range.start, end) });
        }
        if (range.end > start)
          start = Math.max(start, range.end);
        if (start >= end)
          break;
      }
      if (start >= end)
        break;
    }
    if (start < end)
      missingRanges.push({ start, end });
    return missingRanges;
  }
  cached(start, end) {
    const cachedRanges = [];
    for (const region of this.regions) {
      if (region.offset >= end)
        break;
      for (const range of region.ranges) {
        if (range.end <= start)
          continue;
        if (range.start >= end)
          break;
        cachedRanges.push({
          start: Math.max(start, range.start),
          end: Math.min(end, range.end)
        });
      }
    }
    cachedRanges.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const curr of cachedRanges) {
      const last = merged.at(-1);
      if (last && curr.start <= last.end) {
        last.end = Math.max(last.end, curr.end);
      } else {
        merged.push(curr);
      }
    }
    return merged;
  }
  regionAt(offset) {
    if (!this.regions.length)
      return;
    for (const region of this.regions) {
      if (region.offset > offset)
        break;
      if (offset >= region.offset && offset < region.offset + region.data.byteLength)
        return region;
    }
  }
  add(data, offset) {
    const end = offset + data.byteLength;
    const region = this.regionAt(offset);
    if (region) {
      region.data = extendBuffer(region.data, end);
      region.data.set(data, offset);
      region.ranges.push({ start: offset, end });
      region.ranges.sort((a, b) => a.start - b.start);
      this.collect();
      return this;
    }
    const newRegion = { data, offset, ranges: [{ start: offset, end }] };
    const insertIndex = this.regions.findIndex((region2) => region2.offset > offset);
    if (insertIndex == -1) {
      this.regions.push(newRegion);
    } else {
      this.regions.splice(insertIndex, 0, newRegion);
    }
    this.collect();
    return this;
  }
}

// node_modules/@zenfs/core/dist/backends/store/store.js
class Transaction {
  constructor(store) {
    this.store = store;
  }
}

class SyncTransaction extends Transaction {
  async get(id, offset, end) {
    return this.getSync(id, offset, end);
  }
  async set(id, data, offset) {
    return this.setSync(id, data, offset);
  }
  async remove(id) {
    return this.removeSync(id);
  }
}

class AsyncTransaction extends Transaction {
  constructor() {
    super(...arguments);
    this.asyncDone = Promise.resolve();
  }
  async(promise) {
    this.asyncDone = this.asyncDone.then(() => promise);
  }
  _cached(id, info2) {
    var _a2;
    var _b2;
    (_a2 = (_b2 = this.store).cache) !== null && _a2 !== undefined || (_b2.cache = new Map);
    const resource = this.store.cache.get(id);
    if (!resource)
      return !info2 ? undefined : new Resource(id, info2.size, {}, this.store.cache);
    if (info2)
      resource.size = info2.size;
    return resource;
  }
  getSync(id, offset, end) {
    var _a2;
    const resource = this._cached(id);
    if (!resource)
      return;
    end !== null && end !== undefined || (end = resource.size);
    const missing = resource.missing(offset, end);
    for (const { start, end: end2 } of missing) {
      this.async(this.get(id, start, end2));
    }
    if (missing.length)
      throw err(ErrnoError.With("EAGAIN", (_a2 = this.store._fs) === null || _a2 === undefined ? undefined : _a2._path(id)));
    const region = resource.regionAt(offset);
    if (!region) {
      warn("Missing cache region for " + id);
      return;
    }
    return region.data.subarray(offset - region.offset, end - region.offset);
  }
  setSync(id, data, offset) {
    this.async(this.set(id, data, offset));
  }
  removeSync(id) {
    var _a2;
    this.async(this.remove(id));
    (_a2 = this.store.cache) === null || _a2 === undefined || _a2.delete(id);
  }
}

class WrappedTransaction {
  flag(flag) {
    var _a2, _b2;
    return (_b2 = (_a2 = this.raw.store.flags) === null || _a2 === undefined ? undefined : _a2.includes(flag)) !== null && _b2 !== undefined ? _b2 : false;
  }
  constructor(raw, fs) {
    this.raw = raw;
    this.fs = fs;
    this.done = false;
    this.originalData = new Map;
    this.modifiedKeys = new Set;
  }
  keys() {
    return this.raw.keys();
  }
  async get(id, offset = 0, end) {
    const data = await this.raw.get(id, offset, end);
    this.stash(id);
    return data;
  }
  getSync(id, offset = 0, end) {
    const data = this.raw.getSync(id, offset, end);
    this.stash(id);
    return data;
  }
  async set(id, data, offset = 0) {
    await this.markModified(id, offset, data.byteLength);
    await this.raw.set(id, data, offset);
  }
  setSync(id, data, offset = 0) {
    this.markModifiedSync(id, offset, data.byteLength);
    this.raw.setSync(id, data, offset);
  }
  async remove(id) {
    await this.markModified(id, 0, undefined);
    await this.raw.remove(id);
  }
  removeSync(id) {
    this.markModifiedSync(id, 0, undefined);
    this.raw.removeSync(id);
  }
  commit() {
    this.done = true;
    return Promise.resolve();
  }
  commitSync() {
    this.done = true;
  }
  async abort() {
    if (this.done)
      return;
    for (const [id, entries2] of this.originalData) {
      if (!this.modifiedKeys.has(id))
        continue;
      if (entries2.some((ent) => !ent.data)) {
        await this.raw.remove(id);
        this.fs._remove(id);
        continue;
      }
      for (const entry of entries2.reverse()) {
        await this.raw.set(id, entry.data, entry.offset);
      }
    }
    this.done = true;
  }
  abortSync() {
    if (this.done)
      return;
    for (const [id, entries2] of this.originalData) {
      if (!this.modifiedKeys.has(id))
        continue;
      if (entries2.some((ent) => !ent.data)) {
        this.raw.removeSync(id);
        this.fs._remove(id);
        continue;
      }
      for (const entry of entries2.reverse()) {
        this.raw.setSync(id, entry.data, entry.offset);
      }
    }
    this.done = true;
  }
  async[Symbol.asyncDispose]() {
    if (this.done)
      return;
    await this.abort();
  }
  [Symbol.dispose]() {
    if (this.done)
      return;
    this.abortSync();
  }
  stash(id, data, offset = 0) {
    if (!this.originalData.has(id))
      this.originalData.set(id, []);
    this.originalData.get(id).push({ data, offset });
  }
  async markModified(id, offset, length) {
    this.modifiedKeys.add(id);
    const end = length ? offset + length : undefined;
    try {
      this.stash(id, await this.raw.get(id, offset, end), offset);
    } catch (e) {
      if (!(this.raw instanceof AsyncTransaction))
        throw e;
      const tx = this.raw;
      const resource = tx._cached(id);
      if (!resource)
        throw e;
      for (const range of resource.cached(offset, end !== null && end !== undefined ? end : offset)) {
        this.stash(id, await this.raw.get(id, range.start, range.end), range.start);
      }
    }
  }
  markModifiedSync(id, offset, length) {
    this.modifiedKeys.add(id);
    const end = length ? offset + length : undefined;
    try {
      this.stash(id, this.raw.getSync(id, offset, end), offset);
    } catch (e) {
      if (!(this.raw instanceof AsyncTransaction))
        throw e;
      const tx = this.raw;
      const resource = tx._cached(id);
      if (!resource)
        throw e;
      for (const range of resource.cached(offset, end !== null && end !== undefined ? end : offset)) {
        this.stash(id, this.raw.getSync(id, range.start, range.end), range.start);
      }
    }
  }
}

// node_modules/@zenfs/core/dist/backends/store/fs.js
var __addDisposableResource = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});

class StoreFS extends FileSystem {
  _path(id) {
    var _a2;
    const [path] = (_a2 = this._paths.get(id)) !== null && _a2 !== undefined ? _a2 : [];
    return path;
  }
  _add(ino, path) {
    if (!this._paths.has(ino))
      this._paths.set(ino, new Set);
    this._paths.get(ino).add(path);
    this._ids.set(path, ino);
  }
  _remove(ino) {
    var _a2;
    for (const path of (_a2 = this._paths.get(ino)) !== null && _a2 !== undefined ? _a2 : []) {
      this._ids.delete(path);
    }
    this._paths.delete(ino);
  }
  _move(from, to) {
    const toMove = [];
    for (const [path, ino] of this._ids) {
      const rel = relative(from, path);
      if (rel.startsWith(".."))
        continue;
      let newKey = join(to, rel);
      if (newKey.endsWith("/"))
        newKey = newKey.slice(0, -1);
      toMove.push({ oldKey: path, newKey, ino });
    }
    for (const { oldKey, newKey, ino } of toMove) {
      this._ids.delete(oldKey);
      this._ids.set(newKey, ino);
      const p = this._paths.get(ino);
      if (!p) {
        warn("Missing paths in table for ino " + ino);
        continue;
      }
      p.delete(oldKey);
      p.add(newKey);
    }
  }
  async ready() {
    if (this._initialized)
      return;
    this.checkRootSync();
    await this.checkRoot();
    await this._populate();
    this._initialized = true;
  }
  constructor(store) {
    var _a2, _b2;
    super((_a2 = store.id) !== null && _a2 !== undefined ? _a2 : 1802921587, store.name);
    this.store = store;
    this._ids = new Map([["/", 0]]);
    this._paths = new Map([[0, new Set("/")]]);
    this._initialized = false;
    this.attributes.set("setid");
    store._fs = this;
    debug(this.name + ": supports features: " + ((_b2 = this.store.flags) === null || _b2 === undefined ? undefined : _b2.join(", ")));
  }
  usage() {
    var _a2, _b2;
    return ((_b2 = (_a2 = this.store).usage) === null || _b2 === undefined ? undefined : _b2.call(_a2)) || {
      totalSpace: 0,
      freeSpace: 0
    };
  }
  async empty() {
    log_deprecated("StoreFS#empty");
    await this.checkRoot();
  }
  emptySync() {
    log_deprecated("StoreFS#emptySync");
    this.checkRootSync();
  }
  async loadIndex(index) {
    const env_1 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_1, this.transaction(), true);
      const dirs = index.directories();
      for (const [path, inode] of index) {
        this._add(inode.ino, path);
        await tx.set(inode.ino, serialize(inode));
        if (dirs.has(path))
          await tx.set(inode.data, encodeDirListing(dirs.get(path)));
      }
      await tx.commit();
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      const result_1 = __disposeResources(env_1);
      if (result_1)
        await result_1;
    }
  }
  loadIndexSync(index) {
    const env_2 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_2, this.transaction(), false);
      const dirs = index.directories();
      for (const [path, inode] of index) {
        this._add(inode.ino, path);
        tx.setSync(inode.ino, serialize(inode));
        if (dirs.has(path))
          tx.setSync(inode.data, encodeDirListing(dirs.get(path)));
      }
      tx.commitSync();
    } catch (e_2) {
      env_2.error = e_2;
      env_2.hasError = true;
    } finally {
      __disposeResources(env_2);
    }
  }
  async createIndex() {
    var _a2;
    const env_3 = { stack: [], error: undefined, hasError: false };
    try {
      const index = new Index;
      const tx = __addDisposableResource(env_3, this.transaction(), true);
      const queue = [["/", 0]];
      const silence = canary(ErrnoError.With("EDEADLK"));
      while (queue.length) {
        const [path, ino] = queue.shift();
        const inode = new Inode(await tx.get(ino));
        index.set(path, inode);
        if (inode.mode & S_IFDIR) {
          const dir = decodeDirListing((_a2 = await tx.get(inode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", path)));
          for (const [name, id] of Object.entries(dir)) {
            queue.push([join(path, name), id]);
          }
        }
      }
      silence();
      return index;
    } catch (e_3) {
      env_3.error = e_3;
      env_3.hasError = true;
    } finally {
      const result_2 = __disposeResources(env_3);
      if (result_2)
        await result_2;
    }
  }
  createIndexSync() {
    var _a2;
    const env_4 = { stack: [], error: undefined, hasError: false };
    try {
      const index = new Index;
      const tx = __addDisposableResource(env_4, this.transaction(), false);
      const queue = [["/", 0]];
      const silence = canary(ErrnoError.With("EDEADLK"));
      while (queue.length) {
        const [path, ino] = queue.shift();
        const inode = new Inode(tx.getSync(ino));
        index.set(path, inode);
        if (inode.mode & S_IFDIR) {
          const dir = decodeDirListing((_a2 = tx.getSync(inode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", path)));
          for (const [name, id] of Object.entries(dir)) {
            queue.push([join(path, name), id]);
          }
        }
      }
      silence();
      return index;
    } catch (e_4) {
      env_4.error = e_4;
      env_4.hasError = true;
    } finally {
      __disposeResources(env_4);
    }
  }
  async rename(oldPath, newPath) {
    var _a2, _b2, _c2;
    const env_5 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_5, this.transaction(), true);
      const _old = parse2(oldPath), _new = parse2(newPath), oldDirNode = await this.findInode(tx, _old.dir, "rename"), oldDirList = decodeDirListing((_a2 = await tx.get(oldDirNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", _old.dir, "rename")));
      if (!oldDirList[_old.base])
        throw ErrnoError.With("ENOENT", oldPath, "rename");
      const ino = oldDirList[_old.base];
      if (ino != this._ids.get(oldPath))
        err(`Ino mismatch while renaming ${oldPath} to ${newPath}`);
      delete oldDirList[_old.base];
      if ((_new.dir + "/").startsWith(oldPath + "/"))
        throw new ErrnoError(Errno.EBUSY, _old.dir);
      const sameParent = _new.dir == _old.dir;
      const newDirNode = sameParent ? oldDirNode : await this.findInode(tx, _new.dir, "rename");
      const newDirList = sameParent ? oldDirList : decodeDirListing((_b2 = await tx.get(newDirNode.data)) !== null && _b2 !== undefined ? _b2 : _throw(ErrnoError.With("ENODATA", _new.dir, "rename")));
      if (newDirList[_new.base]) {
        const existing = new Inode((_c2 = await tx.get(newDirList[_new.base])) !== null && _c2 !== undefined ? _c2 : _throw(ErrnoError.With("ENOENT", newPath, "rename")));
        if (!existing.toStats().isFile())
          throw ErrnoError.With("EPERM", newPath, "rename");
        await tx.remove(existing.data);
        await tx.remove(newDirList[_new.base]);
      }
      newDirList[_new.base] = ino;
      await tx.set(oldDirNode.data, encodeDirListing(oldDirList));
      await tx.set(newDirNode.data, encodeDirListing(newDirList));
      await tx.commit();
      this._move(oldPath, newPath);
    } catch (e_5) {
      env_5.error = e_5;
      env_5.hasError = true;
    } finally {
      const result_3 = __disposeResources(env_5);
      if (result_3)
        await result_3;
    }
  }
  renameSync(oldPath, newPath) {
    var _a2, _b2, _c2;
    const env_6 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_6, this.transaction(), false);
      const _old = parse2(oldPath), _new = parse2(newPath), oldDirNode = this.findInodeSync(tx, _old.dir, "rename"), oldDirList = decodeDirListing((_a2 = tx.getSync(oldDirNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", _old.dir, "rename")));
      if (!oldDirList[_old.base])
        throw ErrnoError.With("ENOENT", oldPath, "rename");
      const ino = oldDirList[_old.base];
      if (ino != this._ids.get(oldPath))
        err(`Ino mismatch while renaming ${oldPath} to ${newPath}`);
      delete oldDirList[_old.base];
      if ((_new.dir + "/").startsWith(oldPath + "/"))
        throw new ErrnoError(Errno.EBUSY, _old.dir);
      const sameParent = _new.dir === _old.dir;
      const newDirNode = sameParent ? oldDirNode : this.findInodeSync(tx, _new.dir, "rename");
      const newDirList = sameParent ? oldDirList : decodeDirListing((_b2 = tx.getSync(newDirNode.data)) !== null && _b2 !== undefined ? _b2 : _throw(ErrnoError.With("ENODATA", _new.dir, "rename")));
      if (newDirList[_new.base]) {
        const existing = new Inode((_c2 = tx.getSync(newDirList[_new.base])) !== null && _c2 !== undefined ? _c2 : _throw(ErrnoError.With("ENOENT", newPath, "rename")));
        if (!existing.toStats().isFile())
          throw ErrnoError.With("EPERM", newPath, "rename");
        tx.removeSync(existing.data);
        tx.removeSync(newDirList[_new.base]);
      }
      newDirList[_new.base] = ino;
      tx.setSync(oldDirNode.data, encodeDirListing(oldDirList));
      tx.setSync(newDirNode.data, encodeDirListing(newDirList));
      tx.commitSync();
      this._move(oldPath, newPath);
    } catch (e_6) {
      env_6.error = e_6;
      env_6.hasError = true;
    } finally {
      __disposeResources(env_6);
    }
  }
  async stat(path) {
    const env_7 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_7, this.transaction(), true);
      return (await this.findInode(tx, path, "stat")).toStats();
    } catch (e_7) {
      env_7.error = e_7;
      env_7.hasError = true;
    } finally {
      const result_4 = __disposeResources(env_7);
      if (result_4)
        await result_4;
    }
  }
  statSync(path) {
    const env_8 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_8, this.transaction(), false);
      return this.findInodeSync(tx, path, "stat").toStats();
    } catch (e_8) {
      env_8.error = e_8;
      env_8.hasError = true;
    } finally {
      __disposeResources(env_8);
    }
  }
  async createFile(path, flag, mode, options) {
    const node = await this.commitNew(path, { mode: mode | S_IFREG, ...options }, new Uint8Array, "createFile");
    return new LazyFile(this, path, flag, node.toStats());
  }
  createFileSync(path, flag, mode, options) {
    const node = this.commitNewSync(path, { mode: mode | S_IFREG, ...options }, new Uint8Array, "createFile");
    return new LazyFile(this, path, flag, node.toStats());
  }
  async openFile(path, flag) {
    const env_9 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_9, this.transaction(), true);
      const node = await this.findInode(tx, path, "openFile");
      return new LazyFile(this, path, flag, node.toStats());
    } catch (e_9) {
      env_9.error = e_9;
      env_9.hasError = true;
    } finally {
      const result_5 = __disposeResources(env_9);
      if (result_5)
        await result_5;
    }
  }
  openFileSync(path, flag) {
    const env_10 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_10, this.transaction(), false);
      const node = this.findInodeSync(tx, path, "openFile");
      return new LazyFile(this, path, flag, node.toStats());
    } catch (e_10) {
      env_10.error = e_10;
      env_10.hasError = true;
    } finally {
      __disposeResources(env_10);
    }
  }
  async unlink(path) {
    return this.remove(path, false);
  }
  unlinkSync(path) {
    this.removeSync(path, false);
  }
  async rmdir(path) {
    if ((await this.readdir(path)).length) {
      throw ErrnoError.With("ENOTEMPTY", path, "rmdir");
    }
    await this.remove(path, true);
  }
  rmdirSync(path) {
    if (this.readdirSync(path).length) {
      throw ErrnoError.With("ENOTEMPTY", path, "rmdir");
    }
    this.removeSync(path, true);
  }
  async mkdir(path, mode, options) {
    await this.commitNew(path, { mode: mode | S_IFDIR, ...options }, encodeUTF8("{}"), "mkdir");
  }
  mkdirSync(path, mode, options) {
    this.commitNewSync(path, { mode: mode | S_IFDIR, ...options }, encodeUTF8("{}"), "mkdir");
  }
  async readdir(path) {
    var _a2;
    const env_11 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_11, this.transaction(), true);
      const node = await this.findInode(tx, path, "readdir");
      return Object.keys(decodeDirListing((_a2 = await tx.get(node.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, "readdir"))));
    } catch (e_11) {
      env_11.error = e_11;
      env_11.hasError = true;
    } finally {
      const result_6 = __disposeResources(env_11);
      if (result_6)
        await result_6;
    }
  }
  readdirSync(path) {
    var _a2;
    const env_12 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_12, this.transaction(), false);
      const node = this.findInodeSync(tx, path, "readdir");
      return Object.keys(decodeDirListing((_a2 = tx.getSync(node.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, "readdir"))));
    } catch (e_12) {
      env_12.error = e_12;
      env_12.hasError = true;
    } finally {
      __disposeResources(env_12);
    }
  }
  async sync(path, data, metadata2) {
    const env_13 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_13, this.transaction(), true);
      const inode = await this.findInode(tx, path, "sync");
      if (data)
        await tx.set(inode.data, data);
      if (inode.update(metadata2)) {
        this._add(inode.ino, path);
        await tx.set(inode.ino, serialize(inode));
      }
      await tx.commit();
    } catch (e_13) {
      env_13.error = e_13;
      env_13.hasError = true;
    } finally {
      const result_7 = __disposeResources(env_13);
      if (result_7)
        await result_7;
    }
  }
  syncSync(path, data, metadata2) {
    const env_14 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_14, this.transaction(), false);
      const inode = this.findInodeSync(tx, path, "sync");
      if (data)
        tx.setSync(inode.data, data);
      if (inode.update(metadata2)) {
        this._add(inode.ino, path);
        tx.setSync(inode.ino, serialize(inode));
      }
      tx.commitSync();
    } catch (e_14) {
      env_14.error = e_14;
      env_14.hasError = true;
    } finally {
      __disposeResources(env_14);
    }
  }
  async link(target, link) {
    var _a2;
    const env_15 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_15, this.transaction(), true);
      const newDir = dirname(link), newDirNode = await this.findInode(tx, newDir, "link"), listing = decodeDirListing((_a2 = await tx.get(newDirNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", newDir, "link")));
      const inode = await this.findInode(tx, target, "link");
      inode.nlink++;
      listing[basename(link)] = inode.ino;
      this._add(inode.ino, link);
      await tx.set(inode.ino, serialize(inode));
      await tx.set(newDirNode.data, encodeDirListing(listing));
      await tx.commit();
    } catch (e_15) {
      env_15.error = e_15;
      env_15.hasError = true;
    } finally {
      const result_8 = __disposeResources(env_15);
      if (result_8)
        await result_8;
    }
  }
  linkSync(target, link) {
    var _a2;
    const env_16 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_16, this.transaction(), false);
      const newDir = dirname(link), newDirNode = this.findInodeSync(tx, newDir, "link"), listing = decodeDirListing((_a2 = tx.getSync(newDirNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", newDir, "link")));
      const inode = this.findInodeSync(tx, target, "link");
      inode.nlink++;
      listing[basename(link)] = inode.ino;
      this._add(inode.ino, link);
      tx.setSync(inode.ino, serialize(inode));
      tx.setSync(newDirNode.data, encodeDirListing(listing));
      tx.commitSync();
    } catch (e_16) {
      env_16.error = e_16;
      env_16.hasError = true;
    } finally {
      __disposeResources(env_16);
    }
  }
  async read(path, buffer, offset, end) {
    var _a2;
    const env_17 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_17, this.transaction(), true);
      const inode = await this.findInode(tx, path, "read");
      if (inode.size == 0)
        return;
      const data = (_a2 = await tx.get(inode.data, offset, end)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", path, "read"));
      const _ = tx.flag("partial") ? data : data.subarray(offset, end);
      if (_.byteLength > buffer.byteLength)
        err(`Trying to place ${_.byteLength} bytes into a ${buffer.byteLength} byte buffer on read`);
      buffer.set(_);
    } catch (e_17) {
      env_17.error = e_17;
      env_17.hasError = true;
    } finally {
      const result_9 = __disposeResources(env_17);
      if (result_9)
        await result_9;
    }
  }
  readSync(path, buffer, offset, end) {
    var _a2;
    const env_18 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_18, this.transaction(), false);
      const inode = this.findInodeSync(tx, path, "read");
      if (inode.size == 0)
        return;
      const data = (_a2 = tx.getSync(inode.data, offset, end)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENODATA", path, "read"));
      const _ = tx.flag("partial") ? data : data.subarray(offset, end);
      if (_.byteLength > buffer.byteLength)
        err(`Trying to place ${_.byteLength} bytes into a ${buffer.byteLength} byte buffer on read`);
      buffer.set(_);
    } catch (e_18) {
      env_18.error = e_18;
      env_18.hasError = true;
    } finally {
      __disposeResources(env_18);
    }
  }
  async write(path, data, offset) {
    var _a2;
    const env_19 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_19, this.transaction(), true);
      const inode = await this.findInode(tx, path, "write");
      let buffer = data;
      if (!tx.flag("partial")) {
        buffer = extendBuffer((_a2 = await tx.get(inode.data)) !== null && _a2 !== undefined ? _a2 : new Uint8Array, offset + data.byteLength);
        buffer.set(data, offset);
        offset = 0;
      }
      await tx.set(inode.data, buffer, offset);
      inode.update({ mtimeMs: Date.now(), size: Math.max(inode.size, data.byteLength + offset) });
      this._add(inode.ino, path);
      await tx.set(inode.ino, serialize(inode));
      await tx.commit();
    } catch (e_19) {
      env_19.error = e_19;
      env_19.hasError = true;
    } finally {
      const result_10 = __disposeResources(env_19);
      if (result_10)
        await result_10;
    }
  }
  writeSync(path, data, offset) {
    var _a2;
    const env_20 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_20, this.transaction(), false);
      const inode = this.findInodeSync(tx, path, "write");
      let buffer = data;
      if (!tx.flag("partial")) {
        buffer = extendBuffer((_a2 = tx.getSync(inode.data)) !== null && _a2 !== undefined ? _a2 : new Uint8Array, offset + data.byteLength);
        buffer.set(data, offset);
        offset = 0;
      }
      tx.setSync(inode.data, buffer, offset);
      inode.update({ mtimeMs: Date.now(), size: Math.max(inode.size, data.byteLength + offset) });
      this._add(inode.ino, path);
      tx.setSync(inode.ino, serialize(inode));
      tx.commitSync();
    } catch (e_20) {
      env_20.error = e_20;
      env_20.hasError = true;
    } finally {
      __disposeResources(env_20);
    }
  }
  transaction() {
    return new WrappedTransaction(this.store.transaction(), this);
  }
  async checkRoot() {
    const env_21 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_21, this.transaction(), true);
      if (await tx.get(rootIno))
        return;
      const inode = new Inode({ ino: rootIno, data: 1, mode: 511 | S_IFDIR });
      await tx.set(inode.data, encodeUTF8("{}"));
      this._add(rootIno, "/");
      await tx.set(rootIno, serialize(inode));
      await tx.commit();
    } catch (e_21) {
      env_21.error = e_21;
      env_21.hasError = true;
    } finally {
      const result_11 = __disposeResources(env_21);
      if (result_11)
        await result_11;
    }
  }
  checkRootSync() {
    const env_22 = { stack: [], error: undefined, hasError: false };
    try {
      const tx = __addDisposableResource(env_22, this.transaction(), false);
      if (tx.getSync(rootIno))
        return;
      const inode = new Inode({ ino: rootIno, data: 1, mode: 511 | S_IFDIR });
      tx.setSync(inode.data, encodeUTF8("{}"));
      this._add(rootIno, "/");
      tx.setSync(rootIno, serialize(inode));
      tx.commitSync();
    } catch (e_22) {
      env_22.error = e_22;
      env_22.hasError = true;
    } finally {
      __disposeResources(env_22);
    }
  }
  async _populate() {
    const env_23 = { stack: [], error: undefined, hasError: false };
    try {
      if (this._initialized) {
        warn("Attempted to populate tables after initialization");
        return;
      }
      debug("Populating tables with existing store metadata");
      const tx = __addDisposableResource(env_23, this.transaction(), true);
      const rootData = await tx.get(rootIno);
      if (!rootData) {
        notice("Store does not have a root inode");
        const inode = new Inode({ ino: rootIno, data: 1, mode: 511 | S_IFDIR });
        await tx.set(inode.data, encodeUTF8("{}"));
        this._add(rootIno, "/");
        await tx.set(rootIno, serialize(inode));
        await tx.commit();
        return;
      }
      if (rootData.length != __inode_sz) {
        crit("Store contains an invalid root inode. Refusing to populate tables");
        return;
      }
      const visitedDirectories = new Set;
      let i = 0;
      const queue = [["/", rootIno]];
      while (queue.length > 0) {
        i++;
        const [path, ino] = queue.shift();
        this._add(ino, path);
        const inodeData = await tx.get(ino);
        if (!inodeData) {
          warn("Store is missing data for inode: " + ino);
          continue;
        }
        if (inodeData.length != __inode_sz) {
          warn(`Invalid inode size for ino ${ino}: ${inodeData.length}`);
          continue;
        }
        const inode = new Inode(inodeData);
        if ((inode.mode & S_IFDIR) != S_IFDIR || visitedDirectories.has(ino)) {
          continue;
        }
        visitedDirectories.add(ino);
        const dirData = await tx.get(inode.data);
        if (!dirData) {
          warn("Store is missing directory data: " + inode.data);
          continue;
        }
        const dirListing = decodeDirListing(dirData);
        for (const [entryName, childIno] of Object.entries(dirListing)) {
          queue.push([join(path, entryName), childIno]);
        }
      }
      debug(`Added ${i} existing inode(s) from store`);
    } catch (e_23) {
      env_23.error = e_23;
      env_23.hasError = true;
    } finally {
      const result_12 = __disposeResources(env_23);
      if (result_12)
        await result_12;
    }
  }
  async findInode(tx, path, syscall) {
    var _a2;
    const ino = this._ids.get(path);
    if (ino === undefined)
      throw ErrnoError.With("ENOENT", path, syscall);
    return new Inode((_a2 = await tx.get(ino)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, syscall)));
  }
  findInodeSync(tx, path, syscall) {
    var _a2;
    const ino = this._ids.get(path);
    if (ino === undefined)
      throw ErrnoError.With("ENOENT", path, syscall);
    return new Inode((_a2 = tx.getSync(ino)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, syscall)));
  }
  allocNew(path, syscall) {
    var _a2;
    (_a2 = this._lastID) !== null && _a2 !== undefined || (this._lastID = Math.max(...this._paths.keys()));
    this._lastID += 2;
    const id = this._lastID;
    if (id > size_max)
      throw err(new ErrnoError(Errno.ENOSPC, "No IDs available", path, syscall), { fs: this });
    this._add(id, path);
    return id;
  }
  async commitNew(path, options, data, syscall) {
    var _a2;
    const env_24 = { stack: [], error: undefined, hasError: false };
    try {
      if (path == "/")
        throw ErrnoError.With("EEXIST", path, syscall);
      const tx = __addDisposableResource(env_24, this.transaction(), true);
      const { dir: parentPath, base: fname } = parse2(path);
      const parent = await this.findInode(tx, parentPath, syscall);
      const listing = decodeDirListing((_a2 = await tx.get(parent.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", parentPath, syscall)));
      if (listing[fname])
        throw ErrnoError.With("EEXIST", path, syscall);
      const id = this.allocNew(path, syscall);
      const inode = new Inode({
        ino: id,
        data: id + 1,
        mode: options.mode,
        size: data.byteLength,
        uid: parent.mode & S_ISUID ? parent.uid : options.uid,
        gid: parent.mode & S_ISGID ? parent.gid : options.gid
      });
      await tx.set(inode.ino, serialize(inode));
      await tx.set(inode.data, data);
      listing[fname] = inode.ino;
      await tx.set(parent.data, encodeDirListing(listing));
      await tx.commit();
      return inode;
    } catch (e_24) {
      env_24.error = e_24;
      env_24.hasError = true;
    } finally {
      const result_13 = __disposeResources(env_24);
      if (result_13)
        await result_13;
    }
  }
  commitNewSync(path, options, data, syscall) {
    var _a2;
    const env_25 = { stack: [], error: undefined, hasError: false };
    try {
      if (path == "/")
        throw ErrnoError.With("EEXIST", path, syscall);
      const tx = __addDisposableResource(env_25, this.transaction(), false);
      const { dir: parentPath, base: fname } = parse2(path);
      const parent = this.findInodeSync(tx, parentPath, syscall);
      const listing = decodeDirListing((_a2 = tx.getSync(parent.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", parentPath, syscall)));
      if (listing[fname])
        throw ErrnoError.With("EEXIST", path, syscall);
      const id = this.allocNew(path, syscall);
      const inode = new Inode({
        ino: id,
        data: id + 1,
        mode: options.mode,
        size: data.byteLength,
        uid: parent.mode & S_ISUID ? parent.uid : options.uid,
        gid: parent.mode & S_ISGID ? parent.gid : options.gid
      });
      tx.setSync(inode.ino, serialize(inode));
      tx.setSync(inode.data, data);
      listing[fname] = inode.ino;
      tx.setSync(parent.data, encodeDirListing(listing));
      tx.commitSync();
      return inode;
    } catch (e_25) {
      env_25.error = e_25;
      env_25.hasError = true;
    } finally {
      __disposeResources(env_25);
    }
  }
  async remove(path, isDir) {
    var _a2, _b2;
    const env_26 = { stack: [], error: undefined, hasError: false };
    try {
      const syscall = isDir ? "rmdir" : "unlink";
      const tx = __addDisposableResource(env_26, this.transaction(), true);
      const { dir: parent, base: fileName } = parse2(path), parentNode = await this.findInode(tx, parent, syscall), listing = decodeDirListing((_a2 = await tx.get(parentNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", parent, syscall)));
      if (!listing[fileName]) {
        throw ErrnoError.With("ENOENT", path, syscall);
      }
      const fileIno = listing[fileName];
      const fileNode = new Inode((_b2 = await tx.get(fileIno)) !== null && _b2 !== undefined ? _b2 : _throw(ErrnoError.With("ENOENT", path, syscall)));
      delete listing[fileName];
      if (!isDir && fileNode.toStats().isDirectory())
        throw ErrnoError.With("EISDIR", path, syscall);
      await tx.set(parentNode.data, encodeDirListing(listing));
      if (--fileNode.nlink < 1) {
        await tx.remove(fileNode.data);
        await tx.remove(fileIno);
        this._remove(fileIno);
      }
      await tx.commit();
    } catch (e_26) {
      env_26.error = e_26;
      env_26.hasError = true;
    } finally {
      const result_14 = __disposeResources(env_26);
      if (result_14)
        await result_14;
    }
  }
  removeSync(path, isDir) {
    var _a2, _b2;
    const env_27 = { stack: [], error: undefined, hasError: false };
    try {
      const syscall = isDir ? "rmdir" : "unlink";
      const tx = __addDisposableResource(env_27, this.transaction(), false);
      const { dir: parent, base: fileName } = parse2(path), parentNode = this.findInodeSync(tx, parent, syscall), listing = decodeDirListing((_a2 = tx.getSync(parentNode.data)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", parent, syscall))), fileIno = listing[fileName];
      if (!fileIno)
        throw ErrnoError.With("ENOENT", path, syscall);
      const fileNode = new Inode((_b2 = tx.getSync(fileIno)) !== null && _b2 !== undefined ? _b2 : _throw(ErrnoError.With("ENOENT", path, syscall)));
      delete listing[fileName];
      if (!isDir && fileNode.toStats().isDirectory()) {
        throw ErrnoError.With("EISDIR", path, syscall);
      }
      tx.setSync(parentNode.data, encodeDirListing(listing));
      if (--fileNode.nlink < 1) {
        tx.removeSync(fileNode.data);
        tx.removeSync(fileIno);
        this._remove(fileIno);
      }
      tx.commitSync();
    } catch (e_27) {
      env_27.error = e_27;
      env_27.hasError = true;
    } finally {
      __disposeResources(env_27);
    }
  }
}

// node_modules/@zenfs/core/dist/backends/store/map.js
class SyncMapTransaction extends SyncTransaction {
  async keys() {
    return this.store.keys();
  }
  async get(id) {
    var _a2, _b2, _c2;
    return await ((_c2 = (_b2 = (_a2 = this.store).getAsync) === null || _b2 === undefined ? undefined : _b2.call(_a2, id)) !== null && _c2 !== undefined ? _c2 : this.store.get(id));
  }
  getSync(id) {
    return this.store.get(id);
  }
  setSync(id, data) {
    this.store.set(id, data);
  }
  removeSync(id) {
    this.store.delete(id);
  }
}

// node_modules/@zenfs/core/dist/backends/memory.js
class InMemoryStore extends Map {
  constructor(maxSize = size_max, label) {
    super();
    this.maxSize = maxSize;
    this.label = label;
    this.flags = [];
    this.name = "tmpfs";
  }
  async sync() {
  }
  transaction() {
    return new SyncMapTransaction(this);
  }
  get bytes() {
    let size = this.size * 4;
    for (const data of this.values())
      size += data.byteLength;
    return size;
  }
  usage() {
    return {
      totalSpace: this.maxSize,
      freeSpace: this.maxSize - this.bytes
    };
  }
}
var _InMemory = {
  name: "InMemory",
  options: {
    maxSize: { type: "number", required: false },
    label: { type: "string", required: false },
    name: { type: "string", required: false }
  },
  create({ maxSize, label, name }) {
    const fs = new StoreFS(new InMemoryStore(maxSize, label !== null && label !== undefined ? label : name));
    fs.checkRootSync();
    return fs;
  }
};
var InMemory = _InMemory;

// node_modules/@zenfs/core/dist/internal/devices.js
var __addDisposableResource2 = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources2 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});

class DeviceFile extends File {
  constructor(fs, path, device) {
    super(fs, path);
    this.fs = fs;
    this.device = device;
    this.position = 0;
    this.stats = new Inode({
      mode: (this.driver.isBuffered ? S_IFBLK : S_IFCHR) | 438
    });
  }
  get driver() {
    return this.device.driver;
  }
  async stat() {
    return Promise.resolve(new Stats(this.stats));
  }
  statSync() {
    return new Stats(this.stats);
  }
  readSync(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    this.stats.atimeMs = Date.now();
    const end = position + length;
    this.position = end;
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.driver.readD(this.device, uint8.subarray(offset, length), position, end);
    return length;
  }
  async read(buffer, offset, length) {
    return { bytesRead: this.readSync(buffer, offset, length), buffer };
  }
  writeSync(buffer, offset = 0, length = buffer.byteLength - offset, position = this.position) {
    const end = position + length;
    if (end > this.stats.size)
      this.stats.size = end;
    this.stats.mtimeMs = Date.now();
    this.position = end;
    const data = buffer.subarray(offset, offset + length);
    this.driver.writeD(this.device, data, position);
    return length;
  }
  async write(buffer, offset, length, position) {
    return this.writeSync(buffer, offset, length, position);
  }
  async truncate(length) {
    const { size } = await this.stat();
    const buffer = new Uint8Array(length > size ? length - size : 0);
    await this.write(buffer, 0, buffer.length, length > size ? size : length);
  }
  truncateSync(length) {
    const { size } = this.statSync();
    const buffer = new Uint8Array(length > size ? length - size : 0);
    this.writeSync(buffer, 0, buffer.length, length > size ? size : length);
  }
  closeSync() {
    var _a2, _b2;
    (_b2 = (_a2 = this.driver).close) === null || _b2 === undefined || _b2.call(_a2, this);
  }
  close() {
    this.closeSync();
    return Promise.resolve();
  }
  syncSync() {
    var _a2, _b2;
    (_b2 = (_a2 = this.driver).sync) === null || _b2 === undefined || _b2.call(_a2, this);
  }
  sync() {
    this.syncSync();
    return Promise.resolve();
  }
  chown() {
    throw ErrnoError.With("ENOTSUP", this.path, "chown");
  }
  chownSync() {
    throw ErrnoError.With("ENOTSUP", this.path, "chown");
  }
  chmod() {
    throw ErrnoError.With("ENOTSUP", this.path, "chmod");
  }
  chmodSync() {
    throw ErrnoError.With("ENOTSUP", this.path, "chmod");
  }
  utimes() {
    throw ErrnoError.With("ENOTSUP", this.path, "utimes");
  }
  utimesSync() {
    throw ErrnoError.With("ENOTSUP", this.path, "utimes");
  }
}

class DeviceFS extends StoreFS {
  createDevice(path, driver, options = {}) {
    var _a2;
    log_deprecated("DeviceFS#createDevice");
    if (this.existsSync(path)) {
      throw ErrnoError.With("EEXIST", path, "mknod");
    }
    let ino = 1;
    const silence = canary(ErrnoError.With("EDEADLK", path, "mknod"));
    while (this.store.has(ino))
      ino++;
    silence();
    const dev = {
      driver,
      ino,
      data: {},
      minor: 0,
      major: 0,
      ...(_a2 = driver.init) === null || _a2 === undefined ? undefined : _a2.call(driver, ino, options)
    };
    this.devices.set(path, dev);
    return dev;
  }
  devicesWithDriver(driver, forceIdentity) {
    if (forceIdentity && typeof driver == "string") {
      throw err(new ErrnoError(Errno.EINVAL, "Can not fetch devices using only a driver name"), { fs: this });
    }
    const devs = [];
    for (const device of this.devices.values()) {
      if (forceIdentity && device.driver != driver)
        continue;
      const name = typeof driver == "string" ? driver : driver.name;
      if (name == device.driver.name)
        devs.push(device);
    }
    return devs;
  }
  _createDevice(driver, options = {}) {
    var _a2;
    let ino = 1;
    while (this.store.has(ino))
      ino++;
    const dev = {
      driver,
      ino,
      data: {},
      minor: 0,
      major: 0,
      ...(_a2 = driver.init) === null || _a2 === undefined ? undefined : _a2.call(driver, ino, options)
    };
    const path = "/" + (dev.name || driver.name) + (driver.singleton ? "" : this.devicesWithDriver(driver).length);
    if (this.existsSync(path))
      throw ErrnoError.With("EEXIST", path, "mknod");
    this.devices.set(path, dev);
    info("Initialized device: " + this._mountPoint + path);
    return dev;
  }
  addDefaults() {
    this._createDevice(nullDevice);
    this._createDevice(zeroDevice);
    this._createDevice(fullDevice);
    this._createDevice(randomDevice);
    this._createDevice(consoleDevice);
    debug("Added default devices");
  }
  constructor() {
    super(new InMemoryStore(16777216, "devfs"));
    this.devices = new Map;
  }
  async rename(oldPath, newPath) {
    if (this.devices.has(oldPath)) {
      throw ErrnoError.With("EPERM", oldPath, "rename");
    }
    if (this.devices.has(newPath)) {
      throw ErrnoError.With("EEXIST", newPath, "rename");
    }
    return super.rename(oldPath, newPath);
  }
  renameSync(oldPath, newPath) {
    if (this.devices.has(oldPath)) {
      throw ErrnoError.With("EPERM", oldPath, "rename");
    }
    if (this.devices.has(newPath)) {
      throw ErrnoError.With("EEXIST", newPath, "rename");
    }
    return super.renameSync(oldPath, newPath);
  }
  async stat(path) {
    if (this.devices.has(path)) {
      const env_1 = { stack: [], error: undefined, hasError: false };
      try {
        const file = __addDisposableResource2(env_1, await this.openFile(path, "r"), true);
        return file.stat();
      } catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
      } finally {
        const result_1 = __disposeResources2(env_1);
        if (result_1)
          await result_1;
      }
    }
    return super.stat(path);
  }
  statSync(path) {
    if (this.devices.has(path)) {
      const env_2 = { stack: [], error: undefined, hasError: false };
      try {
        const file = __addDisposableResource2(env_2, this.openFileSync(path, "r"), false);
        return file.statSync();
      } catch (e_2) {
        env_2.error = e_2;
        env_2.hasError = true;
      } finally {
        __disposeResources2(env_2);
      }
    }
    return super.statSync(path);
  }
  async openFile(path, flag) {
    if (this.devices.has(path)) {
      return new DeviceFile(this, path, this.devices.get(path));
    }
    return await super.openFile(path, flag);
  }
  openFileSync(path, flag) {
    if (this.devices.has(path)) {
      return new DeviceFile(this, path, this.devices.get(path));
    }
    return super.openFileSync(path, flag);
  }
  async createFile(path, flag, mode, options) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EEXIST", path, "createFile");
    }
    return super.createFile(path, flag, mode, options);
  }
  createFileSync(path, flag, mode, options) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EEXIST", path, "createFile");
    }
    return super.createFileSync(path, flag, mode, options);
  }
  async unlink(path) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EPERM", path, "unlink");
    }
    return super.unlink(path);
  }
  unlinkSync(path) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EPERM", path, "unlink");
    }
    return super.unlinkSync(path);
  }
  async rmdir(path) {
    return super.rmdir(path);
  }
  rmdirSync(path) {
    return super.rmdirSync(path);
  }
  async mkdir(path, mode, options) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EEXIST", path, "mkdir");
    }
    return super.mkdir(path, mode, options);
  }
  mkdirSync(path, mode, options) {
    if (this.devices.has(path)) {
      throw ErrnoError.With("EEXIST", path, "mkdir");
    }
    return super.mkdirSync(path, mode, options);
  }
  async readdir(path) {
    const entries2 = await super.readdir(path);
    for (const dev of this.devices.keys()) {
      if (dirname(dev) == path) {
        entries2.push(basename(dev));
      }
    }
    return entries2;
  }
  readdirSync(path) {
    const entries2 = super.readdirSync(path);
    for (const dev of this.devices.keys()) {
      if (dirname(dev) == path) {
        entries2.push(basename(dev));
      }
    }
    return entries2;
  }
  async link(target, link) {
    if (this.devices.has(target)) {
      throw ErrnoError.With("EPERM", target, "rmdir");
    }
    if (this.devices.has(link)) {
      throw ErrnoError.With("EEXIST", link, "link");
    }
    return super.link(target, link);
  }
  linkSync(target, link) {
    if (this.devices.has(target)) {
      throw ErrnoError.With("EPERM", target, "rmdir");
    }
    if (this.devices.has(link)) {
      throw ErrnoError.With("EEXIST", link, "link");
    }
    return super.linkSync(target, link);
  }
  async sync(path, data, stats) {
    if (this.devices.has(path)) {
      throw alert(new ErrnoError(Errno.EINVAL, "Attempted to sync a device incorrectly (bug)", path, "sync"), { fs: this });
    }
    return super.sync(path, data, stats);
  }
  syncSync(path, data, stats) {
    if (this.devices.has(path)) {
      throw alert(new ErrnoError(Errno.EINVAL, "Attempted to sync a device incorrectly (bug)", path, "sync"), { fs: this });
    }
    return super.syncSync(path, data, stats);
  }
  async read(path, buffer, offset, end) {
    const device = this.devices.get(path);
    if (!device) {
      await super.read(path, buffer, offset, end);
      return;
    }
    device.driver.readD(device, buffer, offset, end);
  }
  readSync(path, buffer, offset, end) {
    const device = this.devices.get(path);
    if (!device) {
      super.readSync(path, buffer, offset, end);
      return;
    }
    device.driver.readD(device, buffer, offset, end);
  }
  async write(path, data, offset) {
    const device = this.devices.get(path);
    if (!device) {
      return await super.write(path, data, offset);
    }
    device.driver.writeD(device, data, offset);
  }
  writeSync(path, data, offset) {
    const device = this.devices.get(path);
    if (!device) {
      return super.writeSync(path, data, offset);
    }
    device.driver.writeD(device, data, offset);
  }
}
function defaultWrite(device, data, offset) {
  return;
}
var emptyBuffer = new Uint8Array;
var nullDevice = {
  name: "null",
  singleton: true,
  init() {
    return { major: 1, minor: 3 };
  },
  read() {
    return 0;
  },
  readD() {
    return emptyBuffer;
  },
  writeD: defaultWrite
};
var zeroDevice = {
  name: "zero",
  singleton: true,
  init() {
    return { major: 1, minor: 5 };
  },
  readD(device, buffer, offset, end) {
    buffer.fill(0, offset, end);
  },
  writeD: defaultWrite
};
var fullDevice = {
  name: "full",
  singleton: true,
  init() {
    return { major: 1, minor: 7 };
  },
  readD(device, buffer, offset, end) {
    buffer.fill(0, offset, end);
  },
  write(file) {
    throw ErrnoError.With("ENOSPC", file.path, "write");
  },
  writeD() {
    throw ErrnoError.With("ENOSPC", undefined, "write");
  }
};
var randomDevice = {
  name: "random",
  singleton: true,
  init() {
    return { major: 1, minor: 8 };
  },
  readD(device, buffer) {
    for (let i = 0;i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  },
  writeD: defaultWrite
};
var consoleDevice = {
  name: "console",
  singleton: true,
  init(ino, { output: output2 = (text) => console.log(text) } = {}) {
    return { major: 5, minor: 1, data: { output: output2 } };
  },
  readD() {
    return emptyBuffer;
  },
  writeD(device, buffer, offset) {
    const text = decodeUTF8(buffer);
    device.data.output(text, offset);
  }
};

// node_modules/@zenfs/core/dist/vfs/index.js
var exports_vfs = {};
__export(exports_vfs, {
  writevSync: () => writevSync,
  writev: () => writev,
  writeSync: () => writeSync,
  writeFileSync: () => writeFileSync,
  writeFile: () => writeFile2,
  write: () => write,
  watchFile: () => watchFile,
  watch: () => watch2,
  utimesSync: () => utimesSync,
  utimes: () => utimes2,
  unwatchFile: () => unwatchFile,
  unlinkSync: () => unlinkSync,
  unlink: () => unlink2,
  umount: () => umount,
  truncateSync: () => truncateSync,
  truncate: () => truncate2,
  symlinkSync: () => symlinkSync,
  symlink: () => symlink2,
  statfsSync: () => statfsSync,
  statfs: () => statfs2,
  statSync: () => statSync,
  stat: () => stat2,
  rmdirSync: () => rmdirSync,
  rmdir: () => rmdir2,
  rmSync: () => rmSync,
  rm: () => rm2,
  renameSync: () => renameSync,
  rename: () => rename2,
  realpathSync: () => realpathSync,
  realpath: () => realpath2,
  readvSync: () => readvSync,
  readv: () => readv,
  readlinkSync: () => readlinkSync,
  readlink: () => readlink2,
  readdirSync: () => readdirSync,
  readdir: () => readdir2,
  readSync: () => readSync,
  readFileSync: () => readFileSync,
  readFile: () => readFile2,
  read: () => read,
  promises: () => exports_promises,
  opendirSync: () => opendirSync,
  opendir: () => opendir2,
  openSync: () => openSync,
  openAsBlob: () => openAsBlob,
  open: () => open2,
  mounts: () => mounts,
  mountObject: () => mountObject,
  mount: () => mount,
  mkdtempSync: () => mkdtempSync,
  mkdtemp: () => mkdtemp2,
  mkdirSync: () => mkdirSync,
  mkdir: () => mkdir2,
  lutimesSync: () => lutimesSync,
  lutimes: () => lutimes2,
  lstatSync: () => lstatSync,
  lstat: () => lstat2,
  lopenSync: () => lopenSync,
  linkSync: () => linkSync,
  link: () => link2,
  lchownSync: () => lchownSync,
  lchown: () => lchown2,
  lchmodSync: () => lchmodSync,
  lchmod: () => lchmod2,
  globSync: () => globSync,
  glob: () => glob2,
  futimesSync: () => futimesSync,
  futimes: () => futimes,
  ftruncateSync: () => ftruncateSync,
  ftruncate: () => ftruncate,
  fsyncSync: () => fsyncSync,
  fsync: () => fsync,
  fstatSync: () => fstatSync,
  fstat: () => fstat,
  fdatasyncSync: () => fdatasyncSync,
  fdatasync: () => fdatasync,
  fchownSync: () => fchownSync,
  fchown: () => fchown,
  fchmodSync: () => fchmodSync,
  fchmod: () => fchmod,
  existsSync: () => existsSync,
  exists: () => exists2,
  createWriteStream: () => createWriteStream,
  createReadStream: () => createReadStream,
  cpSync: () => cpSync,
  cp: () => cp2,
  copyFileSync: () => copyFileSync,
  copyFile: () => copyFile2,
  constants: () => exports_constants,
  closeSync: () => closeSync,
  close: () => close,
  chroot: () => chroot,
  chownSync: () => chownSync,
  chown: () => chown2,
  chmodSync: () => chmodSync,
  chmod: () => chmod2,
  appendFileSync: () => appendFileSync,
  appendFile: () => appendFile2,
  accessSync: () => accessSync,
  access: () => access2,
  WriteStream: () => WriteStream,
  StatsFs: () => StatsFs,
  Stats: () => Stats,
  ReadStream: () => ReadStream,
  Dirent: () => Dirent,
  Dir: () => Dir,
  BigIntStatsFs: () => BigIntStatsFs
});

// node_modules/@zenfs/core/dist/vfs/async.js
init_buffer();

// node_modules/@zenfs/core/dist/vfs/promises.js
var exports_promises = {};
__export(exports_promises, {
  writeFile: () => writeFile,
  watch: () => watch,
  utimes: () => utimes,
  unlink: () => unlink,
  truncate: () => truncate,
  symlink: () => symlink,
  statfs: () => statfs,
  stat: () => stat,
  rmdir: () => rmdir,
  rm: () => rm,
  rename: () => rename,
  realpath: () => realpath,
  readlink: () => readlink,
  readdir: () => readdir,
  readFile: () => readFile,
  opendir: () => opendir,
  open: () => open,
  mkdtemp: () => mkdtemp,
  mkdir: () => mkdir,
  lutimes: () => lutimes,
  lstat: () => lstat,
  link: () => link,
  lchown: () => lchown,
  lchmod: () => lchmod,
  glob: () => glob,
  exists: () => exists,
  cp: () => cp,
  copyFile: () => copyFile,
  constants: () => exports_constants,
  chown: () => chown,
  chmod: () => chmod,
  appendFile: () => appendFile,
  access: () => access,
  FileHandle: () => FileHandle
});
init_buffer();

// node_modules/@zenfs/core/dist/vfs/sync.js
init_buffer();

// node_modules/@zenfs/core/dist/context.js
function _bindFunctions(fns, thisValue) {
  return Object.fromEntries(Object.entries(fns).map(([k, v2]) => [k, typeof v2 == "function" ? v2.bind(thisValue) : v2]));
}
function bindContext(root, credentials2 = structuredClone(credentials)) {
  const ctx = {
    root,
    credentials: createCredentials(credentials2)
  };
  const fn_fs = _bindFunctions(exports_vfs, ctx);
  const fn_promises = _bindFunctions(exports_promises, ctx);
  return { ...ctx, fs: { ...exports_vfs, ...fn_fs, promises: { ...exports_promises, ...fn_promises } } };
}

// node_modules/@zenfs/core/dist/vfs/shared.js
var fdMap = new Map;
var nextFd = 100;
function file2fd(file) {
  const fd = nextFd++;
  fdMap.set(fd, file);
  return fd;
}
function fd2file(fd) {
  if (!fdMap.has(fd)) {
    throw new ErrnoError(Errno.EBADF);
  }
  return fdMap.get(fd);
}
var mounts = new Map;
mount("/", InMemory.create({ name: "root" }));
function mount(mountPoint, fs) {
  if (mountPoint[0] != "/")
    mountPoint = "/" + mountPoint;
  mountPoint = resolve(mountPoint);
  if (mounts.has(mountPoint))
    throw err(new ErrnoError(Errno.EINVAL, "Mount point is already in use: " + mountPoint));
  fs._mountPoint = mountPoint;
  mounts.set(mountPoint, fs);
  info(`Mounted ${fs.name} on ${mountPoint}`);
  debug(`${fs.name} attributes: ${[...fs.attributes].map(([k, v2]) => v2 !== undefined && v2 !== null ? k + "=" + v2 : k).join(", ")}`);
}
function umount(mountPoint) {
  if (mountPoint[0] != "/")
    mountPoint = "/" + mountPoint;
  mountPoint = resolve(mountPoint);
  if (!mounts.has(mountPoint)) {
    warn(mountPoint + " is already unmounted");
    return;
  }
  mounts.delete(mountPoint);
  notice("Unmounted " + mountPoint);
}
function resolveMount(path, ctx) {
  const root = (ctx === null || ctx === undefined ? undefined : ctx.root) || "/";
  path = normalizePath(join(root, path));
  const sortedMounts = [...mounts].sort((a, b2) => a[0].length > b2[0].length ? -1 : 1);
  for (const [mountPoint, fs] of sortedMounts) {
    if (_isParentOf(mountPoint, path)) {
      path = path.slice(mountPoint.length > 1 ? mountPoint.length : 0);
      if (path === "")
        path = root;
      return { fs, path, mountPoint, root };
    }
  }
  throw alert(new ErrnoError(Errno.EIO, "No file system", path));
}
function fixPaths(text, paths) {
  for (const [from, to] of Object.entries(paths)) {
    text = text === null || text === undefined ? undefined : text.replaceAll(from, to);
  }
  return text;
}
function fixError(e, paths) {
  if (typeof e.stack == "string") {
    e.stack = fixPaths(e.stack, paths);
  }
  try {
    e.message = fixPaths(e.message, paths);
  } catch {
  }
  if (e.path)
    e.path = fixPaths(e.path, paths);
  return e;
}
function mountObject(mounts2) {
  log_deprecated("mountObject");
  if ("/" in mounts2) {
    umount("/");
  }
  for (const [point, fs] of Object.entries(mounts2)) {
    mount(point, fs);
  }
}
function _statfs(fs, bigint) {
  const md = fs.usage();
  const bs = md.blockSize || 4096;
  return {
    type: (bigint ? BigInt : Number)(fs.id),
    bsize: (bigint ? BigInt : Number)(bs),
    ffree: (bigint ? BigInt : Number)(md.freeNodes || size_max),
    files: (bigint ? BigInt : Number)(md.totalNodes || size_max),
    bavail: (bigint ? BigInt : Number)(md.freeSpace / bs),
    bfree: (bigint ? BigInt : Number)(md.freeSpace / bs),
    blocks: (bigint ? BigInt : Number)(md.totalSpace / bs)
  };
}
function chroot(path, inPlace) {
  const creds = this === null || this === undefined ? undefined : this.credentials;
  if ((creds === null || creds === undefined ? undefined : creds.uid) && (creds === null || creds === undefined ? undefined : creds.gid) && (creds === null || creds === undefined ? undefined : creds.euid) && (creds === null || creds === undefined ? undefined : creds.egid)) {
    throw new ErrnoError(Errno.EPERM, "Can not chroot() as non-root user");
  }
  if (inPlace && this) {
    this.root += path;
    return this;
  }
  return bindContext(join((this === null || this === undefined ? undefined : this.root) || "/", path), creds);
}
function _isParentOf(parent, child) {
  if (parent === "/" || parent === child)
    return true;
  if (!parent.endsWith("/"))
    parent += "/";
  return child.startsWith(parent);
}

// node_modules/@zenfs/core/dist/vfs/watchers.js
class Watcher extends import__.default {
  off(event, fn, context, once) {
    return super.off(event, fn, context, once);
  }
  removeListener(event, fn, context, once) {
    return super.removeListener(event, fn, context, once);
  }
  constructor(_context, path) {
    super();
    this._context = _context;
    this.path = path;
  }
  setMaxListeners() {
    throw ErrnoError.With("ENOSYS", this.path, "Watcher.setMaxListeners");
  }
  getMaxListeners() {
    throw ErrnoError.With("ENOSYS", this.path, "Watcher.getMaxListeners");
  }
  prependListener() {
    throw ErrnoError.With("ENOSYS", this.path, "Watcher.prependListener");
  }
  prependOnceListener() {
    throw ErrnoError.With("ENOSYS", this.path, "Watcher.prependOnceListener");
  }
  rawListeners() {
    throw ErrnoError.With("ENOSYS", this.path, "Watcher.rawListeners");
  }
  ref() {
    return this;
  }
  unref() {
    return this;
  }
}

class FSWatcher extends Watcher {
  constructor(context, path, options) {
    super(context, path);
    this.options = options;
    this.realpath = (context === null || context === undefined ? undefined : context.root) ? join(context.root, path) : path;
    addWatcher(this.realpath, this);
  }
  close() {
    super.emit("close");
    removeWatcher(this.realpath, this);
  }
  [Symbol.dispose]() {
    this.close();
  }
}

class StatWatcher extends Watcher {
  constructor(context, path, options) {
    super(context, path);
    this.options = options;
    this.start();
  }
  onInterval() {
    try {
      const current = statSync(this.path);
      if (!isStatsEqual(this.previous, current)) {
        this.emit("change", current, this.previous);
        this.previous = current;
      }
    } catch (e) {
      this.emit("error", e);
    }
  }
  start() {
    const interval = this.options.interval || 5000;
    try {
      this.previous = statSync(this.path);
    } catch (e) {
      this.emit("error", e);
      return;
    }
    this.intervalId = setInterval(this.onInterval.bind(this), interval);
    if (!this.options.persistent && typeof this.intervalId == "object") {
      this.intervalId.unref();
    }
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.removeAllListeners();
  }
}
var watchers = new Map;
function addWatcher(path, watcher) {
  const normalizedPath = normalizePath(path);
  if (!watchers.has(normalizedPath)) {
    watchers.set(normalizedPath, new Set);
  }
  watchers.get(normalizedPath).add(watcher);
}
function removeWatcher(path, watcher) {
  const normalizedPath = normalizePath(path);
  if (watchers.has(normalizedPath)) {
    watchers.get(normalizedPath).delete(watcher);
    if (watchers.get(normalizedPath).size === 0) {
      watchers.delete(normalizedPath);
    }
  }
}
function emitChange(context, eventType, filename) {
  var _a2;
  if (context)
    filename = join((_a2 = context.root) !== null && _a2 !== undefined ? _a2 : "/", filename);
  filename = normalizePath(filename);
  for (let path = filename;path != "/"; path = dirname(path)) {
    const watchersForPath = watchers.get(path);
    if (!watchersForPath)
      continue;
    for (const watcher of watchersForPath) {
      watcher.emit("change", eventType, relative(path, filename) || basename(filename));
    }
  }
}

// node_modules/@zenfs/core/dist/vfs/sync.js
var __addDisposableResource3 = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources3 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
function renameSync(oldPath, newPath) {
  oldPath = normalizePath(oldPath);
  newPath = normalizePath(newPath);
  const oldMount = resolveMount(oldPath, this);
  const newMount = resolveMount(newPath, this);
  if (config.checkAccess && !statSync.call(this, dirname(oldPath)).hasAccess(W_OK, this)) {
    throw ErrnoError.With("EACCES", oldPath, "rename");
  }
  try {
    if (oldMount === newMount) {
      oldMount.fs.renameSync(oldMount.path, newMount.path);
      emitChange(this, "rename", oldPath.toString());
      emitChange(this, "change", newPath.toString());
      return;
    }
    writeFileSync.call(this, newPath, readFileSync(oldPath));
    unlinkSync.call(this, oldPath);
    emitChange(this, "rename", oldPath.toString());
  } catch (e) {
    throw fixError(e, { [oldMount.path]: oldPath, [newMount.path]: newPath });
  }
}
function existsSync(path) {
  path = normalizePath(path);
  try {
    const { fs, path: resolvedPath } = resolveMount(realpathSync.call(this, path), this);
    return fs.existsSync(resolvedPath);
  } catch (e) {
    if (e.errno == Errno.ENOENT) {
      return false;
    }
    throw e;
  }
}
function statSync(path, options) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(realpathSync.call(this, path), this);
  try {
    const stats = fs.statSync(resolved);
    if (config.checkAccess && !stats.hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "stat");
    }
    return (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats;
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
function lstatSync(path, options) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(path, this);
  try {
    const stats = fs.statSync(resolved);
    return (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats;
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
function truncateSync(path, len = 0) {
  const env_1 = { stack: [], error: undefined, hasError: false };
  try {
    const file = __addDisposableResource3(env_1, _openSync.call(this, path, { flag: "r+" }), false);
    len || (len = 0);
    if (len < 0) {
      throw new ErrnoError(Errno.EINVAL);
    }
    file.truncateSync(len);
  } catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
  } finally {
    __disposeResources3(env_1);
  }
}
function unlinkSync(path) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(path, this);
  try {
    if (config.checkAccess && !fs.statSync(resolved).hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "unlink");
    }
    fs.unlinkSync(resolved);
    emitChange(this, "rename", path.toString());
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
function applySetId(file, uid, gid) {
  if (file.fs.attributes.has("setid"))
    return;
  const parent = file.fs.statSync(dirname(file.path));
  file.chownSync(parent.mode & S_ISUID ? parent.uid : uid, parent.mode & S_ISGID ? parent.gid : gid);
}
function _openSync(path, opt) {
  var _a2;
  path = normalizePath(path);
  const mode = normalizeMode(opt.mode, 420), flag = parseFlag(opt.flag);
  path = opt.preserveSymlinks ? path : realpathSync.call(this, path);
  const { fs, path: resolved } = resolveMount(path, this);
  let stats;
  try {
    stats = fs.statSync(resolved);
  } catch {
  }
  if (!stats) {
    if (!isWriteable(flag) && !isAppendable(flag) || flag == "r+") {
      throw ErrnoError.With("ENOENT", path, "_open");
    }
    const parentStats = fs.statSync(dirname(resolved));
    if (config.checkAccess && !parentStats.hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", dirname(path), "_open");
    }
    if (!parentStats.isDirectory()) {
      throw ErrnoError.With("ENOTDIR", dirname(path), "_open");
    }
    const { euid: uid, egid: gid } = (_a2 = this === null || this === undefined ? undefined : this.credentials) !== null && _a2 !== undefined ? _a2 : credentials;
    const file2 = fs.createFileSync(resolved, flag, mode, { uid, gid });
    if (!opt.allowDirectory && mode & S_IFDIR)
      throw ErrnoError.With("EISDIR", path, "_open");
    applySetId(file2, uid, gid);
    return file2;
  }
  if (config.checkAccess && (!stats.hasAccess(mode, this) || !stats.hasAccess(flagToMode(flag), this))) {
    throw ErrnoError.With("EACCES", path, "_open");
  }
  if (isExclusive(flag)) {
    throw ErrnoError.With("EEXIST", path, "_open");
  }
  const file = fs.openFileSync(resolved, flag);
  if (isTruncating(flag)) {
    file.truncateSync(0);
  }
  if (!opt.allowDirectory && stats.mode & S_IFDIR)
    throw ErrnoError.With("EISDIR", path, "_open");
  return file;
}
function openSync(path, flag, mode = F_OK) {
  return file2fd(_openSync.call(this, path, { flag, mode }));
}
function lopenSync(path, flag, mode) {
  return file2fd(_openSync.call(this, path, { flag, mode, preserveSymlinks: true }));
}
function _readFileSync(path, flag, preserveSymlinks) {
  const env_2 = { stack: [], error: undefined, hasError: false };
  try {
    path = normalizePath(path);
    const file = __addDisposableResource3(env_2, _openSync.call(this, path, { flag, mode: 420, preserveSymlinks }), false);
    const stat = file.statSync();
    const data = new Uint8Array(stat.size);
    file.readSync(data, 0, stat.size, 0);
    return data;
  } catch (e_2) {
    env_2.error = e_2;
    env_2.hasError = true;
  } finally {
    __disposeResources3(env_2);
  }
}
function readFileSync(path, _options = {}) {
  const options = normalizeOptions(_options, null, "r", 420);
  const flag = parseFlag(options.flag);
  if (!isReadable(flag)) {
    throw new ErrnoError(Errno.EINVAL, "Flag passed to readFile must allow for reading");
  }
  const data = export_Buffer.from(_readFileSync.call(this, typeof path == "number" ? fd2file(path).path : path, options.flag, false));
  return options.encoding ? data.toString(options.encoding) : data;
}
function writeFileSync(path, data, _options = {}) {
  const env_3 = { stack: [], error: undefined, hasError: false };
  try {
    const options = normalizeOptions(_options, "utf8", "w+", 420);
    const flag = parseFlag(options.flag);
    if (!isWriteable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed to writeFile must allow for writing");
    }
    if (typeof data != "string" && !options.encoding) {
      throw new ErrnoError(Errno.EINVAL, "Encoding not specified");
    }
    const encodedData = typeof data == "string" ? export_Buffer.from(data, options.encoding) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (!encodedData) {
      throw new ErrnoError(Errno.EINVAL, "Data not specified");
    }
    const file = __addDisposableResource3(env_3, _openSync.call(this, typeof path == "number" ? fd2file(path).path : path.toString(), {
      flag,
      mode: options.mode,
      preserveSymlinks: true
    }), false);
    file.writeSync(encodedData, 0, encodedData.byteLength, 0);
    emitChange(this, "change", path.toString());
  } catch (e_3) {
    env_3.error = e_3;
    env_3.hasError = true;
  } finally {
    __disposeResources3(env_3);
  }
}
function appendFileSync(filename, data, _options = {}) {
  const env_4 = { stack: [], error: undefined, hasError: false };
  try {
    const options = normalizeOptions(_options, "utf8", "a+", 420);
    const flag = parseFlag(options.flag);
    if (!isAppendable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed to appendFile must allow for appending");
    }
    if (typeof data != "string" && !options.encoding) {
      throw new ErrnoError(Errno.EINVAL, "Encoding not specified");
    }
    const encodedData = typeof data == "string" ? export_Buffer.from(data, options.encoding) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const file = __addDisposableResource3(env_4, _openSync.call(this, typeof filename == "number" ? fd2file(filename).path : filename.toString(), {
      flag,
      mode: options.mode,
      preserveSymlinks: true
    }), false);
    file.writeSync(encodedData, 0, encodedData.byteLength);
  } catch (e_4) {
    env_4.error = e_4;
    env_4.hasError = true;
  } finally {
    __disposeResources3(env_4);
  }
}
function fstatSync(fd, options) {
  const stats = fd2file(fd).statSync();
  return (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats;
}
function closeSync(fd) {
  fd2file(fd).closeSync();
  fdMap.delete(fd);
}
function ftruncateSync(fd, len = 0) {
  len || (len = 0);
  if (len < 0) {
    throw new ErrnoError(Errno.EINVAL);
  }
  fd2file(fd).truncateSync(len);
}
function fsyncSync(fd) {
  fd2file(fd).syncSync();
}
function fdatasyncSync(fd) {
  fd2file(fd).datasyncSync();
}
function writeSync(fd, data, posOrOff, lenOrEnc, pos) {
  let buffer, offset, length, position;
  if (typeof data === "string") {
    position = typeof posOrOff === "number" ? posOrOff : null;
    const encoding = typeof lenOrEnc === "string" ? lenOrEnc : "utf8";
    offset = 0;
    buffer = export_Buffer.from(data, encoding);
    length = buffer.byteLength;
  } else {
    buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    offset = posOrOff;
    length = lenOrEnc;
    position = typeof pos === "number" ? pos : null;
  }
  const file = fd2file(fd);
  position !== null && position !== undefined || (position = file.position);
  const bytesWritten = file.writeSync(buffer, offset, length, position);
  emitChange(this, "change", file.path);
  return bytesWritten;
}
function readSync(fd, buffer, options, length, position) {
  const file = fd2file(fd);
  const offset = typeof options == "object" ? options.offset : options;
  if (typeof options == "object") {
    length = options.length;
    position = options.position;
  }
  position = Number(position);
  if (isNaN(position)) {
    position = file.position;
  }
  return file.readSync(buffer, offset, length, position);
}
function fchownSync(fd, uid, gid) {
  fd2file(fd).chownSync(uid, gid);
}
function fchmodSync(fd, mode) {
  const numMode = normalizeMode(mode, -1);
  if (numMode < 0) {
    throw new ErrnoError(Errno.EINVAL, `Invalid mode.`);
  }
  fd2file(fd).chmodSync(numMode);
}
function futimesSync(fd, atime, mtime) {
  fd2file(fd).utimesSync(normalizeTime(atime), normalizeTime(mtime));
}
function rmdirSync(path) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(realpathSync.call(this, path), this);
  try {
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) {
      throw ErrnoError.With("ENOTDIR", resolved, "rmdir");
    }
    if (config.checkAccess && !stats.hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "rmdir");
    }
    fs.rmdirSync(resolved);
    emitChange(this, "rename", path.toString());
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
function mkdirSync(path, options) {
  var _a2, _b2;
  const { euid: uid, egid: gid } = (_a2 = this === null || this === undefined ? undefined : this.credentials) !== null && _a2 !== undefined ? _a2 : credentials;
  options = typeof options === "object" ? options : { mode: options };
  const mode = normalizeMode(options === null || options === undefined ? undefined : options.mode, 511);
  path = realpathSync.call(this, path);
  const { fs, path: resolved, root } = resolveMount(path, this);
  const errorPaths = { [resolved]: path };
  try {
    if (!(options === null || options === undefined ? undefined : options.recursive)) {
      if (config.checkAccess && !fs.statSync(dirname(resolved)).hasAccess(W_OK, this)) {
        throw ErrnoError.With("EACCES", dirname(resolved), "mkdir");
      }
      fs.mkdirSync(resolved, mode, { uid, gid });
      applySetId(fs.openFileSync(resolved, "r+"), uid, gid);
      return;
    }
    const dirs = [];
    for (let dir = resolved, original = path;!fs.existsSync(dir); dir = dirname(dir), original = dirname(original)) {
      dirs.unshift(dir);
      errorPaths[dir] = original;
    }
    for (const dir of dirs) {
      if (config.checkAccess && !fs.statSync(dirname(dir)).hasAccess(W_OK, this)) {
        throw ErrnoError.With("EACCES", dirname(dir), "mkdir");
      }
      fs.mkdirSync(dir, mode, { uid, gid });
      applySetId(fs.openFileSync(dir, "r+"), uid, gid);
      emitChange(this, "rename", dir);
    }
    return root.length == 1 ? dirs[0] : (_b2 = dirs[0]) === null || _b2 === undefined ? undefined : _b2.slice(root.length);
  } catch (e) {
    throw fixError(e, errorPaths);
  }
}
function readdirSync(path, options) {
  options = typeof options === "object" ? options : { encoding: options };
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(realpathSync.call(this, path), this);
  let entries2;
  try {
    const stats = fs.statSync(resolved);
    if (config.checkAccess && !stats.hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "readdir");
    }
    if (!stats.isDirectory()) {
      throw ErrnoError.With("ENOTDIR", resolved, "readdir");
    }
    entries2 = fs.readdirSync(resolved);
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
  const values = [];
  for (const entry of entries2) {
    let entryStat;
    try {
      entryStat = fs.statSync(join(resolved, entry));
    } catch {
      continue;
    }
    if (options === null || options === undefined ? undefined : options.withFileTypes) {
      values.push(new Dirent(entry, entryStat));
    } else if ((options === null || options === undefined ? undefined : options.encoding) == "buffer") {
      values.push(export_Buffer.from(entry));
    } else {
      values.push(entry);
    }
    if (!entryStat.isDirectory() || !(options === null || options === undefined ? undefined : options.recursive))
      continue;
    for (const subEntry of readdirSync.call(this, join(path, entry), options)) {
      if (subEntry instanceof Dirent) {
        subEntry.path = join(entry, subEntry.path);
        values.push(subEntry);
      } else if (export_Buffer.isBuffer(subEntry)) {
        values.push(export_Buffer.from(join(entry, decodeUTF8(subEntry))));
      } else {
        values.push(join(entry, subEntry));
      }
    }
  }
  return values;
}
function linkSync(targetPath, linkPath) {
  targetPath = normalizePath(targetPath);
  if (config.checkAccess && !statSync(dirname(targetPath)).hasAccess(R_OK, this)) {
    throw ErrnoError.With("EACCES", dirname(targetPath), "link");
  }
  linkPath = normalizePath(linkPath);
  if (config.checkAccess && !statSync(dirname(linkPath)).hasAccess(W_OK, this)) {
    throw ErrnoError.With("EACCES", dirname(linkPath), "link");
  }
  const { fs, path } = resolveMount(targetPath, this);
  const link = resolveMount(linkPath, this);
  if (fs != link.fs) {
    throw ErrnoError.With("EXDEV", linkPath, "link");
  }
  try {
    if (config.checkAccess && !fs.statSync(path).hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", path, "link");
    }
    return fs.linkSync(path, link.path);
  } catch (e) {
    throw fixError(e, { [path]: targetPath, [link.path]: linkPath });
  }
}
function symlinkSync(target, path, type = "file") {
  if (!["file", "dir", "junction"].includes(type)) {
    throw new ErrnoError(Errno.EINVAL, "Invalid type: " + type);
  }
  if (existsSync.call(this, path)) {
    throw ErrnoError.With("EEXIST", path.toString(), "symlink");
  }
  writeFileSync.call(this, path, normalizePath(target, true));
  const file = _openSync.call(this, path, { flag: "r+", mode: 420, preserveSymlinks: true });
  file.chmodSync(S_IFLNK);
}
function readlinkSync(path, options) {
  const value = export_Buffer.from(_readFileSync.call(this, path, "r", true));
  const encoding = typeof options == "object" ? options === null || options === undefined ? undefined : options.encoding : options;
  if (encoding == "buffer") {
    return value;
  }
  return value.toString(encoding !== null && encoding !== undefined ? encoding : "utf-8");
}
function chownSync(path, uid, gid) {
  const fd = openSync.call(this, path, "r+");
  fchownSync(fd, uid, gid);
  closeSync(fd);
}
function lchownSync(path, uid, gid) {
  const fd = lopenSync.call(this, path, "r+");
  fchownSync(fd, uid, gid);
  closeSync(fd);
}
function chmodSync(path, mode) {
  const fd = openSync.call(this, path, "r+");
  fchmodSync(fd, mode);
  closeSync(fd);
}
function lchmodSync(path, mode) {
  const fd = lopenSync.call(this, path, "r+");
  fchmodSync(fd, mode);
  closeSync(fd);
}
function utimesSync(path, atime, mtime) {
  const fd = openSync.call(this, path, "r+");
  futimesSync(fd, atime, mtime);
  closeSync(fd);
}
function lutimesSync(path, atime, mtime) {
  const fd = lopenSync.call(this, path, "r+");
  futimesSync(fd, atime, mtime);
  closeSync(fd);
}
function _resolveSync($2, path, preserveSymlinks) {
  if (preserveSymlinks) {
    const resolved2 = resolveMount(path, $2);
    const stats = resolved2.fs.statSync(resolved2.path);
    return { ...resolved2, fullPath: path, stats };
  }
  try {
    const resolved2 = resolveMount(path, $2);
    const stats = resolved2.fs.statSync(resolved2.path);
    if (!stats.isSymbolicLink()) {
      return { ...resolved2, fullPath: path, stats };
    }
    const target = resolve(dirname(path), readlinkSync.call($2, path).toString());
    return _resolveSync($2, target);
  } catch {
  }
  const { base, dir } = parse2(path);
  const realDir = dir == "/" ? "/" : realpathSync.call($2, dir);
  const maybePath = join(realDir, base);
  const resolved = resolveMount(maybePath, $2);
  try {
    const stats = resolved.fs.statSync(resolved.path);
    if (!stats.isSymbolicLink()) {
      return { ...resolved, fullPath: maybePath, stats };
    }
    const target = resolve(realDir, readlinkSync.call($2, maybePath).toString());
    return _resolveSync($2, target);
  } catch (e) {
    if (e.code == "ENOENT") {
      return { ...resolved, fullPath: path };
    }
    throw fixError(e, { [resolved.path]: maybePath });
  }
}
function realpathSync(path, options) {
  var _a2;
  const encoding = typeof options == "string" ? options : (_a2 = options === null || options === undefined ? undefined : options.encoding) !== null && _a2 !== undefined ? _a2 : "utf8";
  path = normalizePath(path);
  const { fullPath } = _resolveSync(this, path);
  if (encoding == "utf8" || encoding == "utf-8")
    return fullPath;
  const buf = export_Buffer.from(fullPath, "utf-8");
  if (encoding == "buffer")
    return buf;
  return buf.toString(encoding);
}
function accessSync(path, mode = 384) {
  if (!config.checkAccess)
    return;
  if (!statSync.call(this, path).hasAccess(mode, this)) {
    throw new ErrnoError(Errno.EACCES);
  }
}
function rmSync(path, options) {
  path = normalizePath(path);
  let stats;
  try {
    stats = lstatSync.bind(this)(path);
  } catch (error) {
    if (error.code != "ENOENT" || !(options === null || options === undefined ? undefined : options.force))
      throw error;
  }
  if (!stats)
    return;
  switch (stats.mode & S_IFMT) {
    case S_IFDIR:
      if (options === null || options === undefined ? undefined : options.recursive) {
        for (const entry of readdirSync.call(this, path)) {
          rmSync.call(this, join(path, entry), options);
        }
      }
      rmdirSync.call(this, path);
      break;
    case S_IFREG:
    case S_IFLNK:
    case S_IFBLK:
    case S_IFCHR:
      unlinkSync.call(this, path);
      break;
    case S_IFIFO:
    case S_IFSOCK:
    default:
      throw new ErrnoError(Errno.EPERM, "File type not supported", path, "rm");
  }
}
function mkdtempSync(prefix, options) {
  const encoding = typeof options === "object" ? options === null || options === undefined ? undefined : options.encoding : options || "utf8";
  const fsName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const resolvedPath = "/tmp/" + fsName;
  mkdirSync.call(this, resolvedPath);
  return encoding == "buffer" ? export_Buffer.from(resolvedPath) : resolvedPath;
}
function copyFileSync(source, destination, flags) {
  source = normalizePath(source);
  destination = normalizePath(destination);
  if (flags && flags & COPYFILE_EXCL && existsSync(destination)) {
    throw new ErrnoError(Errno.EEXIST, "Destination file already exists", destination, "copyFile");
  }
  writeFileSync.call(this, destination, readFileSync(source));
  emitChange(this, "rename", destination.toString());
}
function readvSync(fd, buffers, position) {
  const file = fd2file(fd);
  let bytesRead = 0;
  for (const buffer of buffers) {
    bytesRead += file.readSync(buffer, 0, buffer.byteLength, position + bytesRead);
  }
  return bytesRead;
}
function writevSync(fd, buffers, position) {
  const file = fd2file(fd);
  let bytesWritten = 0;
  for (const buffer of buffers) {
    bytesWritten += file.writeSync(new Uint8Array(buffer.buffer), 0, buffer.byteLength, position + bytesWritten);
  }
  return bytesWritten;
}
function opendirSync(path, options) {
  path = normalizePath(path);
  return new Dir(path, this);
}
function cpSync(source, destination, opts) {
  source = normalizePath(source);
  destination = normalizePath(destination);
  const srcStats = lstatSync.call(this, source);
  if ((opts === null || opts === undefined ? undefined : opts.errorOnExist) && existsSync.call(this, destination)) {
    throw new ErrnoError(Errno.EEXIST, "Destination file or directory already exists", destination, "cp");
  }
  switch (srcStats.mode & S_IFMT) {
    case S_IFDIR:
      if (!(opts === null || opts === undefined ? undefined : opts.recursive)) {
        throw new ErrnoError(Errno.EISDIR, source + " is a directory (not copied)", source, "cp");
      }
      mkdirSync.call(this, destination, { recursive: true });
      for (const dirent of readdirSync.call(this, source, { withFileTypes: true })) {
        if (opts.filter && !opts.filter(join(source, dirent.name), join(destination, dirent.name))) {
          continue;
        }
        cpSync.call(this, join(source, dirent.name), join(destination, dirent.name), opts);
      }
      break;
    case S_IFREG:
    case S_IFLNK:
      copyFileSync.call(this, source, destination);
      break;
    case S_IFBLK:
    case S_IFCHR:
    case S_IFIFO:
    case S_IFSOCK:
    default:
      throw new ErrnoError(Errno.EPERM, "File type not supported", source, "rm");
  }
  if (opts === null || opts === undefined ? undefined : opts.preserveTimestamps) {
    utimesSync.call(this, destination, srcStats.atime, srcStats.mtime);
  }
}
function statfsSync(path, options) {
  path = normalizePath(path);
  const { fs } = resolveMount(path, this);
  return _statfs(fs, options === null || options === undefined ? undefined : options.bigint);
}
function globSync(pattern, options = {}) {
  pattern = Array.isArray(pattern) ? pattern : [pattern];
  const { cwd: cwd2 = "/", withFileTypes = false, exclude = () => false } = options;
  const regexPatterns = pattern.map((p) => {
    p = p.replace(/([.?+^$(){}|[\]/])/g, "\\$1").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".");
    return new RegExp(`^${p}$`);
  });
  const results = [];
  function recursiveList(dir) {
    const entries2 = readdirSync(dir, { withFileTypes, encoding: "utf8" });
    for (const entry of entries2) {
      const fullPath = withFileTypes ? entry.path : dir + "/" + entry;
      if (exclude(withFileTypes ? entry : fullPath))
        continue;
      if (statSync(fullPath).isDirectory() && regexPatterns.some((pattern2) => pattern2.source.includes(".*"))) {
        recursiveList(fullPath);
      }
      if (regexPatterns.some((pattern2) => pattern2.test(fullPath.replace(/^\/+/g, "")))) {
        results.push(withFileTypes ? entry.path : fullPath.replace(/^\/+/g, ""));
      }
    }
  }
  recursiveList(cwd2);
  return results;
}

// node_modules/@zenfs/core/dist/vfs/dir.js
class Dirent {
  get name() {
    return basename(this.path);
  }
  constructor(path, stats) {
    this.path = path;
    this.stats = stats;
  }
  get parentPath() {
    return this.path;
  }
  isFile() {
    return this.stats.isFile();
  }
  isDirectory() {
    return this.stats.isDirectory();
  }
  isBlockDevice() {
    return this.stats.isBlockDevice();
  }
  isCharacterDevice() {
    return this.stats.isCharacterDevice();
  }
  isSymbolicLink() {
    return this.stats.isSymbolicLink();
  }
  isFIFO() {
    return this.stats.isFIFO();
  }
  isSocket() {
    return this.stats.isSocket();
  }
}

class Dir {
  checkClosed() {
    if (this.closed) {
      throw new ErrnoError(Errno.EBADF, "Can not use closed Dir");
    }
  }
  constructor(path, context) {
    this.path = path;
    this.context = context;
    this.closed = false;
  }
  close(cb) {
    this.closed = true;
    if (!cb) {
      return Promise.resolve();
    }
    cb();
  }
  closeSync() {
    this.closed = true;
  }
  async _read() {
    var _a2, _b2;
    this.checkClosed();
    (_a2 = this._entries) !== null && _a2 !== undefined || (this._entries = await readdir.call(this.context, this.path, {
      withFileTypes: true
    }));
    if (!this._entries.length)
      return null;
    return (_b2 = this._entries.shift()) !== null && _b2 !== undefined ? _b2 : null;
  }
  read(cb) {
    if (!cb) {
      return this._read();
    }
    this._read().then((value) => cb(undefined, value));
  }
  readSync() {
    var _a2, _b2;
    this.checkClosed();
    (_a2 = this._entries) !== null && _a2 !== undefined || (this._entries = readdirSync.call(this.context, this.path, { withFileTypes: true }));
    if (!this._entries.length)
      return null;
    return (_b2 = this._entries.shift()) !== null && _b2 !== undefined ? _b2 : null;
  }
  async next() {
    const value = await this._read();
    if (value) {
      return { done: false, value };
    }
    await this.close();
    return { done: true, value: undefined };
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  [Symbol.asyncDispose]() {
    return Promise.resolve();
  }
}

// node_modules/@zenfs/core/dist/vfs/streams.js
var import_readable_stream = __toESM(require_browser3(), 1);
class ReadStream extends import_readable_stream.Readable {
  constructor(opts = {}, handleOrPromise) {
    var _a2;
    super({ ...opts, encoding: (_a2 = opts.encoding) !== null && _a2 !== undefined ? _a2 : undefined });
    this.pending = true;
    this._path = "<unknown>";
    this._bytesRead = 0;
    Promise.resolve(handleOrPromise).then(({ file }) => {
      this._path = file.path;
      const internal = file.streamRead({ start: opts.start, end: opts.end });
      this.reader = internal.getReader();
      this.pending = false;
      return this._read();
    }).catch((err2) => this.destroy(err2));
  }
  async _read() {
    if (!this.reader)
      return;
    const { done, value } = await this.reader.read();
    if (done) {
      this.push(null);
      return;
    }
    this._bytesRead += value.byteLength;
    if (!this.push(value))
      return;
    await this._read();
  }
  close(callback = () => null) {
    try {
      this.destroy();
      this.emit("close");
      callback(null);
    } catch (err2) {
      callback(new ErrnoError(Errno.EIO, err2.toString()));
    }
  }
  get path() {
    return this._path;
  }
  get bytesRead() {
    return this._bytesRead;
  }
  wrap(oldStream) {
    super.wrap(oldStream);
    return this;
  }
}

class WriteStream extends import_readable_stream.Writable {
  constructor(opts = {}, handleOrPromise) {
    super(opts);
    this.pending = true;
    this._path = "<unknown>";
    this._bytesWritten = 0;
    this.ready = Promise.resolve(handleOrPromise).then(({ file }) => {
      this._path = file.path;
      const internal = file.streamWrite({ start: opts.start });
      this.writer = internal.getWriter();
      this.pending = false;
    }).catch((err2) => this.destroy(err2));
  }
  async _write(chunk, encoding, callback) {
    await this.ready;
    if (!this.writer)
      return callback(warn(new ErrnoError(Errno.EAGAIN, "Underlying writable stream not ready", this._path)));
    if (encoding != "buffer")
      return callback(warn(new ErrnoError(Errno.ENOTSUP, "Unsupported encoding for stream", this._path)));
    const data = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    try {
      await this.writer.write(data);
      this._bytesWritten += chunk.byteLength;
      callback();
    } catch (error) {
      callback(new ErrnoError(Errno.EIO, error.toString()));
    }
  }
  async _final(callback) {
    await this.ready;
    if (!this.writer)
      return callback();
    try {
      await this.writer.close();
      callback();
    } catch (error) {
      callback(new ErrnoError(Errno.EIO, error.toString()));
    }
  }
  close(callback = () => null) {
    try {
      this.destroy();
      this.emit("close");
      callback(null);
    } catch (error) {
      callback(new ErrnoError(Errno.EIO, error.toString()));
    }
  }
  get path() {
    return this._path;
  }
  get bytesWritten() {
    return this._bytesWritten;
  }
}

// node_modules/@zenfs/core/dist/vfs/promises.js
var __addDisposableResource4 = function(env, value, async) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources4 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});

class FileHandle {
  constructor(fdOrFile, context) {
    this.context = context;
    const isFile = typeof fdOrFile != "number";
    this.fd = isFile ? file2fd(fdOrFile) : fdOrFile;
    this.file = isFile ? fdOrFile : fd2file(fdOrFile);
  }
  _emitChange() {
    var _a2, _b2, _c2;
    emitChange(this.context, "change", this.file.path.slice((_c2 = (_b2 = (_a2 = this.context) === null || _a2 === undefined ? undefined : _a2.root) === null || _b2 === undefined ? undefined : _b2.length) !== null && _c2 !== undefined ? _c2 : 0));
  }
  async chown(uid, gid) {
    await this.file.chown(uid, gid);
    this._emitChange();
  }
  async chmod(mode) {
    const numMode = normalizeMode(mode, -1);
    if (numMode < 0)
      throw new ErrnoError(Errno.EINVAL, "Invalid mode");
    await this.file.chmod(numMode);
    this._emitChange();
  }
  datasync() {
    return this.file.datasync();
  }
  sync() {
    return this.file.sync();
  }
  async truncate(length) {
    length || (length = 0);
    if (length < 0)
      throw new ErrnoError(Errno.EINVAL);
    await this.file.truncate(length);
    this._emitChange();
  }
  async utimes(atime, mtime) {
    await this.file.utimes(normalizeTime(atime), normalizeTime(mtime));
    this._emitChange();
  }
  async appendFile(data, _options = {}) {
    const options = normalizeOptions(_options, "utf8", "a", 420);
    const flag = parseFlag(options.flag);
    if (!isAppendable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed to appendFile must allow for appending");
    }
    if (typeof data != "string" && !options.encoding) {
      throw new ErrnoError(Errno.EINVAL, "Encoding not specified");
    }
    const encodedData = typeof data == "string" ? export_Buffer.from(data, options.encoding) : data;
    await this.file.write(encodedData, 0, encodedData.length);
    this._emitChange();
  }
  async read(buffer, offset, length, position) {
    if (typeof offset == "object" && offset != null) {
      position = offset.position;
      length = offset.length;
      offset = offset.offset;
    }
    if (!ArrayBuffer.isView(buffer) && typeof buffer == "object") {
      position = buffer.position;
      length = buffer.length;
      offset = buffer.offset;
      buffer = buffer.buffer;
    }
    const pos = Number.isSafeInteger(position) ? position : this.file.position;
    buffer || (buffer = new Uint8Array((await this.file.stat()).size));
    offset !== null && offset !== undefined || (offset = 0);
    return this.file.read(buffer, offset, length !== null && length !== undefined ? length : buffer.byteLength - offset, pos);
  }
  async readFile(_options) {
    const options = normalizeOptions(_options, null, "r", 292);
    const flag = parseFlag(options.flag);
    if (!isReadable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed must allow for reading");
    }
    const { size } = await this.stat();
    const { buffer: data } = await this.file.read(new Uint8Array(size), 0, size, 0);
    const buffer = export_Buffer.from(data);
    return options.encoding ? buffer.toString(options.encoding) : buffer;
  }
  readableWebStream(options = {}) {
    return this.file.streamRead({});
  }
  readLines(options) {
    throw ErrnoError.With("ENOSYS", this.file.path, "FileHandle.readLines");
  }
  [Symbol.asyncDispose]() {
    return this.close();
  }
  async stat(opts) {
    const stats = await this.file.stat();
    if (config.checkAccess && !stats.hasAccess(R_OK, this.context)) {
      throw ErrnoError.With("EACCES", this.file.path, "stat");
    }
    return (opts === null || opts === undefined ? undefined : opts.bigint) ? new BigIntStats(stats) : stats;
  }
  async write(data, options, lenOrEnc, position) {
    let buffer, offset, length;
    if (typeof options == "object" && options != null) {
      lenOrEnc = options.length;
      position = options.position;
      options = options.offset;
    }
    if (typeof data === "string") {
      position = typeof options === "number" ? options : null;
      offset = 0;
      buffer = export_Buffer.from(data, typeof lenOrEnc === "string" ? lenOrEnc : "utf8");
      length = buffer.length;
    } else {
      buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      offset = options !== null && options !== undefined ? options : 0;
      length = typeof lenOrEnc == "number" ? lenOrEnc : buffer.byteLength;
      position = typeof position === "number" ? position : null;
    }
    position !== null && position !== undefined || (position = this.file.position);
    const bytesWritten = await this.file.write(buffer, offset, length, position);
    this._emitChange();
    return { buffer: data, bytesWritten };
  }
  async writeFile(data, _options = {}) {
    const options = normalizeOptions(_options, "utf8", "w", 420);
    const flag = parseFlag(options.flag);
    if (!isWriteable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed must allow for writing");
    }
    if (typeof data != "string" && !options.encoding) {
      throw new ErrnoError(Errno.EINVAL, "Encoding not specified");
    }
    const encodedData = typeof data == "string" ? export_Buffer.from(data, options.encoding) : data;
    await this.file.write(encodedData, 0, encodedData.length, 0);
    this._emitChange();
  }
  async close() {
    await this.file.close();
    fdMap.delete(this.fd);
  }
  async writev(buffers, position) {
    if (typeof position == "number")
      this.file.position = position;
    let bytesWritten = 0;
    for (const buffer of buffers) {
      bytesWritten += (await this.write(buffer)).bytesWritten;
    }
    return { bytesWritten, buffers };
  }
  async readv(buffers, position) {
    if (typeof position == "number")
      this.file.position = position;
    let bytesRead = 0;
    for (const buffer of buffers) {
      bytesRead += (await this.read(buffer)).bytesRead;
    }
    return { bytesRead, buffers };
  }
  createReadStream(options = {}) {
    return new ReadStream(options, this);
  }
  createWriteStream(options = {}) {
    return new WriteStream(options, this);
  }
}
async function rename(oldPath, newPath) {
  oldPath = normalizePath(oldPath);
  newPath = normalizePath(newPath);
  const src = resolveMount(oldPath, this);
  const dst = resolveMount(newPath, this);
  if (config.checkAccess && !(await stat.call(this, dirname(oldPath))).hasAccess(W_OK, this)) {
    throw ErrnoError.With("EACCES", oldPath, "rename");
  }
  try {
    if (src.mountPoint == dst.mountPoint) {
      await src.fs.rename(src.path, dst.path);
      emitChange(this, "rename", oldPath.toString());
      emitChange(this, "change", newPath.toString());
      return;
    }
    await writeFile.call(this, newPath, await readFile(oldPath));
    await unlink.call(this, oldPath);
    emitChange(this, "rename", oldPath.toString());
  } catch (e) {
    throw fixError(e, { [src.path]: oldPath, [dst.path]: newPath });
  }
}
async function exists(path) {
  try {
    const { fs, path: resolved } = resolveMount(await realpath.call(this, path), this);
    return await fs.exists(resolved);
  } catch (e) {
    if (e instanceof ErrnoError && e.code == "ENOENT") {
      return false;
    }
    throw e;
  }
}
async function stat(path, options) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(await realpath.call(this, path), this);
  try {
    const stats = await fs.stat(resolved);
    if (config.checkAccess && !stats.hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "stat");
    }
    return (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats;
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
async function lstat(path, options) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(path, this);
  try {
    const stats = await fs.stat(resolved);
    return (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats;
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
async function truncate(path, len = 0) {
  const env_1 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_1, await open.call(this, path, "r+"), true);
    await handle.truncate(len);
  } catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
  } finally {
    const result_1 = __disposeResources4(env_1);
    if (result_1)
      await result_1;
  }
}
async function unlink(path) {
  path = normalizePath(path);
  const { fs, path: resolved } = resolveMount(path, this);
  try {
    if (config.checkAccess && !(await fs.stat(resolved)).hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "unlink");
    }
    await fs.unlink(resolved);
    emitChange(this, "rename", path.toString());
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
async function applySetId2(file, uid, gid) {
  if (file.fs.attributes.has("setid"))
    return;
  const parent = await file.fs.stat(dirname(file.path));
  await file.chown(parent.mode & S_ISUID ? parent.uid : uid, parent.mode & S_ISGID ? parent.gid : gid);
}
async function _open($2, path, opt) {
  var _a2;
  path = normalizePath(path);
  const mode = normalizeMode(opt.mode, 420), flag = parseFlag(opt.flag);
  const { fullPath, fs, path: resolved, stats } = await _resolve($2, path.toString(), opt.preserveSymlinks);
  if (!stats) {
    if (!isWriteable(flag) && !isAppendable(flag) || flag == "r+") {
      throw ErrnoError.With("ENOENT", fullPath, "_open");
    }
    const parentStats = await fs.stat(dirname(resolved));
    if (config.checkAccess && !parentStats.hasAccess(W_OK, $2)) {
      throw ErrnoError.With("EACCES", dirname(fullPath), "_open");
    }
    if (!parentStats.isDirectory()) {
      throw ErrnoError.With("ENOTDIR", dirname(fullPath), "_open");
    }
    const { euid: uid, egid: gid } = (_a2 = $2 === null || $2 === undefined ? undefined : $2.credentials) !== null && _a2 !== undefined ? _a2 : credentials;
    const file = await fs.createFile(resolved, flag, mode, { uid, gid });
    await applySetId2(file, uid, gid);
    return new FileHandle(file, $2);
  }
  if (config.checkAccess && !stats.hasAccess(flagToMode(flag), $2)) {
    throw ErrnoError.With("EACCES", fullPath, "_open");
  }
  if (isExclusive(flag)) {
    throw ErrnoError.With("EEXIST", fullPath, "_open");
  }
  const handle = new FileHandle(await fs.openFile(resolved, flag), $2);
  if (isTruncating(flag)) {
    await handle.truncate(0);
  }
  return handle;
}
async function open(path, flag = "r", mode = 420) {
  return await _open(this, path, { flag, mode });
}
async function readFile(path, _options) {
  const env_2 = { stack: [], error: undefined, hasError: false };
  try {
    const options = normalizeOptions(_options, null, "r", 420);
    const handle = __addDisposableResource4(env_2, typeof path == "object" && "fd" in path ? path : await open.call(this, path, options.flag, options.mode), true);
    return await handle.readFile(options);
  } catch (e_2) {
    env_2.error = e_2;
    env_2.hasError = true;
  } finally {
    const result_2 = __disposeResources4(env_2);
    if (result_2)
      await result_2;
  }
}
async function writeFile(path, data, _options) {
  const env_3 = { stack: [], error: undefined, hasError: false };
  try {
    const options = normalizeOptions(_options, "utf8", "w+", 420);
    const handle = __addDisposableResource4(env_3, path instanceof FileHandle ? path : await open.call(this, path.toString(), options.flag, options.mode), true);
    const _data = typeof data == "string" ? data : data instanceof DataView ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : data;
    if (typeof _data != "string" && !(_data instanceof Uint8Array)) {
      throw new ErrnoError(Errno.EINVAL, 'The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received ' + typeof data, handle.file.path, "writeFile");
    }
    await handle.writeFile(_data, options);
  } catch (e_3) {
    env_3.error = e_3;
    env_3.hasError = true;
  } finally {
    const result_3 = __disposeResources4(env_3);
    if (result_3)
      await result_3;
  }
}
async function appendFile(path, data, _options) {
  const env_4 = { stack: [], error: undefined, hasError: false };
  try {
    const options = normalizeOptions(_options, "utf8", "a", 420);
    const flag = parseFlag(options.flag);
    if (!isAppendable(flag)) {
      throw new ErrnoError(Errno.EINVAL, "Flag passed to appendFile must allow for appending");
    }
    if (typeof data != "string" && !options.encoding) {
      throw new ErrnoError(Errno.EINVAL, "Encoding not specified");
    }
    const encodedData = typeof data == "string" ? export_Buffer.from(data, options.encoding) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const handle = __addDisposableResource4(env_4, typeof path == "object" && "fd" in path ? path : await open.call(this, path, options.flag, options.mode), true);
    await handle.appendFile(encodedData, options);
  } catch (e_4) {
    env_4.error = e_4;
    env_4.hasError = true;
  } finally {
    const result_4 = __disposeResources4(env_4);
    if (result_4)
      await result_4;
  }
}
async function rmdir(path) {
  path = await realpath.call(this, path);
  const { fs, path: resolved } = resolveMount(path, this);
  try {
    const stats = await fs.stat(resolved);
    if (!stats) {
      throw ErrnoError.With("ENOENT", path, "rmdir");
    }
    if (!stats.isDirectory()) {
      throw ErrnoError.With("ENOTDIR", resolved, "rmdir");
    }
    if (config.checkAccess && !stats.hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", resolved, "rmdir");
    }
    await fs.rmdir(resolved);
    emitChange(this, "rename", path.toString());
  } catch (e) {
    throw fixError(e, { [resolved]: path });
  }
}
async function mkdir(path, options) {
  var _a2, _b2;
  const { euid: uid, egid: gid } = (_a2 = this === null || this === undefined ? undefined : this.credentials) !== null && _a2 !== undefined ? _a2 : credentials;
  options = typeof options === "object" ? options : { mode: options };
  const mode = normalizeMode(options === null || options === undefined ? undefined : options.mode, 511);
  path = await realpath.call(this, path);
  const { fs, path: resolved, root } = resolveMount(path, this);
  const errorPaths = { [resolved]: path };
  try {
    if (!(options === null || options === undefined ? undefined : options.recursive)) {
      if (config.checkAccess && !(await fs.stat(dirname(resolved))).hasAccess(W_OK, this)) {
        throw ErrnoError.With("EACCES", dirname(resolved), "mkdir");
      }
      await fs.mkdir(resolved, mode, { uid, gid });
      await applySetId2(await fs.openFile(resolved, "r+"), uid, gid);
      emitChange(this, "rename", path.toString());
      return;
    }
    const dirs = [];
    for (let dir = resolved, origDir = path;!await fs.exists(dir); dir = dirname(dir), origDir = dirname(origDir)) {
      dirs.unshift(dir);
      errorPaths[dir] = origDir;
    }
    for (const dir of dirs) {
      if (config.checkAccess && !(await fs.stat(dirname(dir))).hasAccess(W_OK, this)) {
        throw ErrnoError.With("EACCES", dirname(dir), "mkdir");
      }
      await fs.mkdir(dir, mode, { uid, gid });
      await applySetId2(await fs.openFile(dir, "r+"), uid, gid);
      emitChange(this, "rename", dir);
    }
    return root.length == 1 ? dirs[0] : (_b2 = dirs[0]) === null || _b2 === undefined ? undefined : _b2.slice(root.length);
  } catch (e) {
    throw fixError(e, errorPaths);
  }
}
async function readdir(path, options) {
  options = typeof options === "object" ? options : { encoding: options };
  path = await realpath.call(this, path);
  const { fs, path: resolved } = resolveMount(path, this);
  const stats = await fs.stat(resolved).catch((e) => _throw(fixError(e, { [resolved]: path })));
  if (!stats) {
    throw ErrnoError.With("ENOENT", path, "readdir");
  }
  if (config.checkAccess && !stats.hasAccess(R_OK, this)) {
    throw ErrnoError.With("EACCES", path, "readdir");
  }
  if (!stats.isDirectory()) {
    throw ErrnoError.With("ENOTDIR", path, "readdir");
  }
  const entries2 = await fs.readdir(resolved).catch((e) => _throw(fixError(e, { [resolved]: path })));
  const values = [];
  const addEntry = async (entry) => {
    let entryStats;
    if ((options === null || options === undefined ? undefined : options.recursive) || (options === null || options === undefined ? undefined : options.withFileTypes)) {
      entryStats = await fs.stat(join(resolved, entry)).catch((e) => {
        if (e.code == "ENOENT")
          return;
        throw fixError(e, { [resolved]: path });
      });
      if (!entryStats)
        return;
    }
    if (options === null || options === undefined ? undefined : options.withFileTypes) {
      values.push(new Dirent(entry, entryStats));
    } else if ((options === null || options === undefined ? undefined : options.encoding) == "buffer") {
      values.push(export_Buffer.from(entry));
    } else {
      values.push(entry);
    }
    if (!(options === null || options === undefined ? undefined : options.recursive) || !(entryStats === null || entryStats === undefined ? undefined : entryStats.isDirectory()))
      return;
    for (const subEntry of await readdir.call(this, join(path, entry), options)) {
      if (subEntry instanceof Dirent) {
        subEntry.path = join(entry, subEntry.path);
        values.push(subEntry);
      } else if (export_Buffer.isBuffer(subEntry)) {
        values.push(export_Buffer.from(join(entry, decodeUTF8(subEntry))));
      } else {
        values.push(join(entry, subEntry));
      }
    }
  };
  await Promise.all(entries2.map(addEntry));
  return values;
}
async function link(targetPath, linkPath) {
  targetPath = normalizePath(targetPath);
  linkPath = normalizePath(linkPath);
  const { fs, path } = resolveMount(targetPath, this);
  const link2 = resolveMount(linkPath, this);
  if (fs != link2.fs) {
    throw ErrnoError.With("EXDEV", linkPath, "link");
  }
  try {
    if (config.checkAccess && !(await fs.stat(dirname(targetPath))).hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", dirname(path), "link");
    }
    if (config.checkAccess && !(await stat.call(this, dirname(linkPath))).hasAccess(W_OK, this)) {
      throw ErrnoError.With("EACCES", dirname(linkPath), "link");
    }
    if (config.checkAccess && !(await fs.stat(path)).hasAccess(R_OK, this)) {
      throw ErrnoError.With("EACCES", path, "link");
    }
    return await fs.link(path, link2.path);
  } catch (e) {
    throw fixError(e, { [link2.path]: linkPath, [path]: targetPath });
  }
}
async function symlink(target, path, type = "file") {
  const env_5 = { stack: [], error: undefined, hasError: false };
  try {
    if (!["file", "dir", "junction"].includes(type)) {
      throw new ErrnoError(Errno.EINVAL, "Invalid symlink type: " + type);
    }
    path = normalizePath(path);
    if (await exists.call(this, path))
      throw ErrnoError.With("EEXIST", path, "symlink");
    const handle = __addDisposableResource4(env_5, await _open(this, path, { flag: "w+", mode: 420, preserveSymlinks: true }), true);
    await handle.writeFile(normalizePath(target, true));
    await handle.file.chmod(S_IFLNK);
  } catch (e_5) {
    env_5.error = e_5;
    env_5.hasError = true;
  } finally {
    const result_5 = __disposeResources4(env_5);
    if (result_5)
      await result_5;
  }
}
async function readlink(path, options) {
  const env_6 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_6, await _open(this, normalizePath(path), { flag: "r", mode: 420, preserveSymlinks: true }), true);
    const value = await handle.readFile();
    const encoding = typeof options == "object" ? options === null || options === undefined ? undefined : options.encoding : options;
    return encoding == "buffer" ? value : value.toString(encoding !== null && encoding !== undefined ? encoding : "utf-8");
  } catch (e_6) {
    env_6.error = e_6;
    env_6.hasError = true;
  } finally {
    const result_6 = __disposeResources4(env_6);
    if (result_6)
      await result_6;
  }
}
async function chown(path, uid, gid) {
  const env_7 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_7, await open.call(this, path, "r+"), true);
    await handle.chown(uid, gid);
  } catch (e_7) {
    env_7.error = e_7;
    env_7.hasError = true;
  } finally {
    const result_7 = __disposeResources4(env_7);
    if (result_7)
      await result_7;
  }
}
async function lchown(path, uid, gid) {
  const env_8 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_8, await _open(this, path, {
      flag: "r+",
      mode: 420,
      preserveSymlinks: true,
      allowDirectory: true
    }), true);
    await handle.chown(uid, gid);
  } catch (e_8) {
    env_8.error = e_8;
    env_8.hasError = true;
  } finally {
    const result_8 = __disposeResources4(env_8);
    if (result_8)
      await result_8;
  }
}
async function chmod(path, mode) {
  const env_9 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_9, await open.call(this, path, "r+"), true);
    await handle.chmod(mode);
  } catch (e_9) {
    env_9.error = e_9;
    env_9.hasError = true;
  } finally {
    const result_9 = __disposeResources4(env_9);
    if (result_9)
      await result_9;
  }
}
async function lchmod(path, mode) {
  const env_10 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_10, await _open(this, path, {
      flag: "r+",
      mode: 420,
      preserveSymlinks: true,
      allowDirectory: true
    }), true);
    await handle.chmod(mode);
  } catch (e_10) {
    env_10.error = e_10;
    env_10.hasError = true;
  } finally {
    const result_10 = __disposeResources4(env_10);
    if (result_10)
      await result_10;
  }
}
async function utimes(path, atime, mtime) {
  const env_11 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_11, await open.call(this, path, "r+"), true);
    await handle.utimes(atime, mtime);
  } catch (e_11) {
    env_11.error = e_11;
    env_11.hasError = true;
  } finally {
    const result_11 = __disposeResources4(env_11);
    if (result_11)
      await result_11;
  }
}
async function lutimes(path, atime, mtime) {
  const env_12 = { stack: [], error: undefined, hasError: false };
  try {
    const handle = __addDisposableResource4(env_12, await _open(this, path, {
      flag: "r+",
      mode: 420,
      preserveSymlinks: true,
      allowDirectory: true
    }), true);
    await handle.utimes(new Date(atime), new Date(mtime));
  } catch (e_12) {
    env_12.error = e_12;
    env_12.hasError = true;
  } finally {
    const result_12 = __disposeResources4(env_12);
    if (result_12)
      await result_12;
  }
}
async function _resolve($2, path, preserveSymlinks) {
  if (preserveSymlinks) {
    const resolved2 = resolveMount(path, $2);
    const stats = await resolved2.fs.stat(resolved2.path).catch(() => {
      return;
    });
    return { ...resolved2, fullPath: path, stats };
  }
  try {
    const resolved2 = resolveMount(path, $2);
    const stats = await resolved2.fs.stat(resolved2.path);
    if (!stats.isSymbolicLink()) {
      return { ...resolved2, fullPath: path, stats };
    }
    const target = resolve(dirname(path), (await readlink.call($2, path)).toString());
    return await _resolve($2, target);
  } catch {
  }
  const { base, dir } = parse2(path);
  const realDir = dir == "/" ? "/" : await realpath.call($2, dir);
  const maybePath = join(realDir, base);
  const resolved = resolveMount(maybePath, $2);
  try {
    const stats = await resolved.fs.stat(resolved.path);
    if (!stats.isSymbolicLink()) {
      return { ...resolved, fullPath: maybePath, stats };
    }
    const target = resolve(realDir, (await readlink.call($2, maybePath)).toString());
    return await _resolve($2, target);
  } catch (e) {
    if (e.code == "ENOENT") {
      return { ...resolved, fullPath: path };
    }
    throw fixError(e, { [resolved.path]: maybePath });
  }
}
async function realpath(path, options) {
  var _a2;
  const encoding = typeof options == "string" ? options : (_a2 = options === null || options === undefined ? undefined : options.encoding) !== null && _a2 !== undefined ? _a2 : "utf8";
  path = normalizePath(path);
  const { fullPath } = await _resolve(this, path);
  if (encoding == "utf8" || encoding == "utf-8")
    return fullPath;
  const buf = export_Buffer.from(fullPath, "utf-8");
  if (encoding == "buffer")
    return buf;
  return buf.toString(encoding);
}
function watch(filename, options = {}) {
  const watcher = new FSWatcher(this, filename.toString(), typeof options !== "string" ? options : { encoding: options });
  const eventQueue = [];
  let done = false;
  watcher.on("change", (eventType, filename2) => {
    var _a2;
    (_a2 = eventQueue.shift()) === null || _a2 === undefined || _a2({ value: { eventType, filename: filename2 }, done: false });
  });
  function cleanup() {
    done = true;
    watcher.close();
    for (const resolve2 of eventQueue) {
      resolve2({ value: null, done });
    }
    eventQueue.length = 0;
    return Promise.resolve({ value: null, done: true });
  }
  return {
    async next() {
      if (done)
        return Promise.resolve({ value: null, done });
      const { promise, resolve: resolve2 } = Promise.withResolvers();
      eventQueue.push(resolve2);
      return promise;
    },
    return: cleanup,
    throw: cleanup,
    async[Symbol.asyncDispose]() {
      await cleanup();
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function access(path, mode = F_OK) {
  if (!config.checkAccess)
    return;
  const stats = await stat.call(this, path);
  if (!stats.hasAccess(mode, this)) {
    throw new ErrnoError(Errno.EACCES);
  }
}
async function rm(path, options) {
  path = normalizePath(path);
  const stats = await lstat.call(this, path).catch((error) => {
    if (error.code == "ENOENT" && (options === null || options === undefined ? undefined : options.force))
      return;
    throw error;
  });
  if (!stats)
    return;
  switch (stats.mode & S_IFMT) {
    case S_IFDIR:
      if (options === null || options === undefined ? undefined : options.recursive) {
        for (const entry of await readdir.call(this, path)) {
          await rm.call(this, join(path, entry), options);
        }
      }
      await rmdir.call(this, path);
      break;
    case S_IFREG:
    case S_IFLNK:
    case S_IFBLK:
    case S_IFCHR:
      await unlink.call(this, path);
      break;
    case S_IFIFO:
    case S_IFSOCK:
    default:
      throw new ErrnoError(Errno.EPERM, "File type not supported", path, "rm");
  }
}
async function mkdtemp(prefix, options) {
  const encoding = typeof options === "object" ? options === null || options === undefined ? undefined : options.encoding : options || "utf8";
  const fsName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const resolvedPath = "/tmp/" + fsName;
  await mkdir.call(this, resolvedPath);
  return encoding == "buffer" ? export_Buffer.from(resolvedPath) : resolvedPath;
}
async function copyFile(src, dest, mode) {
  src = normalizePath(src);
  dest = normalizePath(dest);
  if (mode && mode & COPYFILE_EXCL && await exists.call(this, dest)) {
    throw new ErrnoError(Errno.EEXIST, "Destination file already exists", dest, "copyFile");
  }
  await writeFile.call(this, dest, await readFile.call(this, src));
  emitChange(this, "rename", dest.toString());
}
function opendir(path, options) {
  path = normalizePath(path);
  return Promise.resolve(new Dir(path, this));
}
async function cp(source, destination, opts) {
  source = normalizePath(source);
  destination = normalizePath(destination);
  const srcStats = await lstat.call(this, source);
  if ((opts === null || opts === undefined ? undefined : opts.errorOnExist) && await exists.call(this, destination)) {
    throw new ErrnoError(Errno.EEXIST, "Destination file or directory already exists", destination, "cp");
  }
  switch (srcStats.mode & S_IFMT) {
    case S_IFDIR: {
      if (!(opts === null || opts === undefined ? undefined : opts.recursive)) {
        throw new ErrnoError(Errno.EISDIR, source + " is a directory (not copied)", source, "cp");
      }
      const [entries2] = await Promise.all([
        readdir.call(this, source, { withFileTypes: true }),
        mkdir.call(this, destination, { recursive: true })
      ]);
      const _cp = async (dirent) => {
        if (opts.filter && !opts.filter(join(source, dirent.name), join(destination, dirent.name))) {
          return;
        }
        await cp.call(this, join(source, dirent.name), join(destination, dirent.name), opts);
      };
      await Promise.all(entries2.map(_cp));
      break;
    }
    case S_IFREG:
    case S_IFLNK:
      await copyFile.call(this, source, destination);
      break;
    case S_IFBLK:
    case S_IFCHR:
    case S_IFIFO:
    case S_IFSOCK:
    default:
      throw new ErrnoError(Errno.EPERM, "File type not supported", source, "rm");
  }
  if (opts === null || opts === undefined ? undefined : opts.preserveTimestamps) {
    await utimes.call(this, destination, srcStats.atime, srcStats.mtime);
  }
}
async function statfs(path, opts) {
  path = normalizePath(path);
  const { fs } = resolveMount(path, this);
  return Promise.resolve(_statfs(fs, opts === null || opts === undefined ? undefined : opts.bigint));
}
function glob(pattern, opt) {
  pattern = Array.isArray(pattern) ? pattern : [pattern];
  const { cwd: cwd2 = "/", withFileTypes = false, exclude = () => false } = opt || {};
  const regexPatterns = pattern.map((p) => {
    p = p.replace(/([.?+^$(){}|[\]/])/g, "$1").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".");
    return new RegExp(`^${p}$`);
  });
  async function* recursiveList(dir) {
    const entries2 = await readdir(dir, { withFileTypes, encoding: "utf8" });
    for (const entry of entries2) {
      const fullPath = withFileTypes ? entry.path : dir + "/" + entry;
      if (exclude(withFileTypes ? entry : fullPath))
        continue;
      if ((await stat(fullPath)).isDirectory() && regexPatterns.some((pattern2) => pattern2.source.includes(".*"))) {
        yield* recursiveList(fullPath);
      }
      if (regexPatterns.some((pattern2) => pattern2.test(fullPath.replace(/^\/+/g, "")))) {
        yield withFileTypes ? entry : fullPath.replace(/^\/+/g, "");
      }
    }
  }
  return recursiveList(cwd2);
}

// node_modules/@zenfs/core/dist/vfs/async.js
var nop = () => {
};
async function collectAsyncIterator(it) {
  const results = [];
  for await (const result of it) {
    results.push(result);
  }
  return results;
}
function rename2(oldPath, newPath, cb = nop) {
  rename.call(this, oldPath, newPath).then(() => cb()).catch(cb);
}
function exists2(path, cb = nop) {
  exists.call(this, path).then(cb).catch(() => cb(false));
}
function stat2(path, options, callback = nop) {
  callback = typeof options == "function" ? options : callback;
  stat.call(this, path, typeof options != "function" ? options : {}).then((stats) => callback(undefined, stats)).catch(callback);
}
function lstat2(path, options, callback = nop) {
  callback = typeof options == "function" ? options : callback;
  lstat.call(this, path, typeof options != "function" ? options : {}).then((stats) => callback(undefined, stats)).catch(callback);
}
function truncate2(path, cbLen = 0, cb = nop) {
  cb = typeof cbLen === "function" ? cbLen : cb;
  const len = typeof cbLen === "number" ? cbLen : 0;
  truncate.call(this, path, len).then(() => cb()).catch(cb);
}
function unlink2(path, cb = nop) {
  unlink.call(this, path).then(() => cb()).catch(cb);
}
function open2(path, flag, cbMode, cb = nop) {
  const mode = normalizeMode(cbMode, 420);
  cb = typeof cbMode === "function" ? cbMode : cb;
  open.call(this, path, flag, mode).then((handle) => cb(undefined, handle.fd)).catch(cb);
}
function readFile2(filename, options, cb = nop) {
  cb = typeof options === "function" ? options : cb;
  readFile.call(this, filename, typeof options === "function" ? null : options).then((data) => cb(undefined, data)).catch(cb);
}
function writeFile2(filename, data, cbEncOpts, cb = nop) {
  cb = typeof cbEncOpts === "function" ? cbEncOpts : cb;
  writeFile.call(this, filename, data, typeof cbEncOpts != "function" ? cbEncOpts : null).then(() => cb(undefined)).catch(cb);
}
function appendFile2(filename, data, cbEncOpts, cb = nop) {
  const optionsOrEncoding = typeof cbEncOpts != "function" ? cbEncOpts : undefined;
  cb = typeof cbEncOpts === "function" ? cbEncOpts : cb;
  appendFile.call(this, filename, data, optionsOrEncoding).then(() => cb()).catch(cb);
}
function fstat(fd, options, cb = nop) {
  cb = typeof options == "function" ? options : cb;
  fd2file(fd).stat().then((stats) => cb(undefined, typeof options == "object" && (options === null || options === undefined ? undefined : options.bigint) ? new BigIntStats(stats) : stats)).catch(cb);
}
function close(fd, cb = nop) {
  const close2 = fd2file(fd).close();
  fdMap.delete(fd);
  close2.then(() => cb()).catch(cb);
}
function ftruncate(fd, lenOrCB, cb = nop) {
  const length = typeof lenOrCB === "number" ? lenOrCB : 0;
  cb = typeof lenOrCB === "function" ? lenOrCB : cb;
  const file = fd2file(fd);
  if (length < 0) {
    throw new ErrnoError(Errno.EINVAL);
  }
  file.truncate(length).then(() => cb()).catch(cb);
}
function fsync(fd, cb = nop) {
  fd2file(fd).sync().then(() => cb()).catch(cb);
}
function fdatasync(fd, cb = nop) {
  fd2file(fd).datasync().then(() => cb()).catch(cb);
}
function write(fd, data, cbPosOff, cbLenEnc, cbPosEnc, cb = nop) {
  let buffer, offset, length, position, encoding;
  const handle = new FileHandle(fd, this);
  if (typeof data === "string") {
    encoding = "utf8";
    switch (typeof cbPosOff) {
      case "function":
        cb = cbPosOff;
        break;
      case "number":
        position = cbPosOff;
        encoding = typeof cbLenEnc === "string" ? cbLenEnc : "utf8";
        cb = typeof cbPosEnc === "function" ? cbPosEnc : cb;
        break;
      default:
        cb = typeof cbLenEnc === "function" ? cbLenEnc : typeof cbPosEnc === "function" ? cbPosEnc : cb;
        cb(new ErrnoError(Errno.EINVAL, "Invalid arguments"));
        return;
    }
    buffer = export_Buffer.from(data);
    offset = 0;
    length = buffer.length;
    const _cb = cb;
    handle.write(buffer, offset, length, position).then(({ bytesWritten }) => _cb(undefined, bytesWritten, buffer.toString(encoding))).catch(_cb);
  } else {
    buffer = export_Buffer.from(data.buffer);
    offset = cbPosOff;
    length = cbLenEnc;
    position = typeof cbPosEnc === "number" ? cbPosEnc : null;
    const _cb = typeof cbPosEnc === "function" ? cbPosEnc : cb;
    handle.write(buffer, offset, length, position).then(({ bytesWritten }) => _cb(undefined, bytesWritten, buffer)).catch(_cb);
  }
}
function read(fd, buffer, offset, length, position, cb = nop) {
  new FileHandle(fd, this).read(buffer, offset, length, position).then(({ bytesRead, buffer: buffer2 }) => cb(undefined, bytesRead, buffer2)).catch(cb);
}
function fchown(fd, uid, gid, cb = nop) {
  new FileHandle(fd, this).chown(uid, gid).then(() => cb()).catch(cb);
}
function fchmod(fd, mode, cb) {
  new FileHandle(fd, this).chmod(mode).then(() => cb()).catch(cb);
}
function futimes(fd, atime, mtime, cb = nop) {
  new FileHandle(fd, this).utimes(atime, mtime).then(() => cb()).catch(cb);
}
function rmdir2(path, cb = nop) {
  rmdir.call(this, path).then(() => cb()).catch(cb);
}
function mkdir2(path, mode, cb = nop) {
  mkdir.call(this, path, mode).then(() => cb()).catch(cb);
}
function readdir2(path, _options, cb = nop) {
  cb = typeof _options == "function" ? _options : cb;
  const options = typeof _options != "function" ? _options : {};
  readdir.call(this, path, options).then((entries2) => cb(undefined, entries2)).catch(cb);
}
function link2(existing, newpath, cb = nop) {
  link.call(this, existing, newpath).then(() => cb()).catch(cb);
}
function symlink2(target, path, typeOrCB, cb = nop) {
  const type = typeof typeOrCB === "string" ? typeOrCB : "file";
  cb = typeof typeOrCB === "function" ? typeOrCB : cb;
  symlink.call(this, target, path, type).then(() => cb()).catch(cb);
}
function readlink2(path, options, callback = nop) {
  callback = typeof options == "function" ? options : callback;
  readlink.call(this, path).then((result) => callback(undefined, result)).catch(callback);
}
function chown2(path, uid, gid, cb = nop) {
  chown.call(this, path, uid, gid).then(() => cb()).catch(cb);
}
function lchown2(path, uid, gid, cb = nop) {
  lchown.call(this, path, uid, gid).then(() => cb()).catch(cb);
}
function chmod2(path, mode, cb = nop) {
  chmod.call(this, path, mode).then(() => cb()).catch(cb);
}
function lchmod2(path, mode, cb = nop) {
  lchmod.call(this, path, mode).then(() => cb()).catch(cb);
}
function utimes2(path, atime, mtime, cb = nop) {
  utimes.call(this, path, atime, mtime).then(() => cb()).catch(cb);
}
function lutimes2(path, atime, mtime, cb = nop) {
  lutimes.call(this, path, atime, mtime).then(() => cb()).catch(cb);
}
function realpath2(path, arg2, cb = nop) {
  cb = typeof arg2 === "function" ? arg2 : cb;
  realpath.call(this, path, typeof arg2 === "function" ? null : arg2).then((result) => cb(undefined, result)).catch(cb);
}
function access2(path, cbMode, cb = nop) {
  const mode = typeof cbMode === "number" ? cbMode : R_OK;
  cb = typeof cbMode === "function" ? cbMode : cb;
  access.call(this, path, mode).then(() => cb()).catch(cb);
}
var statWatchers = new Map;
function watchFile(path, options, listener) {
  const normalizedPath = normalizePath(path.toString());
  const opts = typeof options != "function" ? options : {};
  if (typeof options == "function") {
    listener = options;
  }
  if (!listener) {
    throw new ErrnoError(Errno.EINVAL, "No listener specified", path.toString(), "watchFile");
  }
  if (statWatchers.has(normalizedPath)) {
    const entry = statWatchers.get(normalizedPath);
    if (entry) {
      entry.listeners.add(listener);
    }
    return;
  }
  const watcher = new StatWatcher(this, normalizedPath, opts);
  watcher.on("change", (curr, prev) => {
    const entry = statWatchers.get(normalizedPath);
    if (!entry) {
      return;
    }
    for (const listener2 of entry.listeners) {
      listener2(curr, prev);
    }
  });
  statWatchers.set(normalizedPath, { watcher, listeners: new Set });
}
function unwatchFile(path, listener = nop) {
  const normalizedPath = normalizePath(path.toString());
  const entry = statWatchers.get(normalizedPath);
  if (entry) {
    if (listener && listener !== nop) {
      entry.listeners.delete(listener);
    } else {
      entry.listeners.clear();
    }
    if (entry.listeners.size === 0) {
      entry.watcher.stop();
      statWatchers.delete(normalizedPath);
    }
  }
}
function watch2(path, options, listener) {
  const watcher = new FSWatcher(this, normalizePath(path), typeof options == "object" ? options : {});
  listener = typeof options == "function" ? options : listener;
  watcher.on("change", listener || nop);
  return watcher;
}
function createReadStream(path, options) {
  options = typeof options == "object" ? options : { encoding: options };
  const _handle = open.call(this, path, "r", options === null || options === undefined ? undefined : options.mode);
  return new ReadStream({ ...options, autoClose: true }, _handle);
}
function createWriteStream(path, options) {
  options = typeof options == "object" ? options : { encoding: options };
  const _handle = open.call(this, path, "w", options === null || options === undefined ? undefined : options.mode);
  return new WriteStream(options, _handle);
}
function rm2(path, options, callback = nop) {
  callback = typeof options === "function" ? options : callback;
  rm.call(this, path, typeof options === "function" ? undefined : options).then(() => callback(undefined)).catch(callback);
}
function mkdtemp2(prefix, options, callback = nop) {
  callback = typeof options === "function" ? options : callback;
  mkdtemp.call(this, prefix, typeof options != "function" ? options : null).then((result) => callback(undefined, result)).catch(callback);
}
function copyFile2(src, dest, flags, callback = nop) {
  callback = typeof flags === "function" ? flags : callback;
  copyFile.call(this, src, dest, typeof flags === "function" ? undefined : flags).then(() => callback(undefined)).catch(callback);
}
function readv(fd, buffers, position, cb = nop) {
  cb = typeof position === "function" ? position : cb;
  new FileHandle(fd, this).readv(buffers, typeof position === "function" ? undefined : position).then(({ buffers: buffers2, bytesRead }) => cb(undefined, bytesRead, buffers2)).catch(cb);
}
function writev(fd, buffers, position, cb = nop) {
  cb = typeof position === "function" ? position : cb;
  new FileHandle(fd, this).writev(buffers, typeof position === "function" ? undefined : position).then(({ buffers: buffers2, bytesWritten }) => cb(undefined, bytesWritten, buffers2)).catch(cb);
}
function opendir2(path, options, cb = nop) {
  cb = typeof options === "function" ? options : cb;
  opendir.call(this, path, typeof options === "function" ? undefined : options).then((result) => cb(undefined, result)).catch(cb);
}
function cp2(source, destination, opts, callback = nop) {
  callback = typeof opts === "function" ? opts : callback;
  cp.call(this, source, destination, typeof opts === "function" ? undefined : opts).then(() => callback(undefined)).catch(callback);
}
function statfs2(path, options, callback = nop) {
  callback = typeof options === "function" ? options : callback;
  statfs.call(this, path, typeof options === "function" ? undefined : options).then((result) => callback(undefined, result)).catch(callback);
}
async function openAsBlob(path, options) {
  const handle = await open.call(this, path.toString(), "r");
  const buffer = await handle.readFile();
  await handle.close();
  return new Blob([buffer], options);
}
function glob2(pattern, options, callback = nop) {
  callback = typeof options == "function" ? options : callback;
  const it = glob.call(this, pattern, typeof options === "function" ? undefined : options);
  collectAsyncIterator(it).then((results) => {
    var _a2;
    return callback(null, (_a2 = results) !== null && _a2 !== undefined ? _a2 : []);
  }).catch((e) => callback(e));
}
// node_modules/@zenfs/core/dist/config.js
function isMountConfig(arg) {
  return isBackendConfig(arg) || isBackend(arg) || arg instanceof FileSystem;
}
async function resolveMountConfig(configuration, _depth = 0) {
  if (typeof configuration !== "object" || configuration == null) {
    throw err(new ErrnoError(Errno.EINVAL, "Invalid options on mount configuration"));
  }
  if (!isMountConfig(configuration)) {
    throw err(new ErrnoError(Errno.EINVAL, "Invalid mount configuration"));
  }
  if (configuration instanceof FileSystem) {
    await configuration.ready();
    return configuration;
  }
  if (isBackend(configuration)) {
    configuration = { backend: configuration };
  }
  for (const [key, value] of Object.entries(configuration)) {
    if (key == "backend")
      continue;
    if (!isMountConfig(value))
      continue;
    info("Resolving nested mount configuration: " + key);
    if (_depth > 10) {
      throw err(new ErrnoError(Errno.EINVAL, "Invalid configuration, too deep and possibly infinite"));
    }
    configuration[key] = await resolveMountConfig(value, ++_depth);
  }
  const { backend } = configuration;
  if (typeof backend.isAvailable == "function" && !await backend.isAvailable()) {
    throw err(new ErrnoError(Errno.EPERM, "Backend not available: " + backend.name));
  }
  await checkOptions(backend, configuration);
  const mount2 = await backend.create(configuration);
  if (configuration.disableAsyncCache)
    mount2.attributes.set("no_async");
  await mount2.ready();
  return mount2;
}
async function mount2(path, mount3) {
  if (path == "/") {
    mount(path, mount3);
    return;
  }
  const stats = await exports_promises.stat(path).catch(() => null);
  if (!stats) {
    await exports_promises.mkdir(path, { recursive: true });
  } else if (!stats.isDirectory()) {
    throw ErrnoError.With("ENOTDIR", path, "configure");
  }
  mount(path, mount3);
}
async function configure2(configuration) {
  var _a2;
  const uid = "uid" in configuration ? configuration.uid || 0 : 0;
  const gid = "gid" in configuration ? configuration.gid || 0 : 0;
  useCredentials({ uid, gid });
  config.checkAccess = !configuration.disableAccessChecks;
  config.updateOnRead = !configuration.disableUpdateOnRead;
  config.syncImmediately = !configuration.onlySyncOnClose;
  if (configuration.log)
    configure(configuration.log);
  if (configuration.mounts) {
    for (const [_point, mountConfig] of Object.entries(configuration.mounts).sort(([a2], [b3]) => a2.length > b3.length ? 1 : -1)) {
      const point = _point.startsWith("/") ? _point : "/" + _point;
      if (isBackendConfig(mountConfig)) {
        (_a2 = mountConfig.disableAsyncCache) !== null && _a2 !== undefined || (mountConfig.disableAsyncCache = configuration.disableAsyncCache || false);
      }
      if (point == "/")
        umount("/");
      await mount2(point, await resolveMountConfig(mountConfig));
    }
  }
  if (configuration.addDevices) {
    const devfs = new DeviceFS;
    devfs.addDefaults();
    await devfs.ready();
    await mount2("/dev", devfs);
  }
}

// node_modules/@zenfs/core/dist/backends/cow.js
var __disposeResources5 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var journalOperations = ["delete"];
var maxOpLength = Math.max(...journalOperations.map((op) => op.length));
// node_modules/utilium/dist/requests.js
var resourcesCache = new Map;

// node_modules/@zenfs/core/dist/internal/index_fs.js
class IndexFS extends FileSystem {
  constructor(id, name, index = new Index) {
    super(id, name);
    this.index = index;
  }
  usage() {
    return this.index.usage();
  }
  reloadFiles() {
    throw ErrnoError.With("ENOTSUP");
  }
  reloadFilesSync() {
    throw ErrnoError.With("ENOTSUP");
  }
  pathsForRename(oldPath, newPath) {
    if (!this.index.has(oldPath))
      throw ErrnoError.With("ENOENT", oldPath, "rename");
    if ((dirname(newPath) + "/").startsWith(oldPath + "/"))
      throw ErrnoError.With("EBUSY", dirname(oldPath), "rename");
    const toRename = [];
    for (const [from, inode] of this.index.entries()) {
      const rel = relative(oldPath, from);
      if (rel.startsWith(".."))
        continue;
      let to = join(newPath, rel);
      if (to.endsWith("/"))
        to = to.slice(0, -1);
      toRename.push({ from, to, inode });
    }
    return toRename;
  }
  async rename(oldPath, newPath) {
    if (oldPath == newPath)
      return;
    for (const { from, to, inode } of this.pathsForRename(oldPath, newPath)) {
      const data = new Uint8Array(inode.size);
      await this.read(from, data, 0, inode.size);
      this.index.delete(from);
      this.index.set(to, inode);
      await this.write(to, data, 0);
    }
    await this.remove(oldPath);
  }
  renameSync(oldPath, newPath) {
    if (oldPath == newPath)
      return;
    for (const { from, to, inode } of this.pathsForRename(oldPath, newPath)) {
      const data = new Uint8Array(inode.size);
      this.readSync(from, data, 0, inode.size);
      this.index.delete(from);
      this.index.set(to, inode);
      this.writeSync(to, data, 0);
    }
    this.removeSync(oldPath);
  }
  async stat(path) {
    const inode = this.index.get(path);
    if (!inode)
      throw ErrnoError.With("ENOENT", path, "stat");
    return new Stats(inode);
  }
  statSync(path) {
    const inode = this.index.get(path);
    if (!inode)
      throw ErrnoError.With("ENOENT", path, "stat");
    return new Stats(inode);
  }
  async openFile(path, flag) {
    var _a2;
    const stats = (_a2 = this.index.get(path)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, "openFile"));
    return new LazyFile(this, path, flag, stats);
  }
  openFileSync(path, flag) {
    var _a2;
    const stats = (_a2 = this.index.get(path)) !== null && _a2 !== undefined ? _a2 : _throw(ErrnoError.With("ENOENT", path, "openFile"));
    return new LazyFile(this, path, flag, stats);
  }
  _remove(path, isUnlink) {
    const syscall = isUnlink ? "unlink" : "rmdir";
    const inode = this.index.get(path);
    if (!inode)
      throw ErrnoError.With("ENOENT", path, syscall);
    const isDir = (inode.mode & S_IFMT) == S_IFDIR;
    if (!isDir && !isUnlink)
      throw ErrnoError.With("ENOTDIR", path, syscall);
    if (isDir && isUnlink)
      throw ErrnoError.With("EISDIR", path, syscall);
    this.index.delete(path);
  }
  async unlink(path) {
    this._remove(path, true);
    await this.remove(path);
  }
  unlinkSync(path) {
    this._remove(path, true);
    this.removeSync(path);
  }
  async rmdir(path) {
    this._remove(path, false);
    await this.remove(path);
  }
  rmdirSync(path) {
    this._remove(path, false);
    this.removeSync(path);
  }
  create(path, options) {
    const syscall = (options.mode & S_IFMT) == S_IFDIR ? "mkdir" : "createFile";
    if (this.index.has(path))
      throw ErrnoError.With("EEXIST", path, syscall);
    const parent = this.index.get(dirname(path));
    if (!parent)
      throw ErrnoError.With("ENOENT", dirname(path), syscall);
    const id = this.index._alloc();
    const inode = new Inode({
      ino: id,
      data: id + 1,
      mode: options.mode,
      size: 0,
      uid: parent.mode & S_ISUID ? parent.uid : options.uid,
      gid: parent.mode & S_ISGID ? parent.gid : options.gid
    });
    this.index.set(path, inode);
    return inode;
  }
  async createFile(path, flag, mode, options) {
    const node = this.create(path, { mode: mode | S_IFREG, ...options });
    return new LazyFile(this, path, flag, node.toStats());
  }
  createFileSync(path, flag, mode, options) {
    const node = this.create(path, { mode: mode | S_IFREG, ...options });
    return new LazyFile(this, path, flag, node.toStats());
  }
  async mkdir(path, mode, options) {
    this.create(path, { mode: mode | S_IFDIR, ...options });
  }
  mkdirSync(path, mode, options) {
    this.create(path, { mode: mode | S_IFDIR, ...options });
  }
  link(target, link3) {
    throw ErrnoError.With("ENOSYS", link3, "link");
  }
  linkSync(target, link3) {
    throw ErrnoError.With("ENOSYS", link3, "link");
  }
  async readdir(path) {
    return Object.keys(this.index.directoryEntries(path));
  }
  readdirSync(path) {
    return Object.keys(this.index.directoryEntries(path));
  }
  async sync(path, data, stats) {
    var _a2;
    const inode = this.index.get(path);
    if (!inode)
      throw ErrnoError.With("ENOENT", path, "sync");
    if (inode.update(stats))
      await ((_a2 = this.syncMetadata) === null || _a2 === undefined ? undefined : _a2.call(this, path, stats));
    if (data)
      await this.write(path, data, 0);
  }
  syncSync(path, data, stats) {
    var _a2;
    const inode = this.index.get(path);
    if (!inode)
      throw ErrnoError.With("ENOENT", path, "sync");
    if (inode.update(stats))
      (_a2 = this.syncMetadataSync) === null || _a2 === undefined || _a2.call(this, path, stats);
    if (data)
      this.writeSync(path, data, 0);
  }
}
// node_modules/@zenfs/core/dist/backends/passthrough.js
var __disposeResources6 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
// node_modules/@zenfs/core/dist/mixins/async.js
var __addDisposableResource5 = function(env, value, async2) {
  if (value !== null && value !== undefined) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async2) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === undefined) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async2)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async: async2 });
  } else if (async2) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources7 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
function Async(FS) {

  class AsyncFS extends FS {
    async done() {
      await this._promise;
    }
    queueDone() {
      return this.done();
    }
    _async(promise) {
      this._promise = this._promise.then(() => promise);
    }
    constructor(...args) {
      super(...args);
      this._promise = Promise.resolve();
      this._isInitialized = false;
      this._skippedCacheUpdates = 0;
      this._patchAsync();
    }
    async ready() {
      await super.ready();
      await this.queueDone();
      if (this._isInitialized || this.attributes.has("no_async"))
        return;
      this.checkSync();
      await this._sync.ready();
      if (this._sync instanceof StoreFS && this instanceof StoreFS) {
        const sync2 = this._sync.transaction();
        const async2 = this.transaction();
        const promises = [];
        for (const key of await async2.keys()) {
          promises.push(async2.get(key).then((data) => sync2.setSync(key, data)));
        }
        await Promise.all(promises);
        this._isInitialized = true;
        return;
      }
      try {
        await this.crossCopy("/");
        debug(`Skipped ${this._skippedCacheUpdates} updates to the sync cache during initialization`);
        this._isInitialized = true;
      } catch (e) {
        this._isInitialized = false;
        throw crit(e, { fs: this });
      }
    }
    checkSync(path, syscall) {
      if (this.attributes.has("no_async")) {
        throw crit(new ErrnoError(Errno.ENOTSUP, "Sync preloading has been disabled for this async file system", path, syscall), {
          fs: this
        });
      }
      if (!this._sync) {
        throw crit(new ErrnoError(Errno.ENOTSUP, "No sync cache is attached to this async file system", path, syscall), { fs: this });
      }
    }
    renameSync(oldPath, newPath) {
      this.checkSync(oldPath, "rename");
      this._sync.renameSync(oldPath, newPath);
      this._async(this.rename(oldPath, newPath));
    }
    statSync(path) {
      this.checkSync(path, "stat");
      return this._sync.statSync(path);
    }
    createFileSync(path, flag, mode, options) {
      this.checkSync(path, "createFile");
      const file = this._sync.createFileSync(path, flag, mode, options);
      this._async(this.createFile(path, flag, mode, options));
      return new LazyFile(this, path, flag, file.statSync());
    }
    openFileSync(path, flag) {
      this.checkSync(path, "openFile");
      const stats = this._sync.statSync(path);
      return new LazyFile(this, path, flag, stats);
    }
    unlinkSync(path) {
      this.checkSync(path, "unlinkSync");
      this._sync.unlinkSync(path);
      this._async(this.unlink(path));
    }
    rmdirSync(path) {
      this.checkSync(path, "rmdir");
      this._sync.rmdirSync(path);
      this._async(this.rmdir(path));
    }
    mkdirSync(path, mode, options) {
      this.checkSync(path, "mkdir");
      this._sync.mkdirSync(path, mode, options);
      this._async(this.mkdir(path, mode, options));
    }
    readdirSync(path) {
      this.checkSync(path, "readdir");
      return this._sync.readdirSync(path);
    }
    linkSync(srcpath, dstpath) {
      this.checkSync(srcpath, "link");
      this._sync.linkSync(srcpath, dstpath);
      this._async(this.link(srcpath, dstpath));
    }
    syncSync(path, data, stats) {
      this.checkSync(path, "sync");
      this._sync.syncSync(path, data, stats);
      this._async(this.sync(path, data, stats));
    }
    existsSync(path) {
      this.checkSync(path, "exists");
      return this._sync.existsSync(path);
    }
    readSync(path, buffer, offset, end) {
      this.checkSync(path, "read");
      this._sync.readSync(path, buffer, offset, end);
    }
    writeSync(path, buffer, offset) {
      this.checkSync(path, "write");
      this._sync.writeSync(path, buffer, offset);
      this._async(this.write(path, buffer, offset));
    }
    streamWrite(path, options) {
      this.checkSync(path, "streamWrite");
      const sync2 = this._sync.streamWrite(path, options).getWriter();
      const async2 = super.streamWrite(path, options).getWriter();
      return new WritableStream({
        async write(chunk, controller) {
          await Promise.all([sync2.write(chunk), async2.write(chunk)]).catch(controller.error.bind(controller));
        },
        async close() {
          await Promise.all([sync2.close(), async2.close()]);
        },
        async abort(reason) {
          await Promise.all([sync2.abort(reason), async2.abort(reason)]);
        }
      });
    }
    async crossCopy(path) {
      this.checkSync(path, "crossCopy");
      const stats = await this.stat(path);
      if (!stats.isDirectory()) {
        const env_1 = { stack: [], error: undefined, hasError: false };
        try {
          const syncFile = __addDisposableResource5(env_1, this._sync.createFileSync(path, parseFlag("w"), stats.mode, stats), false);
          const buffer = new Uint8Array(stats.size);
          await this.read(path, buffer, 0, stats.size);
          syncFile.writeSync(buffer, 0, stats.size);
          return;
        } catch (e_1) {
          env_1.error = e_1;
          env_1.hasError = true;
        } finally {
          __disposeResources7(env_1);
        }
      }
      if (path !== "/") {
        const stats2 = await this.stat(path);
        this._sync.mkdirSync(path, stats2.mode, stats2);
      }
      const promises = [];
      for (const file of await this.readdir(path)) {
        promises.push(this.crossCopy(join(path, file)));
      }
      await Promise.all(promises);
    }
    _patchAsync() {
      const methods = Array.from(getAllPrototypes(this)).flatMap(Object.getOwnPropertyNames).filter((key) => typeof this[key] == "function" && (`${key}Sync` in this));
      debug("Async: patching methods: " + methods.join(", "));
      for (const key of methods) {
        const originalMethod = this[key];
        this[key] = async (...args) => {
          var _a2, _b2, _c2;
          const result = await originalMethod.apply(this, args);
          const stack = (_a2 = new Error().stack) === null || _a2 === undefined ? undefined : _a2.split(`
`).slice(2).join(`
`);
          if ((stack === null || stack === undefined ? undefined : stack.includes(`at <computed> [as ${key}]`)) || (stack === null || stack === undefined ? undefined : stack.includes(`${key}Sync `)) || !stack)
            return result;
          if (!this._isInitialized) {
            this._skippedCacheUpdates++;
            return result;
          }
          try {
            (_c2 = (_b2 = this._sync) === null || _b2 === undefined ? undefined : _b2[`${key}Sync`]) === null || _c2 === undefined || _c2.call(_b2, ...args);
          } catch (e) {
            throw err(new ErrnoError(e.errno, e.message + " (Out of sync!)", e.path, key), { fs: this });
          }
          return result;
        };
      }
    }
  }
  return AsyncFS;
}

// node_modules/@zenfs/core/dist/backends/port/rpc.js
function isFileData(value) {
  return typeof value == "object" && value != null && "path" in value && "flag" in value;
}
function isMessage(arg) {
  return typeof arg == "object" && arg != null && "_zenfs" in arg && !!arg._zenfs;
}
var executors = new Map;
function request(request2, { port, timeout = 1000, fs } = {}) {
  const stack = `
` + new Error().stack.slice("Error:".length);
  if (!port)
    throw err(new ErrnoError(Errno.EINVAL, "Can not make an RPC request without a port"));
  return new Promise((resolve2, reject) => {
    const id = Math.random().toString(16).slice(10);
    executors.set(id, { resolve: resolve2, reject, fs });
    port.postMessage({ ...request2, _zenfs: true, id, stack });
    const _2 = setTimeout(() => {
      const error = err(new ErrnoError(Errno.EIO, "RPC Failed", typeof request2.args[0] == "string" ? request2.args[0] : "", request2.method), {
        fs
      });
      error.stack += stack;
      reject(error);
      if (typeof _2 == "object")
        _2.unref();
    }, timeout);
  });
}
function handleResponse(response) {
  if (!isMessage(response)) {
    return;
  }
  const { id, value, error, stack } = response;
  if (!executors.has(id)) {
    const error2 = err(new ErrnoError(Errno.EIO, "Invalid RPC id:" + id));
    error2.stack += stack;
    throw error2;
  }
  const { resolve: resolve2, reject, fs } = executors.get(id);
  if (error) {
    const e = ErrnoError.fromJSON({ code: "EIO", errno: Errno.EIO, ...value });
    e.stack += stack;
    reject(e);
    executors.delete(id);
    return;
  }
  if (isFileData(value)) {
    const { path, flag, stats } = value;
    const file = new LazyFile(fs, path, flag, new Stats(stats));
    resolve2(file);
    executors.delete(id);
    return;
  }
  resolve2(value);
  executors.delete(id);
  return;
}
function attach(port, handler) {
  if (!port)
    throw err(new ErrnoError(Errno.EINVAL, "Cannot attach to non-existent port"));
  info("Attached handler to port: " + handler.name);
  port["on" in port ? "on" : "addEventListener"]("message", (message) => {
    handler(typeof message == "object" && message !== null && "data" in message ? message.data : message);
  });
}

// node_modules/@zenfs/core/dist/backends/port/fs.js
class PortFS extends Async(FileSystem) {
  constructor(options) {
    super(1886351988, "portfs");
    this.options = options;
    this._sync = InMemory.create({ name: "tmpfs:port" });
    this.port = options.port;
    attach(this.port, handleResponse);
  }
  rpc(method, ...args) {
    return request({ method, args }, {
      ...this.options,
      fs: this
    });
  }
  async ready() {
    await this.rpc("ready");
    await super.ready();
  }
  rename(oldPath, newPath) {
    return this.rpc("rename", oldPath, newPath);
  }
  async stat(path) {
    return new Stats(await this.rpc("stat", path));
  }
  sync(path, data, stats) {
    stats = "toJSON" in stats ? stats.toJSON() : stats;
    return this.rpc("sync", path, data, stats);
  }
  openFile(path, flag) {
    return this.rpc("openFile", path, flag);
  }
  createFile(path, flag, mode, options) {
    return this.rpc("createFile", path, flag, mode, options);
  }
  unlink(path) {
    return this.rpc("unlink", path);
  }
  rmdir(path) {
    return this.rpc("rmdir", path);
  }
  mkdir(path, mode, options) {
    return this.rpc("mkdir", path, mode, options);
  }
  readdir(path) {
    return this.rpc("readdir", path);
  }
  exists(path) {
    return this.rpc("exists", path);
  }
  link(srcpath, dstpath) {
    return this.rpc("link", srcpath, dstpath);
  }
  async read(path, buffer, offset, length) {
    const _buf = await this.rpc("read", path, buffer, offset, length);
    buffer.set(_buf);
  }
  write(path, buffer, offset) {
    return this.rpc("write", path, buffer, offset);
  }
}
// node_modules/utilium/dist/checksum.js
var crc32cTable = new Uint32Array(256);
for (let i = 0;i < 256; i++) {
  let value = i;
  for (let j2 = 0;j2 < 8; j2++) {
    value = value & 1 ? 2197175160 ^ value >>> 1 : value >>> 1;
  }
  crc32cTable[i] = value;
}
function crc32c(data) {
  let crc = 4294967295;
  for (let i = 0;i < data.length; i++) {
    crc = crc >>> 8 ^ crc32cTable[(crc ^ data[i]) & 255];
  }
  return (crc ^ 4294967295) >>> 0;
}

// node_modules/@zenfs/core/dist/backends/single_buffer.js
var __esDecorate2 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== undefined && typeof f !== "function")
      throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _2, done = false;
  for (var i = decorators.length - 1;i >= 0; i--) {
    var context = {};
    for (var p in contextIn)
      context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access)
      context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done)
        throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === undefined)
        continue;
      if (result === null || typeof result !== "object")
        throw new TypeError("Object expected");
      if (_2 = accept(result.get))
        descriptor.get = _2;
      if (_2 = accept(result.set))
        descriptor.set = _2;
      if (_2 = accept(result.init))
        initializers.unshift(_2);
    } else if (_2 = accept(result)) {
      if (kind === "field")
        initializers.unshift(_2);
      else
        descriptor[key] = _2;
    }
  }
  if (target)
    Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var __runInitializers2 = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0;i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : undefined;
};
var __setFunctionName2 = function(f, name, prefix) {
  if (typeof name === "symbol")
    name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var MetadataEntry = (() => {
  var _a2, _b2, _c2, _d;
  let _classDecorators = [struct()];
  let _classDescriptor;
  let _classExtraInitializers = [];
  let _classThis;
  let _id_decorators;
  let _id_initializers = [];
  let _id_extraInitializers = [];
  let _offset__decorators;
  let _offset__initializers = [];
  let _offset__extraInitializers = [];
  let _offset_decorators;
  let _offset_initializers = [];
  let _offset_extraInitializers = [];
  let _size_decorators;
  let _size_initializers = [];
  let _size_extraInitializers = [];
  var MetadataEntry2 = _classThis = class {
    constructor() {
      this.id = __runInitializers2(this, _id_initializers, 0);
      this.offset_ = (__runInitializers2(this, _id_extraInitializers), __runInitializers2(this, _offset__initializers, 0));
      this.offset = (__runInitializers2(this, _offset__extraInitializers), __runInitializers2(this, _offset_initializers, 0));
      this.size = (__runInitializers2(this, _offset_extraInitializers), __runInitializers2(this, _size_initializers, 0));
      __runInitializers2(this, _size_extraInitializers);
    }
  };
  __setFunctionName2(_classThis, "MetadataEntry");
  (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : undefined;
    _id_decorators = [(_a2 = types2).uint32.bind(_a2)];
    _offset__decorators = [(_b2 = types2).uint32.bind(_b2)];
    _offset_decorators = [(_c2 = types2).uint32.bind(_c2)];
    _size_decorators = [(_d = types2).uint32.bind(_d)];
    __esDecorate2(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: (obj) => ("id" in obj), get: (obj) => obj.id, set: (obj, value) => {
      obj.id = value;
    } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
    __esDecorate2(null, null, _offset__decorators, { kind: "field", name: "offset_", static: false, private: false, access: { has: (obj) => ("offset_" in obj), get: (obj) => obj.offset_, set: (obj, value) => {
      obj.offset_ = value;
    } }, metadata: _metadata }, _offset__initializers, _offset__extraInitializers);
    __esDecorate2(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: (obj) => ("offset" in obj), get: (obj) => obj.offset, set: (obj, value) => {
      obj.offset = value;
    } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
    __esDecorate2(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: (obj) => ("size" in obj), get: (obj) => obj.size, set: (obj, value) => {
      obj.size = value;
    } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
    __esDecorate2(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
    MetadataEntry2 = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers2(_classThis, _classExtraInitializers);
  })();
  return MetadataEntry2 = _classThis;
})();
var entries_per_block = 255;
var MetadataBlock = (() => {
  var _a2, _b2, _c2, _d;
  let _classDecorators = [struct()];
  let _classDescriptor;
  let _classExtraInitializers = [];
  let _classThis;
  let _checksum_decorators;
  let _checksum_initializers = [];
  let _checksum_extraInitializers = [];
  let _timestamp_decorators;
  let _timestamp_initializers = [];
  let _timestamp_extraInitializers = [];
  let _previous_offset__decorators;
  let _previous_offset__initializers = [];
  let _previous_offset__extraInitializers = [];
  let _previous_offset_decorators;
  let _previous_offset_initializers = [];
  let _previous_offset_extraInitializers = [];
  let _entries_decorators;
  let _entries_initializers = [];
  let _entries_extraInitializers = [];
  var MetadataBlock2 = _classThis = class {
    constructor(superblock, offset = 0) {
      this.superblock = superblock;
      this.offset = offset;
      this.checksum = __runInitializers2(this, _checksum_initializers, 0);
      this.timestamp = (__runInitializers2(this, _checksum_extraInitializers), __runInitializers2(this, _timestamp_initializers, Date.now()));
      this.previous_offset_ = (__runInitializers2(this, _timestamp_extraInitializers), __runInitializers2(this, _previous_offset__initializers, 0));
      this.previous_offset = (__runInitializers2(this, _previous_offset__extraInitializers), __runInitializers2(this, _previous_offset_initializers, 0));
      this._previous = __runInitializers2(this, _previous_offset_extraInitializers);
      this.entries = __runInitializers2(this, _entries_initializers, Array.from({ length: entries_per_block }, () => new MetadataEntry));
      __runInitializers2(this, _entries_extraInitializers);
      this.superblock = superblock;
      this.offset = offset;
      if (!offset)
        return;
      deserialize(this, superblock.store._buffer.subarray(offset, offset + sizeof(MetadataBlock2)));
      if (!checksumMatches(this))
        throw crit(new ErrnoError(Errno.EIO, "SingleBuffer: Checksum mismatch for metadata block at 0x" + offset.toString(16)));
    }
    get previous() {
      var _a3;
      if (!this.previous_offset)
        return;
      (_a3 = this._previous) !== null && _a3 !== undefined || (this._previous = new MetadataBlock2(this.superblock, this.previous_offset));
      return this._previous;
    }
  };
  __setFunctionName2(_classThis, "MetadataBlock");
  (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : undefined;
    _checksum_decorators = [(_a2 = types2).uint32.bind(_a2)];
    _timestamp_decorators = [(_b2 = types2).uint32.bind(_b2)];
    _previous_offset__decorators = [(_c2 = types2).uint32.bind(_c2)];
    _previous_offset_decorators = [(_d = types2).uint32.bind(_d)];
    _entries_decorators = [member(MetadataEntry, entries_per_block)];
    __esDecorate2(null, null, _checksum_decorators, { kind: "field", name: "checksum", static: false, private: false, access: { has: (obj) => ("checksum" in obj), get: (obj) => obj.checksum, set: (obj, value) => {
      obj.checksum = value;
    } }, metadata: _metadata }, _checksum_initializers, _checksum_extraInitializers);
    __esDecorate2(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: (obj) => ("timestamp" in obj), get: (obj) => obj.timestamp, set: (obj, value) => {
      obj.timestamp = value;
    } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
    __esDecorate2(null, null, _previous_offset__decorators, { kind: "field", name: "previous_offset_", static: false, private: false, access: { has: (obj) => ("previous_offset_" in obj), get: (obj) => obj.previous_offset_, set: (obj, value) => {
      obj.previous_offset_ = value;
    } }, metadata: _metadata }, _previous_offset__initializers, _previous_offset__extraInitializers);
    __esDecorate2(null, null, _previous_offset_decorators, { kind: "field", name: "previous_offset", static: false, private: false, access: { has: (obj) => ("previous_offset" in obj), get: (obj) => obj.previous_offset, set: (obj, value) => {
      obj.previous_offset = value;
    } }, metadata: _metadata }, _previous_offset_initializers, _previous_offset_extraInitializers);
    __esDecorate2(null, null, _entries_decorators, { kind: "field", name: "entries", static: false, private: false, access: { has: (obj) => ("entries" in obj), get: (obj) => obj.entries, set: (obj, value) => {
      obj.entries = value;
    } }, metadata: _metadata }, _entries_initializers, _entries_extraInitializers);
    __esDecorate2(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
    MetadataBlock2 = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers2(_classThis, _classExtraInitializers);
  })();
  return MetadataBlock2 = _classThis;
})();
var sb_magic = 2049864546;
var SuperBlock = (() => {
  var _a2, _b2, _c2, _d, _e, _f, _g, _h, _j, _k, _l;
  let _classDecorators = [struct()];
  let _classDescriptor;
  let _classExtraInitializers = [];
  let _classThis;
  let _checksum_decorators;
  let _checksum_initializers = [];
  let _checksum_extraInitializers = [];
  let _magic_decorators;
  let _magic_initializers = [];
  let _magic_extraInitializers = [];
  let _version_decorators;
  let _version_initializers = [];
  let _version_extraInitializers = [];
  let _inode_format_decorators;
  let _inode_format_initializers = [];
  let _inode_format_extraInitializers = [];
  let _flags_decorators;
  let _flags_initializers = [];
  let _flags_extraInitializers = [];
  let _used_bytes_decorators;
  let _used_bytes_initializers = [];
  let _used_bytes_extraInitializers = [];
  let _total_bytes_decorators;
  let _total_bytes_initializers = [];
  let _total_bytes_extraInitializers = [];
  let _id_decorators;
  let _id_initializers = [];
  let _id_extraInitializers = [];
  let _metadata_block_size_decorators;
  let _metadata_block_size_initializers = [];
  let _metadata_block_size_extraInitializers = [];
  let _metadata_offset__decorators;
  let _metadata_offset__initializers = [];
  let _metadata_offset__extraInitializers = [];
  let _metadata_offset_decorators;
  let _metadata_offset_initializers = [];
  let _metadata_offset_extraInitializers = [];
  let _label_decorators;
  let _label_initializers = [];
  let _label_extraInitializers = [];
  let __padding_decorators;
  let __padding_initializers = [];
  let __padding_extraInitializers = [];
  var SuperBlock2 = _classThis = class {
    constructor(store) {
      this.store = store;
      this.checksum = __runInitializers2(this, _checksum_initializers, 0);
      this.magic = (__runInitializers2(this, _checksum_extraInitializers), __runInitializers2(this, _magic_initializers, sb_magic));
      this.version = (__runInitializers2(this, _magic_extraInitializers), __runInitializers2(this, _version_initializers, 1));
      this.inode_format = (__runInitializers2(this, _version_extraInitializers), __runInitializers2(this, _inode_format_initializers, _inode_version));
      this.flags = (__runInitializers2(this, _inode_format_extraInitializers), __runInitializers2(this, _flags_initializers, 0));
      this.used_bytes = (__runInitializers2(this, _flags_extraInitializers), __runInitializers2(this, _used_bytes_initializers, BigInt(0)));
      this.total_bytes = (__runInitializers2(this, _used_bytes_extraInitializers), __runInitializers2(this, _total_bytes_initializers, BigInt(0)));
      this.id = (__runInitializers2(this, _total_bytes_extraInitializers), __runInitializers2(this, _id_initializers, BigInt(0)));
      this.metadata_block_size = (__runInitializers2(this, _id_extraInitializers), __runInitializers2(this, _metadata_block_size_initializers, sizeof(MetadataBlock)));
      this.metadata_offset_ = (__runInitializers2(this, _metadata_block_size_extraInitializers), __runInitializers2(this, _metadata_offset__initializers, 0));
      this.metadata_offset = (__runInitializers2(this, _metadata_offset__extraInitializers), __runInitializers2(this, _metadata_offset_initializers, 0));
      this.metadata = __runInitializers2(this, _metadata_offset_extraInitializers);
      this.label = __runInitializers2(this, _label_initializers, "");
      this._padding = (__runInitializers2(this, _label_extraInitializers), __runInitializers2(this, __padding_initializers, new Array(132).fill(0)));
      __runInitializers2(this, __padding_extraInitializers);
      this.store = store;
      if (store._view.getUint32(offsetof(SuperBlock2, "magic"), true) != sb_magic) {
        warn("SingleBuffer: Invalid magic value, assuming this is a fresh super block");
        this.metadata = new MetadataBlock(this);
        this.used_bytes = BigInt(sizeof(SuperBlock2) + sizeof(MetadataBlock));
        this.total_bytes = BigInt(store._buffer.byteLength);
        store._write(this);
        store._write(this.metadata);
        return;
      }
      deserialize(this, store._buffer.subarray(0, sizeof(SuperBlock2)));
      if (!checksumMatches(this))
        throw crit(new ErrnoError(Errno.EIO, "SingleBuffer: Checksum mismatch for super block!"));
      this.metadata = new MetadataBlock(this, this.metadata_offset);
    }
    rotateMetadata() {
      const metadata2 = new MetadataBlock(this);
      metadata2.offset = Number(this.used_bytes);
      metadata2.previous_offset = this.metadata_offset;
      this.metadata = metadata2;
      this.metadata_offset = metadata2.offset;
      this.store._write(metadata2);
      this.used_bytes += BigInt(sizeof(MetadataBlock));
      this.store._write(this);
      return metadata2;
    }
    isUnused(offset, length) {
      if (!length)
        return true;
      if (offset + length > this.total_bytes || offset < sizeof(SuperBlock2))
        return false;
      for (let block = this.metadata;block; block = block.previous) {
        if (offset < block.offset + sizeof(MetadataBlock) && offset + length > block.offset)
          return false;
        for (const entry of block.entries) {
          if (!entry.offset)
            continue;
          if (offset >= entry.offset && offset < entry.offset + entry.size || offset + length > entry.offset && offset + length <= entry.offset + entry.size || offset <= entry.offset && offset + length >= entry.offset + entry.size) {
            return false;
          }
        }
      }
      return true;
    }
  };
  __setFunctionName2(_classThis, "SuperBlock");
  (() => {
    const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : undefined;
    _checksum_decorators = [(_a2 = types2).uint32.bind(_a2)];
    _magic_decorators = [(_b2 = types2).uint32.bind(_b2)];
    _version_decorators = [(_c2 = types2).uint16.bind(_c2)];
    _inode_format_decorators = [(_d = types2).uint16.bind(_d)];
    _flags_decorators = [(_e = types2).uint32.bind(_e)];
    _used_bytes_decorators = [(_f = types2).uint64.bind(_f)];
    _total_bytes_decorators = [(_g = types2).uint64.bind(_g)];
    _id_decorators = [(_h = types2).uint128.bind(_h)];
    _metadata_block_size_decorators = [(_j = types2).uint32.bind(_j)];
    _metadata_offset__decorators = [(_k = types2).uint32.bind(_k)];
    _metadata_offset_decorators = [(_l = types2).uint32.bind(_l)];
    _label_decorators = [types2.char(64)];
    __padding_decorators = [types2.char(132)];
    __esDecorate2(null, null, _checksum_decorators, { kind: "field", name: "checksum", static: false, private: false, access: { has: (obj) => ("checksum" in obj), get: (obj) => obj.checksum, set: (obj, value) => {
      obj.checksum = value;
    } }, metadata: _metadata }, _checksum_initializers, _checksum_extraInitializers);
    __esDecorate2(null, null, _magic_decorators, { kind: "field", name: "magic", static: false, private: false, access: { has: (obj) => ("magic" in obj), get: (obj) => obj.magic, set: (obj, value) => {
      obj.magic = value;
    } }, metadata: _metadata }, _magic_initializers, _magic_extraInitializers);
    __esDecorate2(null, null, _version_decorators, { kind: "field", name: "version", static: false, private: false, access: { has: (obj) => ("version" in obj), get: (obj) => obj.version, set: (obj, value) => {
      obj.version = value;
    } }, metadata: _metadata }, _version_initializers, _version_extraInitializers);
    __esDecorate2(null, null, _inode_format_decorators, { kind: "field", name: "inode_format", static: false, private: false, access: { has: (obj) => ("inode_format" in obj), get: (obj) => obj.inode_format, set: (obj, value) => {
      obj.inode_format = value;
    } }, metadata: _metadata }, _inode_format_initializers, _inode_format_extraInitializers);
    __esDecorate2(null, null, _flags_decorators, { kind: "field", name: "flags", static: false, private: false, access: { has: (obj) => ("flags" in obj), get: (obj) => obj.flags, set: (obj, value) => {
      obj.flags = value;
    } }, metadata: _metadata }, _flags_initializers, _flags_extraInitializers);
    __esDecorate2(null, null, _used_bytes_decorators, { kind: "field", name: "used_bytes", static: false, private: false, access: { has: (obj) => ("used_bytes" in obj), get: (obj) => obj.used_bytes, set: (obj, value) => {
      obj.used_bytes = value;
    } }, metadata: _metadata }, _used_bytes_initializers, _used_bytes_extraInitializers);
    __esDecorate2(null, null, _total_bytes_decorators, { kind: "field", name: "total_bytes", static: false, private: false, access: { has: (obj) => ("total_bytes" in obj), get: (obj) => obj.total_bytes, set: (obj, value) => {
      obj.total_bytes = value;
    } }, metadata: _metadata }, _total_bytes_initializers, _total_bytes_extraInitializers);
    __esDecorate2(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: (obj) => ("id" in obj), get: (obj) => obj.id, set: (obj, value) => {
      obj.id = value;
    } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
    __esDecorate2(null, null, _metadata_block_size_decorators, { kind: "field", name: "metadata_block_size", static: false, private: false, access: { has: (obj) => ("metadata_block_size" in obj), get: (obj) => obj.metadata_block_size, set: (obj, value) => {
      obj.metadata_block_size = value;
    } }, metadata: _metadata }, _metadata_block_size_initializers, _metadata_block_size_extraInitializers);
    __esDecorate2(null, null, _metadata_offset__decorators, { kind: "field", name: "metadata_offset_", static: false, private: false, access: { has: (obj) => ("metadata_offset_" in obj), get: (obj) => obj.metadata_offset_, set: (obj, value) => {
      obj.metadata_offset_ = value;
    } }, metadata: _metadata }, _metadata_offset__initializers, _metadata_offset__extraInitializers);
    __esDecorate2(null, null, _metadata_offset_decorators, { kind: "field", name: "metadata_offset", static: false, private: false, access: { has: (obj) => ("metadata_offset" in obj), get: (obj) => obj.metadata_offset, set: (obj, value) => {
      obj.metadata_offset = value;
    } }, metadata: _metadata }, _metadata_offset_initializers, _metadata_offset_extraInitializers);
    __esDecorate2(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: (obj) => ("label" in obj), get: (obj) => obj.label, set: (obj, value) => {
      obj.label = value;
    } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
    __esDecorate2(null, null, __padding_decorators, { kind: "field", name: "_padding", static: false, private: false, access: { has: (obj) => ("_padding" in obj), get: (obj) => obj._padding, set: (obj, value) => {
      obj._padding = value;
    } }, metadata: _metadata }, __padding_initializers, __padding_extraInitializers);
    __esDecorate2(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
    SuperBlock2 = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    __runInitializers2(_classThis, _classExtraInitializers);
  })();
  return SuperBlock2 = _classThis;
})();
function checksumMatches(value) {
  const buffer = serialize(value);
  const computed = crc32c(buffer.subarray(4));
  return value.checksum === computed;
}
// node_modules/@zenfs/core/dist/mixins/mutexed.js
var __disposeResources8 = function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
}(typeof SuppressedError === "function" ? SuppressedError : function(error2, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error2, e.suppressed = suppressed, e;
});
// node_modules/@zenfs/core/dist/mixins/sync.js
function Sync(FS) {
  class SyncFS extends FS {
    async exists(path) {
      return this.existsSync(path);
    }
    async rename(oldPath, newPath) {
      return this.renameSync(oldPath, newPath);
    }
    async stat(path) {
      return this.statSync(path);
    }
    async createFile(path, flag, mode, options) {
      return this.createFileSync(path, flag, mode, options);
    }
    async openFile(path, flag) {
      return this.openFileSync(path, flag);
    }
    async unlink(path) {
      return this.unlinkSync(path);
    }
    async rmdir(path) {
      return this.rmdirSync(path);
    }
    async mkdir(path, mode, options) {
      return this.mkdirSync(path, mode, options);
    }
    async readdir(path) {
      return this.readdirSync(path);
    }
    async link(srcpath, dstpath) {
      return this.linkSync(srcpath, dstpath);
    }
    async sync(path, data, stats) {
      return this.syncSync(path, data, stats);
    }
    async read(path, buffer, offset, end) {
      return this.readSync(path, buffer, offset, end);
    }
    async write(path, buffer, offset) {
      return this.writeSync(path, buffer, offset);
    }
  }
  return SyncFS;
}
// node_modules/@zenfs/core/dist/index.js
globalThis.__zenfs__ = exports_vfs;

// node_modules/@zenfs/dom/dist/utils.js
function errnoForDOMException(ex) {
  switch (ex.name) {
    case "TypeMismatchError":
      return "EPERM";
    case "IndexSizeError":
    case "HierarchyRequestError":
    case "InvalidCharacterError":
    case "InvalidStateError":
    case "SyntaxError":
    case "NamespaceError":
    case "ConstraintError":
    case "VersionError":
    case "URLMismatchError":
    case "InvalidNodeTypeError":
      return "EINVAL";
    case "WrongDocumentError":
      return "EXDEV";
    case "NoModificationAllowedError":
    case "InvalidModificationError":
    case "InvalidAccessError":
    case "SecurityError":
    case "NotAllowedError":
      return "EACCES";
    case "NotFoundError":
      return "ENOENT";
    case "NotSupportedError":
      return "ENOTSUP";
    case "InUseAttributeError":
      return "EBUSY";
    case "NetworkError":
      return "ENETDOWN";
    case "AbortError":
      return "EINTR";
    case "QuotaExceededError":
      return "ENOSPC";
    case "TimeoutError":
      return "ETIMEDOUT";
    case "ReadOnlyError":
      return "EROFS";
    case "DataCloneError":
    case "EncodingError":
    case "NotReadableError":
    case "DataError":
    case "TransactionInactiveError":
    case "OperationError":
    case "UnknownError":
    default:
      return "EIO";
  }
}
function convertException(ex, path, syscall) {
  if (ex instanceof ErrnoError)
    return ex;
  const code = ex instanceof DOMException ? Errno[errnoForDOMException(ex)] : Errno.EIO;
  const error2 = new ErrnoError(code, ex.message, path, syscall);
  error2.stack = ex.stack;
  error2.cause = ex.cause;
  return error2;
}

// node_modules/@zenfs/dom/dist/access.js
function isResizable(buffer) {
  if (buffer instanceof ArrayBuffer)
    return buffer.resizable;
  if (buffer instanceof SharedArrayBuffer)
    return buffer.growable;
  return false;
}
function isKind(handle, kind) {
  return handle.kind == kind;
}

class WebAccessFS extends Async(IndexFS) {
  async _loadHandles(path, handle) {
    for await (const [key, child] of handle.entries()) {
      const p = join(path, key);
      this._handles.set(p, child);
      if (isKind(child, "directory"))
        await this._loadHandles(p, child);
    }
  }
  async _loadMetadata(metadataPath) {
    if (metadataPath) {
      const handle = this.get("file", metadataPath);
      const file2 = await handle.getFile();
      const raw = await file2.text();
      const data = JSON.parse(raw);
      this.index.fromJSON(data);
      return;
    }
    for (const [path, handle] of this._handles) {
      if (isKind(handle, "file")) {
        const { lastModified, size } = await handle.getFile();
        this.index.set(path, new Inode({ mode: 420 | exports_constants.S_IFREG, size, mtimeMs: lastModified }));
        continue;
      }
      if (!isKind(handle, "directory"))
        throw new ErrnoError(Errno.EIO, "Invalid handle", path);
      this.index.set(path, new Inode({ mode: 511 | exports_constants.S_IFDIR, size: 0 }));
    }
  }
  constructor(handle) {
    super(2003133025, "webaccessfs");
    this._handles = new Map;
    this._sync = InMemory.create({ name: "accessfs-cache" });
    this.attributes.set("no_buffer_resize");
    this.attributes.set("setid");
    this._handles.set("/", handle);
  }
  async remove(path) {
    const handle = this.get("directory", dirname(path));
    await handle.removeEntry(basename(path), { recursive: true }).catch((ex) => _throw(convertException(ex, path)));
  }
  removeSync(path) {
    throw exports_log.crit(ErrnoError.With("ENOSYS", path));
  }
  async read(path, buffer, offset, end) {
    if (end <= offset)
      return;
    const handle = this.get("file", path, "write");
    const file2 = await handle.getFile();
    const data = await file2.arrayBuffer();
    if (data.byteLength < end - offset)
      throw ErrnoError.With("ENODATA", path, "read");
    buffer.set(new Uint8Array(data, offset, end - offset));
  }
  async write(path, buffer, offset) {
    if (isResizable(buffer.buffer)) {
      const newBuffer = new Uint8Array(new ArrayBuffer(buffer.byteLength), buffer.byteOffset, buffer.byteLength);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    const inode2 = this.index.get(path);
    if (!inode2)
      throw ErrnoError.With("ENOENT", path, "write");
    const isDir = (inode2.mode & S_IFMT) == S_IFDIR;
    let handle;
    try {
      handle = this.get(isDir ? "directory" : "file", path, "write");
    } catch {
      const parent = this.get("directory", dirname(path), "write");
      handle = await parent[isDir ? "getDirectoryHandle" : "getFileHandle"](basename(path), { create: true }).catch((ex) => _throw(convertException(ex, path)));
      this._handles.set(path, handle);
    }
    if (isDir)
      return;
    if (isKind(handle, "directory")) {
      exports_log.crit(new ErrnoError(Errno.EIO, "Mismatch in entry kind on write", path, "write"));
      return;
    }
    const writable = await handle.createWritable();
    try {
      await writable.seek(offset);
    } catch {
      await writable.write({ type: "seek", position: offset });
    }
    await writable.write(buffer);
    await writable.close();
    const { size, lastModified } = await handle.getFile();
    inode2.update({ size, mtimeMs: lastModified });
    this.index.set(path, inode2);
  }
  async writeFile(path, data) {
    return this.write(path, data, 0);
  }
  async mkdir(path, mode, options) {
    await super.mkdir(path, mode, options);
    const handle = this.get("directory", dirname(path), "mkdir");
    const dir2 = await handle.getDirectoryHandle(basename(path), { create: true }).catch((ex) => _throw(convertException(ex, path)));
    this._handles.set(path, dir2);
  }
  get(kind = null, path, syscall) {
    const handle = this._handles.get(path);
    if (!handle)
      throw ErrnoError.With("ENODATA", path, syscall);
    if (kind && !isKind(handle, kind))
      throw ErrnoError.With(kind == "directory" ? "ENOTDIR" : "EISDIR", path, syscall);
    return handle;
  }
}
// node_modules/@zenfs/dom/dist/IndexedDB.js
function wrap(request2) {
  return new Promise((resolve2, reject) => {
    request2.onsuccess = () => resolve2(request2.result);
    request2.onerror = (e) => {
      e.preventDefault();
      reject(convertException(request2.error));
    };
  });
}

class IndexedDBTransaction extends AsyncTransaction {
  constructor(tx, store2) {
    super(store2);
    this.tx = tx;
    this.store = store2;
    this._idb = tx.objectStore(store2.name);
  }
  async keys() {
    return (await wrap(this._idb.getAllKeys())).filter((k) => typeof k == "string").map((k) => Number(k));
  }
  async get(id) {
    const data = await wrap(this._idb.get(id.toString()));
    if (data)
      this._cached(id, { size: data.byteLength }).add(data, 0);
    return data;
  }
  async set(id, data) {
    this._cached(id, { size: data.byteLength }).add(data, 0);
    await wrap(this._idb.put(data, id.toString()));
  }
  remove(id) {
    this.store.cache.delete(id);
    return wrap(this._idb.delete(id.toString()));
  }
  async commit() {
    const { promise, resolve: resolve2, reject } = Promise.withResolvers();
    this.tx.oncomplete = () => resolve2();
    this.tx.onerror = () => reject(convertException(this.tx.error));
    this.tx.commit();
    return promise;
  }
  async abort() {
    const { promise, resolve: resolve2, reject } = Promise.withResolvers();
    this.tx.onabort = () => resolve2();
    this.tx.onerror = () => reject(convertException(this.tx.error));
    this.tx.abort();
    return promise;
  }
}
async function createDB(name, indexedDB = globalThis.indexedDB) {
  const req = indexedDB.open(name);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (db.objectStoreNames.contains(name)) {
      exports_log.warn("Found unexpected object store: " + name);
      db.deleteObjectStore(name);
    }
    db.createObjectStore(name);
  };
  return await wrap(req);
}

class IndexedDBStore {
  constructor(db) {
    this.db = db;
    this.cache = new Map;
  }
  sync() {
    return Promise.resolve();
  }
  get name() {
    return this.db.name;
  }
  transaction() {
    const tx = this.db.transaction(this.name, "readwrite");
    return new IndexedDBTransaction(tx, this);
  }
}
var _IndexedDB = {
  name: "IndexedDB",
  options: {
    storeName: { type: "string", required: false },
    idbFactory: { type: "object", required: false }
  },
  async isAvailable(idbFactory = globalThis.indexedDB) {
    try {
      if (!(idbFactory instanceof IDBFactory)) {
        return false;
      }
      const req = idbFactory.open("__zenfs_test");
      await wrap(req);
      return true;
    } catch {
      return false;
    } finally {
      idbFactory.deleteDatabase("__zenfs_test");
    }
  },
  async create(options) {
    const db = await createDB(options.storeName || "zenfs", options.idbFactory);
    const store2 = new IndexedDBStore(db);
    const fs3 = new StoreFS(store2);
    if (options?.disableAsyncCache) {
      exports_log.notice("Async preloading disabled for IndexedDB");
      return fs3;
    }
    const tx = store2.transaction();
    for (const id of await tx.keys()) {
      await tx.get(id);
    }
    return fs3;
  }
};
var IndexedDB = _IndexedDB;
// node_modules/@zenfs/dom/dist/xml.js
function get_stats(node) {
  const stats2 = {};
  for (const key of _inode_fields) {
    const value = node.getAttribute(key);
    if (value !== null && value !== undefined)
      stats2[key] = parseInt(value, 16);
  }
  return new Stats(stats2);
}
function set_stats(node, stats2) {
  for (const key of Object.keys(stats2)) {
    if (!(key in _inode_fields) || stats2[key] === undefined)
      continue;
    node.setAttribute(key, stats2[key].toString(16));
  }
}
function get_paths(node, contents = false) {
  let paths;
  try {
    const raw = contents ? node.textContent : node.getAttribute("paths");
    paths = JSON.parse(raw || "[]");
  } catch {
    paths = [];
  }
  return paths;
}

class XMLFS extends Sync(FileSystem) {
  constructor(root = new DOMParser().parseFromString("<fs></fs>", "application/xml").documentElement) {
    super(544763244, "xmltmpfs");
    this.root = root;
    this.attributes.set("setid");
    try {
      this.mkdirSync("/", 511, { uid: 0, gid: 0 });
    } catch (e) {
      const error2 = e;
      if (error2.code != "EEXIST")
        throw error2;
    }
  }
  renameSync(oldPath, newPath) {
    const node = this.get("rename", oldPath);
    this.remove("rename", node, oldPath);
    this.add("rename", node, newPath);
  }
  statSync(path) {
    return get_stats(this.get("stat", path));
  }
  openFileSync(path, flag) {
    const node = this.get("openFile", path);
    return new LazyFile(this, path, flag, get_stats(node));
  }
  createFileSync(path, flag, mode, { uid, gid }) {
    const parent = this.statSync(dirname(path));
    const stats2 = new Stats({
      mode: mode | exports_constants.S_IFREG,
      uid: parent.mode & exports_constants.S_ISUID ? parent.uid : uid,
      gid: parent.mode & exports_constants.S_ISGID ? parent.gid : gid
    });
    this.create("createFile", path, stats2);
    return new LazyFile(this, path, flag, stats2);
  }
  unlinkSync(path) {
    const node = this.get("unlink", path);
    if (get_stats(node).isDirectory())
      throw ErrnoError.With("EISDIR", path, "unlink");
    this.remove("unlink", node, path);
  }
  rmdirSync(path) {
    const node = this.get("rmdir", path);
    if (node.textContent?.length)
      throw ErrnoError.With("ENOTEMPTY", path, "rmdir");
    if (!get_stats(node).isDirectory())
      throw ErrnoError.With("ENOTDIR", path, "rmdir");
    this.remove("rmdir", node, path);
  }
  mkdirSync(path, mode, { uid, gid }) {
    const parent = this.statSync(dirname(path));
    const node = this.create("mkdir", path, {
      mode: mode | exports_constants.S_IFDIR,
      uid: parent.mode & exports_constants.S_ISUID ? parent.uid : uid,
      gid: parent.mode & exports_constants.S_ISGID ? parent.gid : gid
    });
    node.textContent = "[]";
  }
  readdirSync(path) {
    const node = this.get("readdir", path);
    if (!get_stats(node).isDirectory())
      throw ErrnoError.With("ENOTDIR", path, "rmdir");
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      throw new ErrnoError(Errno.EIO, "Invalid directory listing: " + e, path, "readdir");
    }
  }
  linkSync(target, link3) {
    const node = this.get("link", target);
    this.add("link", node, link3);
  }
  syncSync(path, data, stats2 = {}) {
    const node = this.get("sync", path);
    if (data)
      node.textContent = decodeRaw(data);
    set_stats(node, stats2);
  }
  readSync(path, buffer, offset, end) {
    const node = this.get("read", path);
    const raw = encodeRaw(node.textContent.slice(offset, end));
    buffer.set(raw);
  }
  writeSync(path, buffer, offset) {
    const node = this.get("write", path);
    const data = decodeRaw(buffer);
    const after = node.textContent.slice(offset + data.length);
    node.textContent = node.textContent.slice(0, offset) + data + after;
  }
  toString() {
    return new XMLSerializer().serializeToString(this.root);
  }
  get(syscall, path) {
    const nodes = this.root.children;
    if (!nodes)
      throw ErrnoError.With("EIO", path, syscall);
    for (let i = 0;i < nodes.length; i++) {
      if (get_paths(nodes[i]).includes(path))
        return nodes[i];
    }
    throw ErrnoError.With("ENOENT", path, syscall);
  }
  create(syscall, path, stats2) {
    if (this.existsSync(path))
      throw ErrnoError.With("EEXIST", path, syscall);
    const node = document.createElement("file");
    this.add(syscall, node, path);
    set_stats(node, new Stats({
      ...stats2,
      uid: stats2.mode
    }));
    this.root.append(node);
    return node;
  }
  add(syscall, node, path, contents = false) {
    const paths = get_paths(node, contents);
    paths.push(path);
    if (contents) {
      node.textContent = JSON.stringify(paths);
      return;
    }
    node.setAttribute("paths", JSON.stringify(paths));
    node.setAttribute("nlink", paths.length.toString(16));
    if (path != "/") {
      const parent = this.get(syscall, dirname(path));
      this.add(syscall, parent, basename(path), true);
    }
  }
  remove(syscall, node, path, contents = false) {
    const paths = get_paths(node, contents);
    const i = paths.indexOf(path);
    if (i == -1)
      return;
    paths.splice(i, 1);
    if (contents) {
      node.textContent = JSON.stringify(paths);
      return;
    }
    if (!paths.length) {
      node.remove();
    } else {
      node.setAttribute("paths", JSON.stringify(paths));
      node.setAttribute("nlink", paths.length.toString(16));
    }
    if (path != "/") {
      const parent = this.get(syscall, dirname(path));
      this.remove(syscall, parent, basename(path), true);
    }
  }
}
// src/fs.ts
async function createFS() {
  await configure2({
    mounts: {
      "/": { backend: IndexedDB, storeName: "sda1" }
    },
    addDevices: true
  });
  window.fs = exports_vfs;
  if (!exports_vfs.existsSync("/usr")) {
    await generateFS();
  }
  return exports_vfs;
}
async function generateFS() {
  async function generateDir(path, dir2) {
    for (const [name, entry] of dir2) {
      if (typeof entry == "string") {
        console.log("file", path + name);
        await exports_vfs.promises.writeFile(path + name, entry, "utf-8");
      } else {
        console.log("dir", path);
        await exports_vfs.promises.mkdir(path + name + "/");
        generateDir(path + name + "/", entry);
      }
    }
  }
  await generateDir("/", DefaultFS);
}
window.regenerateFS = async () => {
  await exports_vfs.promises.rm("/usr", { recursive: true });
  await generateFS();
};

// src/index.ts
var screen = document.getElementById("output");
createFS().then((fs3) => {
  let bash = new Bash(fs3);
  bash.env.PATH = "/usr/bin";
  bash.print = (data) => {
    screen.append(data);
  };
  document.body.onkeydown = (e) => {
    let char = e.key;
    if (char == "Enter")
      char = `
`;
    else if (char == "Backspace")
      char = "\b";
    bash.handleInput(char);
  };
  document.body.focus();
  bash.main().then(() => screen.innerText = `
[process exited with code 127 (0x0000007f)]`);
});
