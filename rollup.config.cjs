const path = require('path')
const resolve = require('@rollup/plugin-node-resolve').default
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')

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
    commonjs(),
    json(),
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

