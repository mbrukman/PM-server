const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const {
  ProjectPoliciesModel
} = require("./project-policy/project-policies.model");
const IAMPolicy = require("./iam-policy.model");

const groupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  iamPolicy: { type: Schema.Types.ObjectId, ref: "IAMPolicy" },
  projectPolicy: { type: Schema.Types.ObjectId, ref: "ProjectPolicies" },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

groupSchema.post("save", async function(doc) {
  if (!doc.projectPolicy) {
    doc.projectPolicy = new ProjectPoliciesModel();
    doc.projectPolicy.group = doc._id;
    await doc.projectPolicy.save();
    doc.save();
  }
  if (!doc.iamPolicy) {
    doc.iamPolicy = new IAMPolicy();
    doc.iamPolicy.group = doc._id;
    await doc.save();
  }
});

module.exports = mongoose.model("UserGroup", groupSchema, "user-groups");
