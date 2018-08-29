export const defaultConfig = {
  // models
  models: {},
  modelPath: {
    // path to read model files
    path: '',
    // use relative namespace or not
    relative: false
  },
  // extra middlewares
  middlewares: [],
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
    middlewares: config.middlewares || [],
    modelPath: mergeObject(defaultConfig.modelPath, config.modelPath),
    // devtools: config.devtools ? config.devtools : defaultConfig.devtools
    devtools: mergeObject(defaultConfig.devtools, config.devtools),
    enableThunk: config.enableThunk !== false
  }
}
