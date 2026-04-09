module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'json', 'vue'],
    transform: {
        '^.+\\.vue$': 'vue-jest',
        '^.+\\.js$': 'babel-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/tests/unit/**/*.spec.[jt]s'],
    collectCoverageFrom: [
        'src/components/**/*.{js,vue}',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        './src/components/': {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
}
