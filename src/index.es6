import url from 'url'
import {isConstructor as isPromise} from 'ispromise'

let _cache = {}
let _require = name => _cache[name] != null ? _cache[name] : (_cache[name] = require(name))

let assign = function (src, dest) {
  for (let k in dest) {
    let v = dest[k]
    src[k] = v
  }
  return src
}

let once = function (fun) {
  let val
  return function () {
    if (!val) val = fun.apply(this, arguments)
    return val
  }
}

let decodeAll = function (data, encoding) {
  let decoder
  try {
    decoder = _require('iconv-lite')
  } catch (error) {
    return data
  }

  return decoder.decode(data, encoding)
}

let kissRequest = function (opts, cb) {
  let err, urlObj
  let urlStr = ''
  cb = once(cb)

  if (typeof opts === 'string') urlStr = opts
  else if ((typeof opts === 'object') && opts.url) urlStr = opts.url

  if (urlStr) {
    if (urlStr.indexOf('.') < 0) {
      err = new TypeError(`Unvalid url ${opts}.`)
      err.code = 'UNVALID URL'
      return cb(err)
    }
    if (urlStr.indexOf('http') < 0) urlStr = `http://${urlStr}`

    urlObj = url.parse(urlStr)
  }

  opts = typeof opts === 'object' ? assign(opts, urlObj) : urlObj

  if (opts.protocol == null) opts.protocol = 'http:'
  if (opts.method == null) opts.method = 'GET'
  if (opts.headers == null) opts.headers = {}
  if (opts.headers['accept-encoding'] == null) opts.headers['accept-encoding'] = 'gzip,deflate'
  let timeout = opts.timeout || 10000 // 10s
  delete opts.timeout

  // fix protocol
  if (opts.protocol[opts.protocol.length - 1] !== ':') opts.protocol += ':'

  let request =
    (() => {
      switch (opts.protocol) {
        case 'http:':
          return _require('http').request
        case 'https:':
          return _require('https').request
      }
    })()

  if (!request) {
    err = new TypeError(`Protocol ${opts.protocol} is not supported.`)
    err.code = 'UNVALID PROTOCOL'
    cb(err)
  }

  let req = request(opts, function (res) {
    let {statusCode} = res

    if ((statusCode >= 300 && statusCode < 400) && res.headers.location && (opts.method === 'GET')) {
      delete opts.host
      delete opts.hostname
      delete opts.port
      delete opts.path

      opts.url = res.headers.location
      return module.exports(opts, cb)
    }

    if (statusCode >= 400) {
      err = new Error('UNWANTED_STATUS_CODE')
      err.code = 'UNWANTED_STATUS_CODE'
      err.statusCode = statusCode
      return cb(err)
    }

    let buf = new Buffer(0)
    return res.on('data', chunk => {
      buf = Buffer.concat([buf, chunk])
      return buf
    })
      .on('end', function () {
        let match
        let contentType = res.headers['content-type']

        let encoding = ''
        if (typeof contentType === 'string') {
          match = contentType.match(/charset=(.+);?/i)
          if (match && match[1]) encoding = match[1].toLowerCase()
          else if (!/^(text)|(application)\//.test(contentType)) encoding = null
        }

        if (encoding === 'utf-8' || encoding === '') { encoding = 'utf8' }

        let decode = function (err, data) {
          if (err) return cb(err)
          else if (!encoding) return cb(null, data)
          else if (encoding !== 'utf8') return cb(null, decodeAll(data, encoding))
          else return cb(null, data.toString())
        }

        if (['gzip', 'deflate'].includes(res.headers['content-encoding'])) return _require('zlib').gunzip(buf, decode)
        else return decode(null, buf)
      }).on('error', cb)
  })

  req.on('error', cb)

  req.setTimeout(timeout, function () {
    err = new Error(`Request ${url.format(opts)} timeout.`)
    err.code = 'TIMEOUT'
    return req.emit('error', err)
  })

  req.end()
  return req
}

let getPromise = function (...maybes) {
  for (let i of maybes) {
    if (isPromise(i)) return i
  }
  return null
}

function request (opts, cb) {
  if (typeof cb === 'function') return kissRequest(opts, cb)
  else {
    let _Promise = getPromise(cb, module.exports.Promise, global.Promise)
    if (_Promise) {
      return new _Promise(function (resolve, reject) {
        return kissRequest(opts, function (err, data) {
          if (err) return reject(err)
          else return resolve(data)
        })
      })
    }
  }
};

let Promise$1 = null
export {Promise$1 as Promise}
export default request

module.exports = request
