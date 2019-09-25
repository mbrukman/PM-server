const path = require('path');
const config = require('./config');
const packageJson = require('../package.json');
const fs = require('fs');

// //////////////////////////
//   Key creation
// //////////////////////////

if (!config.serverKey) {
  const createKey = require('../helpers/create-key');
  config.serverKey = createKey.generateKey();
  fs.writeFileSync('./config.json', JSON.stringify(config), 'utf8'); // write it back
}
// //////////////////////////

const version = packageJson.version;
const keyPath = {keyPath: path.join(__dirname, '.khkey')};
const static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), 'static_cdn')};
const env = Object.assign({}, static_cdn, keyPath, config, {version});

module.exports = env;
