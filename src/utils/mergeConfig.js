export const defaultConfig = {
  models: {},
  middlewares: [],
  enableThunk: true,
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
    // devtools: config.devtools ? config.devtools : defaultConfig.devtools
    devtools: mergeObject(defaultConfig.devtools, config.devtools),
    enableThunk: config.enableThunk !== false
  }
}
