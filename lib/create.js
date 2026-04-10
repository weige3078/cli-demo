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
const runStep = require('./utils/runStep')
const { loadState, saveState, clearState } = require('./utils/createState')

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
    const isValidProjectName = (v) => /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(v || '')
    if (!isValidProjectName(name)) {
        const { fixedName } = await inquirer.prompt([
            {
                name: 'fixedName',
                type: 'input',
                message: 'Project name (letters/numbers/-/_ only):',
                default: name,
                validate: (v) => isValidProjectName(v) || 'invalid project name',
            },
        ])
        name = fixedName
    }

    const targetDir = path.join(process.cwd(), name)
    // 核心：断点续传状态文件，落在目标目录下（.mvc-state.json）
    let state = await loadState(targetDir)
    if (state) {
        const { resume } = await inquirer.prompt([
            {
                name: 'resume',
                type: 'list',
                message: 'Found an unfinished create session, continue?',
                choices: [
                    { name: 'Continue', value: 'continue' },
                    { name: 'Restart', value: 'restart' },
                    { name: 'Cancel', value: 'cancel' },
                ],
                default: 'continue',
            },
        ])
        if (resume === 'cancel') return
        if (resume === 'restart') {
            await clearState(targetDir)
            state = null
        } else if (resume === 'continue') {
            // 核心：断点续传时，允许重新配置 remote git 地址（否则会一直复用旧的 repoUrl）
            if (state.templateSource === 'remote' && state.repoUrl) {
                const { reuseRemote } = await inquirer.prompt([
                    {
                        name: 'reuseRemote',
                        type: 'confirm',
                        message: `Reuse saved remote repo url?\n${state.repoUrl}`,
                        default: true,
                    },
                ])
                if (!reuseRemote) {
                    state.completedSteps = (state.completedSteps || []).filter(s => ![
                        'selectRemoteTemplate',
                        'downloadRemoteTemplate',
                    ].includes(s))
                    delete state.templateKey
                    delete state.repoUrl
                    delete state.repoBranch
                    delete state.cloneTarget
                    await saveState(targetDir, state)
                }
            }
        }
    }

    state = state || {
        name,
        targetDir,
        options,
        completedSteps: [],
    }

    await runStep(state, 'selectPackageManager', async () => {
        state.pm = await selectPackageManager()
    }, { onDone: () => saveState(targetDir, state) })

    await runStep(state, 'selectRegistry', async () => {
        state.registry = await selectRegistry(state.pm)
    }, { onDone: () => saveState(targetDir, state) })

    await runStep(state, 'checkCliVersion', async () => {
        await promptIfCliOutdated(state.registry)
    }, { retry: 1, onDone: () => saveState(targetDir, state) })

    await runStep(state, 'prepareTargetDir', async () => {
        state.writeMode = state.writeMode || 'new'
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
            if (mode === 'cancel') process.exit(0)
            if (mode === 'overwrite') await fs.remove(targetDir)
            state.writeMode = mode
        }
    }, { onDone: () => saveState(targetDir, state) })

    await runStep(state, 'selectTemplateSource', async () => {
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
        state.templateSource = templateSource
    }, { onDone: () => saveState(targetDir, state) })

    await runStep(state, 'promptFeatures', async () => {
        state.answers = state.answers || await promptFeatures()
    }, { onDone: () => saveState(targetDir, state) })

    await runStep(state, 'promptAutoInstall', async () => {
        await promptAutoInstall(state.options, state.pm)
        state.skipInstall = !!state.options.skipInstall
    }, { onDone: () => saveState(targetDir, state) })

    if (state.templateSource === 'remote') {
        await runStep(state, 'selectRemoteTemplate', async () => {
            const { templateKey } = await inquirer.prompt([
                {
                    name: 'templateKey',
                    type: 'list',
                    message: 'Pick a remote template:',
                    choices: REMOTE_TEMPLATES.map(t => ({ name: t.name, value: t.name })),
                    default: REMOTE_TEMPLATES[0].name,
                },
            ])
            state.templateKey = templateKey

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
            state.repoUrl = repoUrl
            state.repoBranch = repoBranch
        }, { onDone: () => saveState(targetDir, state) })

        await runStep(state, 'downloadRemoteTemplate', async () => {
            // 始终 clone 到空临时目录再 copy 到 targetDir，避免断点续传时 targetDir 已存在（含 .mvc-state.json）导致 git clone 报 not empty
            const cloneTarget = await fs.mkdtemp(path.join(os.tmpdir(), 'mvc-template-'))
            const cloneArgs = ['clone', '--depth', '1']
            if (state.repoBranch) cloneArgs.push('-b', state.repoBranch)
            cloneArgs.push(state.repoUrl, cloneTarget)

            logStep(1, 3, 'Downloading remote template')
            await execa('git', cloneArgs, { stdio: 'inherit' })
            await fs.remove(path.join(cloneTarget, '.git'))
            const copyFilter = (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`)
            await fs.copy(cloneTarget, targetDir, {
                overwrite: state.writeMode !== 'merge',
                errorOnExist: state.writeMode === 'merge' ? false : undefined,
                filter: copyFilter,
            })
            await fs.remove(cloneTarget)
            delete state.cloneTarget
            logSuccess('Template downloaded')

            // 核心：写入模板来源信息，供旧项目执行 mvc upgrade 时拉取并合入更新
            await fs.writeJson(path.join(targetDir, '.mvc-template.json'), {
                source: 'remote',
                templateKey: state.templateKey,
                repoUrl: state.repoUrl,
                repoBranch: state.repoBranch || 'master',
            }, { spaces: 2 })
        }, { retry: 2, onDone: () => saveState(targetDir, state) })

        await runStep(state, 'applyPlugins', async () => {
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
            state.answers.features.forEach(feature => {
                require(`./generator/${feature}`)(generator, state.answers)
            })
            await generator.generate({ overwrite: state.writeMode !== 'merge' })
            logSuccess('Plugins applied')
        }, { onDone: () => saveState(targetDir, state) })
    } else {
        await runStep(state, 'generateLocalTemplate', async () => {
            const pkg = {
                name,
                version: '0.1.0',
                dependencies: {},
                devDependencies: {},
            }
            const generator = new Generator(pkg, targetDir)

            if (state.answers.features.includes('vite') || state.answers.features.includes('pinia') || state.answers.features.includes('ts')) {
                state.answers.features.unshift('vue3', 'vite')
            } else {
                state.answers.features.unshift('vue', 'webpack')
            }

            if (state.answers.features.includes('ts')) {
                state.answers.features = state.answers.features.filter(f => f !== 'ts').concat('ts')
            }

            state.answers.features.forEach(feature => {
                require(`./generator/${feature}`)(generator, state.answers)
            })

            await generator.generate({ overwrite: state.writeMode !== 'merge' })
            logSuccess('Local template generated')
        }, { onDone: () => saveState(targetDir, state) })
    }

    await runStep(state, 'installDependencies', async () => {
        if (state.skipInstall) {
            logStep(2, 3, 'Skipped dependency install')
            logSuccess('Dependencies skipped')
            return
        }
        logStep(2, 3, 'Installing dependencies')
        await executeCommand(`${state.pm} install --registry=${state.registry}`, targetDir)
        logSuccess('Dependencies installed')
    }, { retry: 1, onDone: () => saveState(targetDir, state) })

    await runStep(state, 'finalize', async () => {
        logStep(3, 3, 'Project ready')
        printNextSteps(name, state.skipInstall, state.pm, state.registry)
    }, { onDone: () => saveState(targetDir, state) })

    // 核心：全部完成后清理断点状态文件
    await clearState(targetDir)
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