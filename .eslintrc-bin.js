module.exports = {
  env: {
    browser: false,
    commonjs: false,
    es6: false,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:node/recommended'],
  parserOptions: {
    ecmaVersion: 5,
    ecmaFeatures: {modules: false},
    sourceType: 'script',
  },
  rules: {
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        version: '>=6.0.0',
        ignores: [],
      },
    ],
    'no-process-exit': 'off',
  },
};
