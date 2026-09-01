import type { Config } from 'jest'

const config: Config = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: { ignoreCodes: ['TS5107'] } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!change-case|uuid/)'],
  testEnvironment: 'node',
  testRegex: String.raw`/src/.*\.(test|spec)?\.(ts|tsx)$`,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

export default config
