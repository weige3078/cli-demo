module.exports = (generator) => {
    generator.extendPackage({
        scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
        },
        devDependencies: {
            vite: '^5.4.0',
            '@vitejs/plugin-vue': '^5.1.0',
        },
    })

    generator.render('./template')
}

