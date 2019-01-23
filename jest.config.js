const {defaults} = require('jest-config');

module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mjs'],
  moduleNameMapper: {
    '@wincent/(.+)$': '<rootDir>packages/$1/src',
  },
  testMatch: ['**/*-test.js', '**/*-test.mjs'],
  testPathIgnorePatterns: [
    '<rootDir>/packages/[^/]+/lib/',
    '<rootDir>/packages/[^/]+/node_modules/',
  ],
  transform: {
    '^.+\\.m?js$': './support/babel-jest-wrapper.js',
  },
};
