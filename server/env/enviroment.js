const path = require("path");
const config = require("./config");
const package = require("../package.json")

let version = package.version;
let keyPath = {keyPath: path.join(__dirname, '.khkey')};
let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn,keyPath, config, {version});

module.exports = env;