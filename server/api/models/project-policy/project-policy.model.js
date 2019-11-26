const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports.ProjectPolicySchema = new Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  permissions: new Schema({
    read: { type: Boolean, default: true },
    createMap: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
    archive: { type: Boolean, default: true }
  }),
  maps: [{ type: mongoose.Schema.Types.ObjectId, ref: "MapPolicy" }]
});

module.exports.ProjectPolicyModel = mongoose.model(
  "ProjectPolicy",
  module.exports.ProjectPolicySchema,
  "projectPolicies"
);
