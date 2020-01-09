const TermsOfUse = require("../models/terms-of-use.model");
const mongoose = require("mongoose");

module.exports = {
  acceptTermsOfUse(termsOfUseData) {
    if (!termsOfUseData._id) {
      termsOfUseData._id = new mongoose.mongo.ObjectID();
    }
    return TermsOfUse.findOneAndUpdate(
      { _id: termsOfUseData._id },
      termsOfUseData,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  },
  getTermsOfUse() {
    return TermsOfUse.findOne();
  }
};
