const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  iamPolicy: { type: Schema.Types.ObjectId, ref: "IAMPolicy" },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

const UserGroup = mongoose.model("UserGroup", groupSchema, "user-groups");

module.exports = UserGroup;
