const path = require('path')
const resolve = require('@rollup/plugin-node-resolve').default
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
// 新增：拷贝文件插件
const copy = require('rollup-plugin-copy')

function stripShebang() {
  return {
    name: 'strip-shebang',
    transform(code, id) {
      if (!id.endsWith(path.join('bin', 'mvc.js'))) return null
      return code.replace(/^#!.*\n/, '')
    },
  }
}

module.exports = {
  input: path.resolve(__dirname, 'bin/mvc.js'),
  output: {
    file: path.resolve(__dirname, 'dist/mvc.js'),
    format: 'cjs',
    banner: '#!/usr/bin/env node',
  },
  plugins: [
    stripShebang(),
    resolve({ preferBuiltins: true }),
    // 👇 修复：配置动态 require 支持（核心）
    commonjs({
      dynamicRequireTargets: [
        './generator/**/*.js'  // 匹配你所有动态加载的 generator 文件
      ]
    }),
    json(),
    // 👇 新增：自动拷贝 generator 文件夹到 dist（核心）
    copy({
      targets: [
        {
          src: path.resolve(__dirname, './generator'), // 你的 generator 源目录
          dest: path.resolve(__dirname, './dist')     // 打包后放到 dist 里
        }
      ],
      verbose: true // 显示拷贝日志
    })
  ],
  external: [
    'fs',
    'path',
    'os',
    'child_process',
    'crypto',
    'stream',
    'util',
    'url',
    'http',
    'https',
    'zlib',
  ],
}