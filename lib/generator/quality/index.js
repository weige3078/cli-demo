module.exports = (generator, options = {}) => {
    const isVue3 = options.features && options.features.includes('vue3')

    generator.render(isVue3 ? './template-vue3' : './template')

    generator.extendPackage({
        scripts: {
            'test:unit': isVue3 ? 'vitest run --coverage' : 'jest --coverage',
        },
        devDependencies: isVue3 ? {
            chalk: '^4.1.2',
            husky: '^4.3.8',
            vitest: '^2.1.0',
            jsdom: '^25.0.0',
            '@vitest/coverage-v8': '^2.1.0',
            '@vue/test-utils': '^2.4.6',
        } : {
            chalk: '^4.1.2',
            husky: '^4.3.8',
            jest: '^27.5.1',
            'babel-jest': '^27.5.1',
            'vue-jest': '^3.0.7',
            'jest-environment-jsdom': '^27.5.1',
            '@vue/test-utils': '^1.3.0',
        },
        husky: {
            hooks: {
                'commit-msg': 'node scripts/verify-commit.js',
                'pre-push': 'npm run test:unit',
            },
        },
    })
}
