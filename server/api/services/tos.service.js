const TOS = require("../models/tos.model");

module.exports = {
  acceptTos(TOSData) {
    return TOS.update({ _id: TOSData._id }, TOSData, {
      upsert: true,
      setDefaultsOnInsert: true
    });
  },
  getTos() {
    return TOS.findOne();
  }
};
