export const defaultConfig = {
  // models
  models: {},
  fileModels: {
    // path to read model files
    path: '',
    // use relative namespace or not
    relative: false,
    // webpack require.context
    webpackContext: null
  },
  // extra middleware
  middleware: [],
  // enable thunk middleware
  enableThunk: true,
  // redux devtools
  devtools: {
    enable: true,
    options: {}
  }
}
const mergeObject = (origin, replacer) => {
  return replacer ? { ...origin, ...(replacer || {}) } : origin || {}
}

export function mergeConfig (config) {
  if (!config) return defaultConfig
  return {
    models: mergeObject(defaultConfig.models, config.models),
    middleware: config.middleware || [],
    fileModels: mergeObject(defaultConfig.fileModels, config.fileModels),
    // devtools: config.devtools ? config.devtools : defaultConfig.devtools
    devtools: mergeObject(defaultConfig.devtools, config.devtools),
    enableThunk: config.enableThunk !== false
  }
}
