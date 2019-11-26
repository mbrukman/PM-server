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

groupSchema.pre("save", async function() {
  if (!this.projectPolicy) {
    this.projectPolicy = new ProjectPoliciesModel();
    await this.projectPolicy.save();
  }
  if (!this.iamPolicy) {
    this.iamPolicy = new IAMPolicy();
    await this.iamPolicy.save();
  }
});

module.exports = mongoose.model("UserGroup", groupSchema, "user-groups");
