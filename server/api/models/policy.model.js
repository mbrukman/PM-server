const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectPermissionsSchema = new Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  permissions: new Schema({
    read: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    remove: { type: Boolean, default: false }
  }),
  maps: [
    new Schema({
      map: { type: mongoose.Schema.Types.ObjectId, ref: "Map" },
      permissions: new Schema({
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        remove: { type: Boolean, default: false },
        execute: { type: Boolean, default: false }
      })
    })
  ]
});

const policySchema = new Schema(
  {
    projects: [projectPermissionsSchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
// in case we will want to have name for policies
// policySchema.statics.autocompleteKey = "name";
policySchema.statics.autocompleteValueField = "_id";

const ProjectPolicy = mongoose.model(
  "ProjectPolicy",
  projectPolicySchema,
  "projectPolicy"
);

module.exports = ProjectPolicy;
