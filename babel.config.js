module.exports = function(api) {
  api.cache(false);

  return {
    ignore: [
      '/__tests__/',
    ],
    presets: [
      "@babel/preset-env",
      "@babel/preset-flow",
    ],
  };
};
