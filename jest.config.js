/**
 * @copyright Copyright (c) 2019-present Greg Hurrell
 * @license MIT
 */

const {defaults} = require('jest-config');

module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'],
  moduleNameMapper: {
    '@wincent/(.+)$': '<rootDir>packages/$1/src',
  },
  testMatch: ['**/*-test.js', '**/*-test.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/packages/[^/]+/lib/',
    '<rootDir>/packages/[^/]+/node_modules/',
  ],
  transform: {
    '^.+\\.[jt]s$': './support/babel-jest-wrapper.js',
  },
};
