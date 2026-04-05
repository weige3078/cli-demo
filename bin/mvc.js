#!/usr/bin/env node
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const create = require('../lib/create')
const update = require('../lib/update')
const { version } = require(path.join(__dirname, '../package.json'))

program
.version(version)
.command('create <name>')
.option('--skip-install', 'skip npm install')
.description('create a new project')
.action((name, cmd) => { 
    create(name, { skipInstall: !!cmd.skipInstall })
})

program
.command('update')
.description('update global mvc CLI')
.option('--registry <url>', 'npm registry url')
.action(async (opts) => {
    try {
        await update(opts)
    } catch (e) {
        console.error(chalk.red(e.message || e))
        process.exit(1)
    }
})

program.parse()