const fs = require('fs-extra')
const path = require('path')

module.exports = async function writeFileTree(dir, files, options = {}) {
    const { overwrite = true } = options
    Object.keys(files).forEach((name) => {
        const filePath = path.join(dir, name)
        fs.ensureDirSync(path.dirname(filePath))
        if (!overwrite && name !== 'package.json' && fs.existsSync(filePath)) return
        // 同一路径文件的覆盖由 Generator.resolveFiles 阶段合并到 files[name] 决定
        fs.writeFileSync(filePath, files[name])
    })
}
