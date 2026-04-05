const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const execa = require('execa')

const PKG = require(path.join(__dirname, '../package.json'))

async function resolveRegistry(cliRegistry) {
    if (cliRegistry) return cliRegistry
    const { registry } = await inquirer.prompt([
        {
            name: 'registry',
            type: 'list',
            message: 'Pick npm registry:',
            choices: [
                { name: '官方源', value: 'https://registry.npmjs.org/' },
                { name: '淘宝源', value: 'https://registry.npmmirror.com' },
            ],
            default: 'https://registry.npmjs.org/',
        },
    ])
    return registry
}

async function update(options = {}) {
    await execa('npm', ['--version'], { stdio: 'ignore' }).catch(() => {
        throw new Error('未检测到 npm，请先安装 Node.js')
    })

    const registry = await resolveRegistry(options.registry)

    console.log(chalk.cyan(`\n正在更新 ${PKG.name}（registry: ${registry}）...\n`))

    // 核心：npm 全局安装当前包名的 @latest，覆盖全局 bin 指向的 mvc，实现脚手架自更新
    await execa(
        'npm',
        ['install', '-g', `${PKG.name}@latest`, '--registry', registry],
        { stdio: 'inherit' },
    )

    console.log(chalk.green(`\n✔ 更新完成，请执行 mvc -V 查看版本\n`))
}

module.exports = update
