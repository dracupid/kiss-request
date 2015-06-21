kit = require 'nokit'
$ = require('dracupid-no')(kit)
module.exports = (task) ->
    task 'default', "Build Project", -> $.coffee disable: 'missing_fat_arrows'
    task 'test', -> $.mocha "test/index.coffee", ['-t', '10000']
