module.exports = (generator) => {
    generator.render('./template')

    generator.extendPackage({
        dependencies: {
            vue: '^3.4.0',
        },
        devDependencies: {
            '@vue/compiler-sfc': '^3.4.0',
        },
    })
}

