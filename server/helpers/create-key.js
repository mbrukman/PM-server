const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");

function randomValueHex(len) {
  return crypto
    .randomBytes(len)
    .toString("hex")
    .slice(0, len);
}

module.exports = {
  /* generates pm file to the path specific*/
  generateKey: outputPath => {
    const keyValue = randomValueHex(32);
    mkdirp.sync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, keyValue);
    return keyValue;
  },

  generateKey: () => {
    return randomValueHex(32);
  }
};
