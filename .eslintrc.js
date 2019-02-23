module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  globals: {
    __DEV__: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {modules: true},
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['notice', '@typescript-eslint'],
  rules: {
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_|^this$',
        varsIgnorePattern: '^_',
      },
    ],
    'notice/notice': [
      'error',
      {
        messages: {
          whenFailedToMatch: 'Missing copyright notice',
        },
        mustMatch: 'Copyright \\(c\\) 20[1-9][0-9]-present Greg Hurrell',
        template:
          '/**\n * @copyright Copyright (c) <%= YEAR %>-present Greg Hurrell\n * @license MIT\n */\n',
      },
    ],
    quotes: ['error', 'single', {avoidEscape: true}],
    semi: ['error', 'always'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_|^this$',
        varsIgnorePattern: '^_',
      },
    ],
  },
  root: true,
};
