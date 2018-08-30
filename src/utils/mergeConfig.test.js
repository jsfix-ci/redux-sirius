import { mergeConfig, defaultConfig } from './mergeConfig'

test('Fall back to default config', () => {
  const config = mergeConfig()
  expect(config).toEqual(defaultConfig)
})

test('Set \'fileModels\'', () => {
  const config = mergeConfig({
    fileModels: {
      path: './model',
      relative: true
    }
  })
  expect(config.fileModels).toEqual({
    path: './model',
    relative: true,
    webpackContext: null
  })
})
