#!/usr/bin/env node
const program = require('commander')
const create = require('../lib/create')

program
.version('0.1.0')
.command('create <name>')
.option('--skip-install', 'skip npm install')
.description('create a new project')
.action((name, cmd) => { 
    create(name, { skipInstall: !!cmd.skipInstall })
})

program.parse()