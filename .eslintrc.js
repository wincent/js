module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['flowtype', 'notice'],
  rules: {
    'flowtype/define-flow-type': 1,
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    'notice/notice': [
      'error',
      {
        messages: {
          whenFailedToMatch: 'Missing copyright notice',
        },
        mustMatch: 'Copyright \\(c\\) 20[1-9][0-9]-present Greg Hurrell',
        template:
          '/**\n * @copyright Copyright (c) <%= YEAR %>-present Greg Hurrell\n * @flow strict\n * @license MIT\n */\n',
      },
    ],
    quotes: ['error', 'single', {avoidEscape: true}],
    semi: ['error', 'always'],
  },
  root: true,
};
