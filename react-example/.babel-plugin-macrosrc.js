/* eslint-disable import/unambiguous, import/no-commonjs */

const {execSync} = require('child_process');

const urlMap = JSON.parse(
  execSync('flask url_map_to_json', {
    env: {FLASK_APP: 'app.py', ...process.env},
  })
);

module.exports = {
  flaskURLs: {
    urlMap,
  },
};
