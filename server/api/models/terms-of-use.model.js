const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const termsOfUseSchema = new Schema(
  {
    isAccepted: { type: Boolean, required: true }
  },
  { capped: { size: 1024, max: 1, autoIndexId: true } }
);

const TermsOfUse = mongoose.model("TermsOfUse", termsOfUseSchema, "termsOfUse");

module.exports = TermsOfUse;
