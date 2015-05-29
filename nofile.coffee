kit = require 'nokit'
$ = require('dracupid-no')(kit)
module.exports = (task) ->
    task 'default', "Build Project", -> $.coffee()
