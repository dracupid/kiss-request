kiss-request
======
A simple and stupid node request wrapper. KISS == Keep it simple and stupid.

Inspired by [nokit.request](https://github.com/ysmood/nokit#requestopts) and [got](https://github.com/sindresorhus/got)

[![NPM version](https://badge.fury.io/js/kiss-request.svg)](https://www.npmjs.com/package/kiss-request)
[![Build Status](https://travis-ci.org/dracupid/kiss-request.svg)](https://travis-ci.org/dracupid/kiss-request)
[![Build status](https://ci.appveyor.com/api/projects/status/github/dracupid/kiss-request?svg=true)](https://ci.appveyor.com/project/dracupid/kiss-request)

## Features
- Simple, very simple.
- Stupid, very stupid.
- Small, very small.
- Following redirections(3XX), but without a limitation.
- Handling gzip & deflate
- Timeout

## Warning
- Use **GET** only.
- There are many better and more powerful choices, such as [got](https://github.com/sindresorhus/got) and [request](https://github.com/mikeal/request).

## Usage
```coffee
request = require 'kiss-request'

# String url & Callback API
request 'www.npmjs.com', (err, data) ->
    console.log data

# Object url(same as http.request) & Promise API
request.Promise = require 'bluebird' # If a native Promise is available, you don't need to do this.
request {host: 'www.npmjs.com', port: 80}
.then (data) ->
    console.log data

# The second way to use Promise API
request 'http://www.npmjs.com', require 'bluebird'
.then () ->

# Set timeout (default 10000 ms)
request {url: 'www.npmjs.com', timeout: 1000}, () ->
```

## Notice
- If you want to decode non-utf8 text, please install `iconv-lite` manually.
- 4XX and 5XX are regarded as errors.

## License
MIT@Jingchen Zhao
