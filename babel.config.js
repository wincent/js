/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

/**
 * We just want some light minification that leaves output readable, so turn off
 * some items in the "babel-preset-minify" package.
 */
const babelMinifyOptions = {
  booleans: false,
  builtIns: false,
  flipComparisons: false,
  mangle: false,
  numericLiterals: false,
  simplify: false,
};

function getMinifyReplaceConfig(environment) {
  return [
    'minify-replace',
    {
      replacements: [
        {
          identifierName: '__DEV__',
          replacement: {
            type: 'booleanLiteral',
            value: environment === 'development',
          },
        },
      ],
    },
  ];
}

const commentOptions = {
  shouldPrintComment: value => /@license|@preserve/.test(value),
};

module.exports = function(api) {
  api.cache(false);

  return {
    env: {
      jest: {
        plugins: [getMinifyReplaceConfig('development')],
        presets: [
          // Avoid "ReferenceError: regeneratorRuntime is not defined"
          // in Jest runs that use async functions.
          ['@babel/preset-env', {targets: {node: 'current'}}],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
      development: {
        ...commentOptions,
        plugins: [
          getMinifyReplaceConfig('development'),
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
      production: {
        ...commentOptions,
        plugins: [
          getMinifyReplaceConfig('production'),
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
          ['minify', babelMinifyOptions],
        ],
      },
      es: {
        ...commentOptions,
        plugins: [
          getMinifyReplaceConfig('production'),
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
          ['minify', babelMinifyOptions],
        ],
      },
    },
  };
};
