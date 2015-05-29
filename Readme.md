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
- Following redirects, but without limitation.
- Handling gzip&deflate
- Timeout

## Warning
- Use **GET** only.
- **DO NOT** use this in a production environment. There are many better and more powerful choices, such as [got](https://github.com/sindresorhus/got), [request](https://github.com/mikeal/request).

## Usage
```coffee
request = require 'kiss-request'

# String url & Callback API
request 'www.npmjs.com', (err, data) ->
    console.log data

# Object url(same as http.request) & Promise API
# Use your own Promise, I won't introduce any new Promise lib.
request {host: 'www.npmjs.com', port: 80}, Promise
.then (data) ->
    console.log data

# Set timeout (default 10000 ms)
request {url: 'www.npmjs.com', timeout: 1000}, () ->
```

## TODO
- Add test

## License
MIT@Jingchen Zhao
