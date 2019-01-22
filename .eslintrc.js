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
  plugins: ['flowtype'],
  rules: {
    'flowtype/define-flow-type': 1,
    'linebreak-style': ['error', 'unix'],
    'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    quotes: ['error', 'single', {avoidEscape: true}],
    semi: ['error', 'always'],
  },
  root: true,
};
