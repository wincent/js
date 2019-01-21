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

  return {
    presets: [['@babel/preset-env', env], '@babel/preset-flow'],
  };
};
