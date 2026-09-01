import tseslint from 'typescript-eslint'
// NOTE: eslint-plugin-no-explicit-type-exports is not yet compatible with ESLint 10
// import noExplicitTypeExports from 'eslint-plugin-no-explicit-type-exports'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintcache', '**/jsep.ts'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      // NOTE: eslint-plugin-no-explicit-type-exports disabled - not ESLint 10 compatible yet
      // 'no-explicit-type-exports': noExplicitTypeExports,
    },
    rules: {
      ...tseslint.configs.recommended[0].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      // NOTE: no-explicit-type-exports rule disabled - not ESLint 10 compatible yet
      // 'no-explicit-type-exports/no-explicit-type-exports': 2,
    },
  },
]
