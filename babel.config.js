function isJest() {
  return process.env.hasOwnProperty('JEST_WORKER_ID');
}

module.exports = function(api) {
  api.cache(false);

  // Avoid "ReferenceError: regeneratorRuntime is not defined" in Jest runs that
  // use async functions.
  const env = isJest()
    ? {
        targets: {node: 'current'},
      }
    : {};
  const plugins = isJest()
    ? []
    : [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: 2,
            helpers: true,
            regenerator: true,
            useESModules: false,
          },
        ],
      ];
  return {
    plugins,
    presets: [['@babel/preset-env', env], '@babel/preset-flow'],
  };
};
