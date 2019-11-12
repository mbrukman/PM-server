if (!process.env.DB_URI) {
  require("dotenv").config();
}

const path = require("path");
const packageJson = require("../package.json");

global.kaholo = {
  VERSION: packageJson.version,
  KEY_PATH: path.join(__dirname, ".khkey"),
  STATIC_CDN: path.join(path.dirname(path.dirname(__dirname)), "static_cdn")
};
