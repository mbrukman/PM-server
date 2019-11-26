const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports.ProjectPolicySchema = new Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  permissions: {
    read: { type: Boolean, default: true },
    createMap: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    archive: { type: Boolean, default: false }
  },
  maps: [{ type: mongoose.Schema.Types.ObjectId, ref: "MapPolicy" }]
});

module.exports.ProjectPolicyModel = mongoose.model(
  "ProjectPolicy",
  module.exports.ProjectPolicySchema,
  "projectPolicies"
);
