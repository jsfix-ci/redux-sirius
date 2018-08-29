import { mergeConfig, defaultConfig } from './mergeConfig'

test('Fall back to default config', () => {
  const config = mergeConfig()
  expect(config).toEqual(defaultConfig)
})

test('Set \'modelPath\'', () => {
  const config = mergeConfig({
    modelPath: {
      path: './model',
      relative: true
    }
  })
  expect(config.modelPath).toEqual({
    path: './model',
    relative: true
  })
})
