import type { Config } from 'jest'

// tests run in UTC unless a time zone is specified (CI runs them also in other time zones)
process.env.TZ ??= 'UTC'

const config: Config = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: { ignoreCodes: ['TS5107'] } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!change-case|n2words|uuid/)'],
  testEnvironment: 'node',
  testRegex: String.raw`/src/.*\.(test|spec)?\.(ts|tsx)$`,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

export default config
