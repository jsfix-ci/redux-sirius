import { uglify } from 'rollup-plugin-uglify'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonJs from 'rollup-plugin-commonjs'
import { minify } from 'uglify-es'
// 参考https://github.com/reduxjs/redux/blob/master/rollup.config.js
const env = process.env.NODE_ENV
const config = {
  input: 'src/index.js',
  plugins: []
}
if (env === 'es' || env === 'cjs') {
  config.output = { format: env, indent: false }
}
if (env === 'development' || env === 'production') {
  config.output = { format: 'umd', name: 'Sirius', indent: false }
  config.plugins.push(
    commonJs(),
    nodeResolve({
      jsnext: true
    })
  )
}
if (env === 'development') {
  config.plugins.push(
    replace({
      __DEV__: true
    })
  )
}
if (env === 'production') {
  config.plugins.push(
    replace({
      __DEV__: false
    }),
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    }, minify)
  )
}

export default config
