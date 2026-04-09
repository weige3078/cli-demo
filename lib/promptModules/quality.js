module.exports = (api) => {
    api.injectFeature({
        name: 'Quality gate',
        value: 'quality',
        short: 'Quality',
        description: 'Commit message lint (commit-msg) + unit test coverage gate (pre-push)',
        checked: true,
    })
}
