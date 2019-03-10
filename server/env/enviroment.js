const path = require("path");
const config = require("./config");
const package = require("../package.json")
const fs = require('fs');

////////////////////////////
//   Key creation 
////////////////////////////

if (!config.serverKey) {
    const createKey = require("../helpers/create-key");
    config.serverKey =  createKey.generateKey();
    fs.writeFileSync('./env/config.json', JSON.stringify(config), 'utf8'); // write it back 
}
/////////////////////////////////////////////

let version = package.version;
let vaultKeyPath = {vaultKeyPath: path.join(__dirname, '.vaultKey')};
let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn,vaultKeyPath, config, {version});

module.exports = env;