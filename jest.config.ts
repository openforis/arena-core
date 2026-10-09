import type { Config } from 'jest'

// tests run in UTC unless a time zone is specified (CI runs them also in other time zones)
process.env.TZ ??= 'UTC'

const config: Config = {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!change-case|n2words|uuid/)'],
  testEnvironment: 'node',
  testRegex: String.raw`/src/.*\.(test|spec)?\.(ts|tsx)$`,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // used when running the tests with --coverage (yarn test:coverage, run in CI)
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/tests/**'],
  coverageReporters: ['text-summary'],
  // ratchet: raise these values when the coverage increases, never lower them
  coverageThreshold: {
    global: { statements: 86, branches: 72, functions: 69, lines: 88 },
  },
}

export default config
