// ESLint flat config. `package.json` already defined a "lint" script
// (`eslint .`) but this file — and eslint itself as a dependency — never
// existed, so `npm run lint` failed immediately with "eslint: not found".
// Added as part of the full project audit.
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'update_css.cjs'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Vite's React 17+ JSX runtime
      'react/prop-types': 'off',
      // catch (err) { toast.error('...') } without referencing `err` is an
      // intentional pattern throughout this codebase (the message is
      // user-facing, the detail is for logging elsewhere) — not a bug.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_|^err$' }],
    },
  },
]
