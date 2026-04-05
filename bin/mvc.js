#!/usr/bin/env node
const path = require('path')
const program = require('commander')
const create = require('../lib/create')
const { version } = require(path.join(__dirname, '../package.json'))

program
.version(version)
.command('create <name>')
.option('--skip-install', 'skip npm install')
.description('create a new project')
.action((name, cmd) => { 
    create(name, { skipInstall: !!cmd.skipInstall })
})

program.parse()