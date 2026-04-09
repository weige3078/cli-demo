const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const inquirer = require('inquirer')
const execa = require('execa')
const chalk = require('chalk')
const semver = require('semver')
const PromptModuleAPI = require('./PromptModuleAPI')
const Creator = require('./Creator')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const executeCommand = require('./utils/executeCommand')

// 当前 CLI 安装目录下的 package.json，用于与 registry 上的最新版本比对
const PKG = require(path.join(__dirname, '../package.json'))

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.mvc-default.json')

const REMOTE_TEMPLATES = [
    {
        name: 'vite-full (gitee)',
        repoUrl: 'https://gitee.com/sohucw/vite-full.git',
        repoBranch: 'master',
    },
    {
        name: 'custom',
        repoUrl: '',
        repoBranch: '',
    },
]

function logStep(current, total, message) {
    console.log(chalk.cyan(`\n[${current}/${total}] ${message}`))
}

function logSuccess(message) {
    console.log(chalk.green(`✔ ${message}`))
}

// 用 npm 查询远端 latest 版本号（与 CLI 实际拉包逻辑一致，兼容镜像与重定向；raw https 拉 JSON 易 3xx/非 200 被静默吞掉）
async function fetchLatestVersionFromRegistry(registry, packageName) {
    const { stdout } = await execa('npm', ['view', packageName, 'version', '--registry', registry], {
        timeout: 15000,
    })
    return stdout.trim()
}

// 创建前检查：本地 CLI 版本是否低于 registry 最新；低则提示升级并可选择中止
async function promptIfCliOutdated(registry) {
    try {
        const latest = await fetchLatestVersionFromRegistry(registry, PKG.name)
        if (!latest || !semver.valid(latest) || !semver.valid(PKG.version)) return
        if (!semver.gt(latest, PKG.version)) return
        console.log(chalk.yellow(`\n当前 mvc (${PKG.version}) 低于 registry 最新 (${latest})，建议: npm i -g ${PKG.name}@${latest}\n`))
        const { cont } = await inquirer.prompt([
            {
                name: 'cont',
                type: 'confirm',
                message: '仍要继续创建项目?',
                default: true,
            },
        ])
        if (!cont) process.exit(0)
    } catch {
        // 网络/404/解析失败时不阻断创建
    }
}

function printNextSteps(name, skipInstall, pm = 'npm', registry) {
    console.log(chalk.cyan('\nNext steps:'))
    console.log(chalk.white(`  cd ${name}`))
    if (skipInstall) console.log(chalk.green(`  ${pm} install${registry ? ` --registry=${registry}` : ''}`))
    console.log(chalk.green(`  ${pm} run dev\n`))
}

async function promptFeatures() {
    const { featureMode } = await inquirer.prompt([
        {
            name: 'featureMode',
            type: 'list',
            message: 'Pick feature mode:',
            choices: [
                { name: 'Default config', value: 'default' },
                { name: 'Manual select', value: 'manual' },
            ],
            default: 'default',
        },
    ])

    if (featureMode === 'default') {
        if (await fs.pathExists(DEFAULT_CONFIG_PATH)) {
            return await fs.readJson(DEFAULT_CONFIG_PATH)
        }
        return {
            features: ['babel', 'router', 'vuex', 'linter', 'quality'],
            historyMode: false,
            eslintConfig: 'airbnb',
            lintOn: ['save'],
        }
    }

    const creator = new Creator()
    const promptModules = getPromptModules()
    const promptAPI = new PromptModuleAPI(creator)
    promptModules.forEach(m => m(promptAPI))
    clearConsole()

    const prompts = creator.getFinalPrompts()
    prompts[0].choices = prompts[0].choices.map(choice => ({
        ...choice,
        checked: false,
    }))

    const answers = await inquirer.prompt(prompts)
    const { saveAsDefault } = await inquirer.prompt([
        {
            name: 'saveAsDefault',
            type: 'confirm',
            message: 'Save this selection as default config?',
            default: false,
        },
    ])
    if (saveAsDefault) {
        await fs.writeJson(DEFAULT_CONFIG_PATH, answers, { spaces: 2 })
    }
    return answers
}

async function detectPackageManagers() {
    const hasNpm = await execa('npm', ['--version']).then(() => true).catch(() => false)
    const hasYarn = await execa('yarn', ['--version']).then(() => true).catch(() => false)
    return { npm: hasNpm, yarn: hasYarn }
}

async function selectPackageManager() {
    const { npm, yarn } = await detectPackageManagers()

    if (npm && yarn) {
        const { pm } = await inquirer.prompt([
            {
                name: 'pm',
                type: 'list',
                message: 'Pick a package manager:',
                choices: [
                    { name: 'npm', value: 'npm' },
                    { name: 'yarn', value: 'yarn' },
                ],
                default: 'npm',
            },
        ])
        return pm
    }

    if (yarn) return 'yarn'
    if (npm) return 'npm'

    throw new Error('No package manager found (npm or yarn)')
}

async function selectRegistry(pm) {
    const { registry } = await inquirer.prompt([
        {
            name: 'registry',
            type: 'list',
            message: `Pick ${pm} registry:`,
            choices: [
                { name: '官方源', value: 'https://registry.npmjs.org/' },
                { name: '淘宝源', value: 'https://registry.npmmirror.com' },
            ],
            default: 'https://registry.npmjs.org/',
        },
    ])
    return registry
}

async function promptAutoInstall(options, pm) {
    if (options.skipInstall === true) return
    const { autoInstall } = await inquirer.prompt([
        {
            name: 'autoInstall',
            type: 'confirm',
            message: `Auto install dependencies with ${pm} install?`,
            default: true,
        },
    ])
    options.skipInstall = !autoInstall
}

async function create(name, options = {}) {
    const targetDir = path.join(process.cwd(), name)
    const pm = await selectPackageManager()
    const registry = await selectRegistry(pm)
    // 与所选 registry 上的包版本比对，避免用过旧的全局 mvc
    await promptIfCliOutdated(registry)
    let writeMode = 'new'
    if (await fs.pathExists(targetDir)) {
        const { mode } = await inquirer.prompt([
            {
                name: 'mode',
                type: 'list',
                message: `${name} already exists, what to do?`,
                choices: [
                    { name: 'Cancel', value: 'cancel' },
                    { name: 'Overwrite', value: 'overwrite' },
                    { name: 'Merge', value: 'merge' },
                ],
                default: 'cancel',
            },
        ])
        if (mode === 'cancel') return
        if (mode === 'overwrite') await fs.remove(targetDir)
        writeMode = mode
    }

    const { templateSource } = await inquirer.prompt([
        {
            name: 'templateSource',
            type: 'list',
            message: 'Pick a template source:',
            choices: [
                { name: 'Local templates', value: 'local' },
                { name: 'Remote git repo', value: 'remote' },
            ],
            default: 'local',
        },
    ])

    if (templateSource === 'remote') {
        const { templateKey } = await inquirer.prompt([
            {
                name: 'templateKey',
                type: 'list',
                message: 'Pick a remote template:',
                choices: REMOTE_TEMPLATES.map(t => ({ name: t.name, value: t.name })),
                default: REMOTE_TEMPLATES[0].name,
            },
        ])

        let { repoUrl, repoBranch } = REMOTE_TEMPLATES.find(t => t.name === templateKey) || REMOTE_TEMPLATES[0]

        if (templateKey === 'custom') {
            const input = await inquirer.prompt([
                {
                    name: 'repoUrl',
                    type: 'input',
                    message: 'Git repo url:',
                    validate: (v) => !!v || 'repo url is required',
                },
                {
                    name: 'repoBranch',
                    type: 'input',
                    message: 'Branch/tag (optional):',
                },
            ])
            repoUrl = input.repoUrl
            repoBranch = input.repoBranch
        }

        const answers = await promptFeatures()

        const cloneArgs = ['clone', '--depth', '1']
        if (repoBranch) cloneArgs.push('-b', repoBranch)
        let cloneTarget = targetDir
        if (writeMode === 'merge') {
            cloneTarget = await fs.mkdtemp(path.join(os.tmpdir(), 'mvc-template-'))
        }
        cloneArgs.push(repoUrl, cloneTarget)

        logStep(1, 3, 'Downloading remote template')
        await execa('git', cloneArgs, { stdio: 'inherit' })
        await fs.remove(path.join(cloneTarget, '.git'))
        if (writeMode === 'merge') {
            await fs.copy(cloneTarget, targetDir, {
                overwrite: false,
                errorOnExist: false,
                filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
            })
            await fs.remove(cloneTarget)
        }
        logSuccess('Template downloaded')

        let pkg = {
            name,
            version: '0.1.0',
            dependencies: {},
            devDependencies: {},
        }
        const pkgPath = path.join(targetDir, 'package.json')
        if (await fs.pathExists(pkgPath)) {
            pkg = await fs.readJson(pkgPath)
        }
        pkg.name = name

        const generator = new Generator(pkg, targetDir)
        answers.features.forEach(feature => {
            require(`./generator/${feature}`)(generator, answers)
        })
        await generator.generate({ overwrite: writeMode !== 'merge' })
        logSuccess('Plugins applied')

        await promptAutoInstall(options, pm)

        if (!options.skipInstall) {
            logStep(2, 3, 'Installing dependencies')
            await executeCommand(`${pm} install --registry=${registry}`, targetDir)
            logSuccess('Dependencies installed')
        } else {
            logStep(2, 3, 'Skipped dependency install')
            logSuccess('Dependencies skipped')
        }
        logStep(3, 3, 'Project ready')
        printNextSteps(name, options.skipInstall, pm, registry)
        return
    }

    const answers = await promptFeatures()
    await promptAutoInstall(options, pm)



    // package.json 文件内容
    const pkg = {
        name,
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
    }
    
    const generator = new Generator(pkg, targetDir)
    if (answers.features.includes('vite') || answers.features.includes('pinia') || answers.features.includes('ts')) {
        answers.features.unshift('vue3', 'vite')
    } else {
        // 填入 vue webpack 必选项，无需用户选择
        answers.features.unshift('vue', 'webpack')
    }

    if (answers.features.includes('ts')) {
        // 让 ts 插件最后执行：后执行的 render 会覆盖同路径文件（如 index.html / src/main.ts）
        answers.features = answers.features.filter(f => f !== 'ts').concat('ts')
    }

    // 根据用户选择的选项加载相应的模块，在 package.json 写入对应的依赖项
    // 并且将对应的 template 模块渲染
    answers.features.forEach(feature => {
        require(`./generator/${feature}`)(generator, answers)
    })

    await generator.generate({ overwrite: writeMode !== 'merge' })
    logSuccess('Local template generated')

    if (!options.skipInstall) {
        logStep(2, 3, 'Installing dependencies')
        await executeCommand(`${pm} install --registry=${registry}`, targetDir)
        logSuccess('Dependencies installed')
    } else {
        logStep(2, 3, 'Skipped dependency install')
        logSuccess('Dependencies skipped')
    }
    logStep(3, 3, 'Project ready')
    printNextSteps(name, options.skipInstall, pm, registry)
}

function getPromptModules() {
    return [
        'vite',
        'ts',
        'babel',
        'router',
        'vuex',
        'linter',
        'pinia',
        'quality',
    ].map(file => require(`./promptModules/${file}`))
}

module.exports = create