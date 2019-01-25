/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

module.exports = function(api) {
  api.cache(false);

  return {
    env: {
      jest: {
        plugins: [],
        presets: [
          // Avoid "ReferenceError: regeneratorRuntime is not defined"
          // in Jest runs that use async functions.
          ['@babel/preset-env', {targets: {node: 'current'}}],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
      development: {
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              corejs: 2,
              helpers: true,
              regenerator: true,
              useESModules: false,
            },
          ],
        ],
        presets: [
          ['@babel/preset-env', {}],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
      es: {
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              corejs: false /* assume Polyfill by user */,
              helpers: false,
              regenerator: false,
              useESModules: true,
            },
          ],
        ],
        presets: [
          ['@babel/preset-env', {modules: false, targets: {esmodules: true}}],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
    },
  };
};
