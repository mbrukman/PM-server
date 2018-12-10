const path = require("path");
const config = require("./config");

let static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")}
let env = Object.assign({}, static_cdn, config);

module.exports = env;