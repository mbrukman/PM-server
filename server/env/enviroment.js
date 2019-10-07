const path = require("path");
const prodConfig = require("./config");
const testConfig = require("./config.test");
const packageJson = require("../package.json");
const fs = require("fs");

// //////////////////////////
//   Key creation
// //////////////////////////

let config = prodConfig;

if (process.env.NODE_ENV === "test") {
    config = testConfig;
}

if (!config.serverKey) {
    const createKey = require("../helpers/create-key");
    config.serverKey = createKey.generateKey();
    fs.writeFileSync("./config.json", JSON.stringify(config), "utf8"); // write it back
}
// ///////////////////Ł///////

const version = packageJson.version;
const keyPath = {keyPath: path.join(__dirname, '.khkey')};
// eslint-disable-next-line camelcase
const static_cdn = {static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")};

module.exports = Object.assign({}, static_cdn, keyPath, config, {version});
