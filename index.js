'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Promise = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _ispromise = require('ispromise');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _cache = {};
var _require = function _require(name) {
  return _cache[name] != null ? _cache[name] : _cache[name] = require(name);
};

var assign = function assign(src, dest) {
  for (var k in dest) {
    var v = dest[k];
    src[k] = v;
  }
  return src;
};

var once = function once(fun) {
  var val = void 0;
  return function () {
    if (!val) val = fun.apply(this, arguments);
    return val;
  };
};

var decodeAll = function decodeAll(data, encoding) {
  var decoder = void 0;
  try {
    decoder = _require('iconv-lite');
  } catch (error) {
    return data;
  }

  return decoder.decode(data, encoding);
};

var kissRequest = function kissRequest(opts, cb) {
  var err = void 0,
      urlObj = void 0;
  var urlStr = '';
  cb = once(cb);

  if (typeof opts === 'string') urlStr = opts;else if ((typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) === 'object' && opts.url) urlStr = opts.url;

  if (urlStr) {
    if (urlStr.indexOf('.') < 0) {
      err = new TypeError('Unvalid url ' + opts + '.');
      err.code = 'UNVALID URL';
      return cb(err);
    }
    if (urlStr.indexOf('http') < 0) urlStr = 'http://' + urlStr;

    urlObj = _url2.default.parse(urlStr);
  }

  opts = (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) === 'object' ? assign(opts, urlObj) : urlObj;

  if (opts.protocol == null) opts.protocol = 'http:';
  if (opts.method == null) opts.method = 'GET';
  if (opts.headers == null) opts.headers = {};
  if (opts.headers['accept-encoding'] == null) opts.headers['accept-encoding'] = 'gzip,deflate';
  var timeout = opts.timeout || 10000; // 10s
  delete opts.timeout;

  // fix protocol
  if (opts.protocol[opts.protocol.length - 1] !== ':') opts.protocol += ':';

  var request = function () {
    switch (opts.protocol) {
      case 'http:':
        return _require('http').request;
      case 'https:':
        return _require('https').request;
    }
  }();

  if (!request) {
    err = new TypeError('Protocol ' + opts.protocol + ' is not supported.');
    err.code = 'UNVALID PROTOCOL';
    cb(err);
  }

  var req = request(opts, function (res) {
    var statusCode = res.statusCode;


    if (statusCode >= 300 && statusCode < 400 && res.headers.location && opts.method === 'GET') {
      delete opts.host;
      delete opts.hostname;
      delete opts.port;
      delete opts.path;

      opts.url = res.headers.location;
      return module.exports(opts, cb);
    }

    if (statusCode >= 400) {
      err = new Error('UNWANTED_STATUS_CODE');
      err.code = 'UNWANTED_STATUS_CODE';
      err.statusCode = statusCode;
      return cb(err);
    }

    var buf = new Buffer(0);
    return res.on('data', function (chunk) {
      buf = Buffer.concat([buf, chunk]);
      return buf;
    }).on('end', function () {
      var match = void 0;
      var contentType = res.headers['content-type'];

      var encoding = '';
      if (typeof contentType === 'string') {
        match = contentType.match(/charset=(.+);?/i);
        if (match && match[1]) encoding = match[1].toLowerCase();else if (!/^(text)|(application)\//.test(contentType)) encoding = null;
      }

      if (encoding === 'utf-8' || encoding === '') {
        encoding = 'utf8';
      }

      var decode = function decode(err, data) {
        if (err) return cb(err);else if (!encoding) return cb(null, data);else if (encoding !== 'utf8') return cb(null, decodeAll(data, encoding));else return cb(null, data.toString());
      };

      if (['gzip', 'deflate'].includes(res.headers['content-encoding'])) return _require('zlib').gunzip(buf, decode);else return decode(null, buf);
    }).on('error', cb);
  });

  req.on('error', cb);

  req.setTimeout(timeout, function () {
    err = new Error('Request ' + _url2.default.format(opts) + ' timeout.');
    err.code = 'TIMEOUT';
    return req.emit('error', err);
  });

  req.end();
  return req;
};

var getPromise = function getPromise() {
  for (var _len = arguments.length, maybes = Array(_len), _key = 0; _key < _len; _key++) {
    maybes[_key] = arguments[_key];
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = maybes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var i = _step.value;

      if ((0, _ispromise.isConstructor)(i)) return i;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return null;
};

function request(opts, cb) {
  if (typeof cb === 'function') return kissRequest(opts, cb);else {
    var _Promise = getPromise(cb, module.exports.Promise, global.Promise);
    if (_Promise) {
      return new _Promise(function (resolve, reject) {
        return kissRequest(opts, function (err, data) {
          if (err) return reject(err);else return resolve(data);
        });
      });
    }
  }
};

var Promise$1 = null;
exports.Promise = Promise$1;
exports.default = request;


module.exports = request;
