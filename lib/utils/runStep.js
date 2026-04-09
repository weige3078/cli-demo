const chalk = require('chalk')

function isNetworkError(e) {
    const s = String((e && (e.stderr || e.shortMessage || e.message)) || '')
    return (
        s.includes('ETIMEDOUT')
        || s.includes('ECONNRESET')
        || s.includes('ENOTFOUND')
        || s.includes('EAI_AGAIN')
        || s.includes('network')
        || s.includes('Network')
        || s.includes('RPC failed')
        || s.includes('Failed to connect')
        || s.includes('Connection timed out')
    )
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

async function runStep(state, stepName, fn, opts = {}) {
    // 核心：每一步成功后记录 completedSteps；重启时可跳过已完成步骤
    state.completedSteps = state.completedSteps || []
    if (state.completedSteps.includes(stepName)) return

    const retry = Number.isFinite(opts.retry) ? opts.retry : 0
    let attempt = 0
    // 核心：每一步都包一层 try/catch，并对可重试步骤做有限次数自动重试
    while (true) {
        attempt += 1
        try {
            await fn()
            state.completedSteps.push(stepName)
            if (opts.onDone) await opts.onDone()
            return
        } catch (e) {
            const canRetry = attempt <= (retry + 1)
            if (isNetworkError(e)) {
                console.error(chalk.red(`\n网络异常：${stepName}${canRetry ? `，重试中(${attempt}/${retry + 1})...` : ''}\n`))
            } else {
                console.error(chalk.red(`\n步骤失败：${stepName}\n`))
            }
            if (!canRetry) throw e
            await sleep(500 * attempt)
        }
    }
}

module.exports = runStep

