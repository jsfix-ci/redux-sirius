export const defaultConfig = {
  models: {},
  middlewares: [],
  devtools: {
    enable: true,
    options: {}
  }
}
const merge = (origin, replacer) => {
  return replacer ? { ...replacer, ...(origin || {}) } : origin || {}
}

export function mergeConfig (config) {
  if (!config) return defaultConfig
  return {
    models: merge(defaultConfig.models, config.models),
    middlewares: merge(defaultConfig.middlewares, config.middlewares),
    devtools: config.devtools ? config.devtools : defaultConfig.devtools
  }
}
