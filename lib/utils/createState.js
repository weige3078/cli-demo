const path = require('path')
const fs = require('fs-extra')

const STATE_FILE = '.mvc-state.json'

function getStatePath(targetDir) {
    return path.join(targetDir, STATE_FILE)
}

async function loadState(targetDir) {
    const p = getStatePath(targetDir)
    if (!(await fs.pathExists(p))) return null
    try {
        return await fs.readJson(p)
    } catch {
        return null
    }
}

async function saveState(targetDir, state) {
    const p = getStatePath(targetDir)
    await fs.ensureDir(path.dirname(p))
    await fs.writeJson(p, state, { spaces: 2 })
}

async function clearState(targetDir) {
    const p = getStatePath(targetDir)
    await fs.remove(p)
}

module.exports = {
    getStatePath,
    loadState,
    saveState,
    clearState,
}

