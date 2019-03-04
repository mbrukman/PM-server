const path = require("path");
const config = require("./config");
const package = require("../package.json")

let version = package.version;
let vaultKeyPath = {vaultKeyPath: path.join(__dirname, '.vaultKey')};
let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn,vaultKeyPath, config, {version});
env.serverKey;

module.exports = env;