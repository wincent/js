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

const pluginTransformModulesCommonJS = [
  '@babel/plugin-transform-modules-commonjs',
  {
    loose: true,
    noInterop: true,
  },
];

/**
 * No-op Babel transform used as a fallback.
 */
function noopTransform() {
  return {
    visitor: {},
  };
}

function printFallbackMessage(error) {
  const isTTY = process.stdout.isTTY;
  const yellow = isTTY ? '\x1b[33m' : '';
  const reset = isTTY ? '\x1b[0m' : '';
  console.log(
    `${yellow}Falling back to no-op transform` +
      (error ? `: ${error.message}` : '.') +
      reset,
  );
}

/**
 * Instead of trying to use local Babel plug-ins directly, wrap them so that
 * they degrade gracefully when not-yet-built. This allows us to avoid the
 * chicken-and-egg problem stemming from using transforms from this repo to
 * build things in this repo.
 */
function wrapLocal(plugin) {
  if (typeof plugin === 'string') {
    try {
      return [require(plugin).default, {}, plugin];
    } catch (error) {
      printFallbackMessage(error);
      return [noopTransform, {}, plugin];
    }
  } else {
    const [name, options] = plugin;
    let instance;
    try {
      instance = require(name).default;
      return [instance, options, name];
    } catch (error) {
      printFallbackMessage(error);
      return [noopTransform, options, name];
    }
  }
}

module.exports = function(api) {
  api.cache(false);

  return {
    babelrcRoots: ['.', './packages/*'],
    env: {
      jest: {
        plugins: [
          pluginTransformModulesCommonJS,
          getMinifyReplaceConfig('development'),
          wrapLocal('@wincent/babel-plugin-invariant-transform'),
        ],
        presets: [
          // Avoid "ReferenceError: regeneratorRuntime is not defined"
          // in Jest runs that use async functions.
          [
            '@babel/preset-env',
            {
              corejs: {
                proposals: true,
                version: 3,
              },
              targets: {node: 'current'},
              useBuiltIns: 'usage',
            },
          ],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
      development: {
        ...commentOptions,
        plugins: [
          pluginTransformModulesCommonJS,
          getMinifyReplaceConfig('development'),
          wrapLocal('@wincent/babel-plugin-invariant-transform'),
        ],
        presets: [
          [
            '@babel/preset-env',
            {
              corejs: {
                proposals: true,
                version: 3,
              },
              useBuiltIns: 'usage',
            },
          ],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
        ],
      },
      production: {
        ...commentOptions,
        plugins: [
          pluginTransformModulesCommonJS,
          getMinifyReplaceConfig('production'),
          wrapLocal([
            '@wincent/babel-plugin-invariant-transform',
            {strip: true},
          ]),
        ],
        presets: [
          [
            '@babel/preset-env',
            {
              corejs: 3,
              useBuiltIns: 'usage',
            },
          ],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
          ['minify', babelMinifyOptions],
        ],
      },
      es: {
        ...commentOptions,
        plugins: [
          getMinifyReplaceConfig('production'),
          wrapLocal([
            '@wincent/babel-plugin-invariant-transform',
            {strip: true},
          ]),
        ],
        presets: [
          ['@babel/preset-env', {modules: false, targets: {esmodules: true}}],
          ['@babel/preset-typescript', {isTSX: true, allExtensions: true}],
          ['minify', babelMinifyOptions],
        ],
      },
    },
    overrides: [
      {
        test: './packages/babel-plugin-invariant-transform/src/**/*.ts',
        plugins: [
          wrapLocal(['@wincent/babel-plugin-invariant-transform', false]),
        ],
      },
      {
        test: './packages/workspace-scripts/src/*.ts',
        plugins: ['@babel/syntax-dynamic-import', 'dynamic-import-node'],
      },
    ],
  };
};
