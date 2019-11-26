const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports.MapPolicySchema = new Schema({
  map: { type: mongoose.Schema.Types.ObjectId, ref: "Map" },
  permissions: {
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    execute: { type: Boolean, default: false },
    archive: { type: Boolean, default: false }
  }
});

module.exports.MapPolicyModel = mongoose.model(
  "MapPolicy",
  module.exports.MapPolicySchema,
  "mapPolicies"
);
