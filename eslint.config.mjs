import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
// NOTE: eslint-plugin-no-explicit-type-exports is not yet compatible with ESLint 10
// import noExplicitTypeExports from 'eslint-plugin-no-explicit-type-exports'

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintcache', '**/jsep.ts'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    // NOTE: eslint-plugin-no-explicit-type-exports disabled - not ESLint 10 compatible yet
    // plugins: { 'no-explicit-type-exports': noExplicitTypeExports },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      // type-aware rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      // NOTE: no-explicit-type-exports rule disabled - not ESLint 10 compatible yet
      // 'no-explicit-type-exports/no-explicit-type-exports': 2,
    },
  },
])
