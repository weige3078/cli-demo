module.exports = (generator) => {
    generator.extendPackage({
        dependencies: {
            pinia: '^2.2.0',
        },
    })

    generator.render('./template')
}

