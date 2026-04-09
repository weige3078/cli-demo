module.exports = (generator, options = {}) => {
    const isVue3 = options.features && options.features.includes('vue3')
    if (!isVue3) return

    const hasPinia = options.features && options.features.includes('pinia')

    generator.extendPackage({
        devDependencies: {
            typescript: '^5.5.4',
            '@types/node': '^22.5.4',
        },
    })

    // 渲染 ts 版本入口与配置；与 vue3/vite 产生同路径文件时，会以后渲染的内容为准
    generator.render(hasPinia ? './template-pinia' : './template')

    // ts 入口生效后，删除 js 入口避免混淆
    generator.deleteFile('src/main.js')
}

