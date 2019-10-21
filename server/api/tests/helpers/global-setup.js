const startKaholo = require("../../../helpers/index");

module.exports = async () => {
  global.server = startKaholo();
};
