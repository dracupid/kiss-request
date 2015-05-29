_cache = {}
_require = (name) ->
    _cache[name] ?= require name

url = require 'url'
assign = (src, dest) ->
    for k, v of dest
        src[k] = v
    src

kissRequest = (opts, cb) ->
    urlStr = ''

    if typeof opts is 'string'
        urlStr = opts
    else if typeof opts is 'object' and opts.url
        urlStr = opts.url

    if urlStr
        if urlStr.indexOf('.') < 0
            return cb new Error "Unvalid url string #{opts}."
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

    request =
        switch opts.protocol
            when 'http:' then _require('http').request
            when 'https:' then _require('https').request

    if not request
        cb new Error "Protocol #{opts.protocol} is not supported."

    req = request opts, (res) ->
        statusCode = res.statusCode

        if (statusCode in [302, 301]) and res.headers.location and (opts.method is 'GET')
            delete opts.host
            delete opts.hostname
            delete opts.port
            delete opts.path

            opts.url = res.headers.location
            return module.exports opts, cb

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
                    cb null, _require('iconv-lite').decode data, encoding
                else
                    cb null, data.toString()

            if res.headers['content-encoding'] in ['gzip', 'deflate']
                _require('zlib').gunzip buf, decode
            else
                decode null, buf
        .on 'error', cb

    req.setTimeout timeout, -> req.emit 'error', new Error 'timeout'
    req.end()
    req

module.exports = (opts, cb) ->
    if cb and  (cb.constructor.name is 'promise') or ((typeof cb.resolve is 'function') and (typeof cb.reject is 'function'))
        new cb (resolve, reject) ->
            kissRequest opts, (err, data) ->
                if err then reject(err) else resolve(data)
    else kissRequest opts, cb