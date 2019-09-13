const path = require("path");
const config = require("./config");
const packageJson = require("../package.json");
const fs = require('fs');

 ////////////////////////////
//   Key creation 
////////////////////////////

 if (!config.serverKey) {
    const createKey = require("../helpers/create-key");
    config.serverKey =  createKey.generateKey();
    fs.writeFileSync('./config.json', JSON.stringify(config), 'utf8'); // write it back 
} 
////////////////////////////

let version = packageJson.version;
let keyPath = {keyPath: path.join(__dirname, '.khkey')};
let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn,keyPath, config, {version});

module.exports = env;