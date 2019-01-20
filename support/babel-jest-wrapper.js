module.exports = require('babel-jest').createTransformer({
  // As per: https://babeljs.io/docs/en/config-files#monorepos
  rootMode: 'upward',
});
