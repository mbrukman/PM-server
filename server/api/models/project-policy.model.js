const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectDefinitionInPolicySchema = new Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  permissions: new Schema({
    read: { type: Boolean, default: false },
    createMap: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    remove: { type: Boolean, default: false },
    archive: { type: Boolean, default: false }
  }),
  maps: [
    new Schema({
      map: { type: mongoose.Schema.Types.ObjectId, ref: "Map" },
      permissions: new Schema({
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        remove: { type: Boolean, default: false },
        execute: { type: Boolean, default: false },
        archive: { type: Boolean, default: false }
      })
    })
  ]
});

const projectPolicySchema = new Schema(
  {
    projects: [projectDefinitionInPolicySchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
// in case we will want to have name for policies
// policySchema.statics.autocompleteKey = "name";
projectPolicySchema.statics.autocompleteValueField = "_id";

const ProjectPolicy = mongoose.model(
  "ProjectPolicy",
  projectPolicySchema,
  "projectPolicies"
);

module.exports = ProjectPolicy;
