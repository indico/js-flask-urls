/* eslint-disable import/unambiguous, import/no-commonjs */

const path = require('path');
const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  configFile: path.resolve(__dirname, '.babelrc'),
});
