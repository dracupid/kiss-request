request = require '../'
assert = require 'assert'

EQ = assert.strictEqual

buildP = (url, id) ->
    request url
    .then (content) ->
        assert content.indexOf(id) > 0

describe "basic request with Promise", ->
    request.Promise = require 'yaku'

    it "request with http", ->
        buildP 'http://www.baidu.com/', 'bdstatic'

    it "request with https", ->
        buildP 'https://www.baidu.com/', 'baidu'

    it "request without protocol", ->
        buildP 'www.baidu.com/', 'bdstatic'

describe "basic request with callback", ->
    request.Promise = null
    build = (url, id, done) ->
        request url, (err, content) ->
            if err then return done err
            assert content.indexOf(id) > 0
            done()

    it "request with http", (done) ->
        build "http://www.baidu.com/", 'bdstatic', done

    it "request with https", (done) ->
        build "https://www.baidu.com/", 'baidu', done

    it "request without protocol", (done) ->
        build "www.baidu.com", 'bdstatic', done

describe "request options", ->
    request.Promise = require 'yaku'

    it "use object", ->
        request {host: "www.baidu.com", protocol: "http"}
        .then (content) ->
            assert content.indexOf('bdstatic') > 0
    it "use object with url", ->
        request {url: "www.baidu.com"}
        .then (content) ->
            assert content.indexOf('bdstatic') > 0

describe "advanced requests", ->
    request.Promise = require 'yaku'

    it "decode gb2312, handle gzip", ->
        buildP "http://www.qq.com/", '腾讯'

    it "handle redirect", ->
        buildP "www.baidu.cn", '百度'

    buildError = (url, errCode) ->
        request url
        .then () ->
            new Error ""
        .catch (e) ->
            EQ e.code, errCode

    it "handle Error", ->
        buildError "zjcbsddsfj.com", 'ENOTFOUND'

    it "handle HTTP 4XX", ->
        buildError "www.cnbeta.com/213", 'UNWANTED_STATUS_CODE'

    it "handle unvalid url", ->
        buildError "musi/asa", 'UNVALID URL'

    it "handle unvalid protocol", ->
        buildError {host: "music.baidu.com/asa", protocol: "ftp:"}, 'UNVALID PROTOCOL'

    it "handle timeout", ->
        buildError {url: "www.163.com", timeout: 100}, 'TIMEOUT'
