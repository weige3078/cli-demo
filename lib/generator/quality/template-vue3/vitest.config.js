const { defineConfig } = require('vitest/config')
const path = require('path')

module.exports = defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/unit/**/*.spec.[jt]s'],
        coverage: {
            provider: 'v8',
            enabled: true,
            include: ['src/components/**/*.{js,vue}'],
            thresholds: {
                branches: 50,
                functions: 50,
                lines: 50,
                statements: 50,
            },
        },
    },
})

