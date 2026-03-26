const fs = require('fs-extra')
const path = require('path')

module.exports = async function writeFileTree(dir, files, options = {}) {
    const { overwrite = true } = options
    Object.keys(files).forEach((name) => {
        const filePath = path.join(dir, name)
        fs.ensureDirSync(path.dirname(filePath))
        if (!overwrite && name !== 'package.json' && fs.existsSync(filePath)) return
        fs.writeFileSync(filePath, files[name])
    })
}
