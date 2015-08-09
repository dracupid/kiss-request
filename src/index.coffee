url = require 'url'

_cache = {}
_require = (name) ->
    _cache[name] ?= require name

assign = (src, dest) ->
    for k, v of dest
        src[k] = v
    src

{isConstructor: isPromise} = require 'ispromise'

once = (fun) ->
    val = undefined
    ->
        if val then return val
        else
            val = fun.apply @, arguments

decodeAll = (data, encoding) ->
    try
        decoder = _require 'iconv-lite'
    catch
        return data

    decoder.decode data, encoding

kissRequest = (opts, cb) ->
    urlStr = ''
    cb = once cb

    if typeof opts is 'string'
        urlStr = opts
    else if typeof opts is 'object' and opts.url
        urlStr = opts.url

    if urlStr
        if urlStr.indexOf('.') < 0
            err = new TypeError "Unvalid url #{opts}."
            err.code = 'UNVALID URL'
            return cb err
        if urlStr.indexOf('http') < 0
            urlStr = 'http://' + urlStr

        urlObj = url.parse urlStr

    opts =
        if typeof opts is 'object'
            assign opts, urlObj
        else
            urlObj

    opts.protocol ?= 'http:'
    opts.method ?= 'GET'
    opts.headers ?= {}
    opts.headers['accept-encoding'] ?= 'gzip,deflate'
    timeout = opts.timeout or 10000 # 10s
    delete opts.timeout

    # fix protocol
    if opts.protocol[opts.protocol.length - 1] isnt ':' then opts.protocol += ':'

    request =
        switch opts.protocol
            when 'http:' then _require('http').request
            when 'https:' then _require('https').request

    if not request
        err = new TypeError "Protocol #{opts.protocol} is not supported."
        err.code = 'UNVALID PROTOCOL'
        cb err

    req = request opts, (res) ->
        statusCode = res.statusCode

        if (300 <= statusCode < 400) and res.headers.location and (opts.method is 'GET')
            delete opts.host
            delete opts.hostname
            delete opts.port
            delete opts.path

            opts.url = res.headers.location
            return module.exports opts, cb

        if statusCode >= 400
            err = new Error 'UNWANTED_STATUS_CODE'
            err.code = 'UNWANTED_STATUS_CODE'
            err.statusCode = statusCode
            return cb err

        buf = new Buffer 0
        res.on 'data', (chunk) ->
            buf = Buffer.concat [buf, chunk]
        .on 'end', ->
            contentType = res.headers['content-type']

            encoding =
                if typeof contentType is 'string'
                    match = contentType.match /charset=(.+);?/i
                    if match and match[1] then match[1].toLowerCase()
                    else if !/^(text)|(application)\//.test(contentType)
                        null
                    else
                        'utf8'
                else
                    'utf8'
            encoding = 'utf8' if encoding is 'utf-8'

            decode = (err, data) ->
                if err then cb err
                else if not encoding
                    cb null, data
                else if encoding isnt 'utf8'
                    cb null, decodeAll data, encoding
                else
                    cb null, data.toString()

            if res.headers['content-encoding'] in ['gzip', 'deflate']
                _require('zlib').gunzip buf, decode
            else
                decode null, buf
        .on 'error', cb

    req.on 'error', cb

    req.setTimeout timeout, ->
        err = new Error "Request #{url.format opts} timeout."
        err.code = "TIMEOUT"
        req.emit 'error', err

    req.end()
    req


getPromise = (maybes...) ->
    for i in maybes
        if isPromise i then return i

    return null

module.exports = (opts, cb) ->
    if typeof cb is 'function'
        kissRequest opts, cb
    else if _Promise = getPromise cb, module.exports.Promise, global.Promise
        new _Promise (resolve, reject) ->
            kissRequest opts, (err, data) ->
                if err then reject(err) else resolve(data)

module.exports.Promise = null
