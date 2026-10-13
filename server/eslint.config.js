// ESLint flat config for the Node.js/Express backend. Same issue as the
// frontend: package.json had a "lint" script but eslint was never a
// dependency and no config file existed, so `npm run lint` failed with
// "eslint: not found". Added as part of the full project audit.
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'logs/**', 'prisma/migrations/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$', caughtErrorsIgnorePattern: '^_|^err$' }],
    },
  },
];
