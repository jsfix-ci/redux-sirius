import { mergeConfig, defaultConfig } from './mergeConfig'

test('Fall back to default config', () => {
  const config = mergeConfig()
  expect(config).toEqual(defaultConfig)
})
