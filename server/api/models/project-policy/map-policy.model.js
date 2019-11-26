const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports.MapPolicySchema = new Schema({
  map: { type: mongoose.Schema.Types.ObjectId, ref: "Map" },
  permissions: {
    read: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
    execute: { type: Boolean, default: true },
    archive: { type: Boolean, default: true }
  }
});

module.exports.MapPolicyModel = mongoose.model(
  "MapPolicy",
  module.exports.MapPolicySchema,
  "mapPolicies"
);
