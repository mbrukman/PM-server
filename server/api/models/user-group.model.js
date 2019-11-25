const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  iamPolicy: { type: Schema.Types.ObjectId, ref: "IAMPolicy" },
  projectPolicy: { type: Schema.Types.ObjectId, ref: "ProjectPolicies" },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("UserGroup", groupSchema, "user-groups");
