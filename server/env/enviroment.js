const path = require("path");
const config = require("./config");


let keyPath = {keyPath: path.join(__dirname, 'key.pm')};
let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn,keyPath, config);

module.exports = env;