module.exports = function normalizeFilePaths(files) {
    Object.keys(files).forEach(file => {
        const normalized = file.replace(/\\/g, '/')
        if (file !== normalized) {
            files[normalized] = files[file]
            delete files[file]
        }
    })
    
    return files
}
