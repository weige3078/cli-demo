const path = require('path')
const fs = require('fs-extra')
const execa = require('execa')
const chalk = require('chalk')

module.exports = async function upgrade(dir = process.cwd()) {
    const targetDir = path.resolve(dir)
    const metaPath = path.join(targetDir, '.mvc-template.json')
    if (!(await fs.pathExists(metaPath))) {
        console.error(chalk.red('missing .mvc-template.json'))
        process.exit(1)
    }
    const meta = await fs.readJson(metaPath)
    if (!meta || meta.source !== 'remote' || !meta.repoUrl) {
        console.error(chalk.red('unsupported template source'))
        process.exit(1)
    }
    if (!(await fs.pathExists(path.join(targetDir, '.git')))) {
        console.error(chalk.red('not a git repo'))
        process.exit(1)
    }

    const remoteName = 'mvc-template'
    const branch = meta.repoBranch || 'master'

    const remotes = await execa('git', ['remote'], { cwd: targetDir }).then(r => r.stdout.trim().split('\n').filter(Boolean))
    if (!remotes.includes(remoteName)) {
        await execa('git', ['remote', 'add', remoteName, meta.repoUrl], { cwd: targetDir, stdio: 'inherit' })
    } else {
        await execa('git', ['remote', 'set-url', remoteName, meta.repoUrl], { cwd: targetDir, stdio: 'inherit' })
    }

    await execa('git', ['fetch', remoteName, branch], { cwd: targetDir, stdio: 'inherit' })
    await execa('git', ['merge', '--no-edit', `${remoteName}/${branch}`], { cwd: targetDir, stdio: 'inherit' })
}

