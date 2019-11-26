const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const iamPolicySchema = new Schema({
  permissions: {
    read: { type: Boolean, default: true },
    create: { type: Boolean, default: true },
    update: { type: Boolean, default: true },
    remove: { type: Boolean, default: true }
  },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  group: { type: Schema.Types.ObjectId, ref: "UserGroup" }
});

const IAMPolicy = mongoose.model("IAMPolicy", iamPolicySchema, "iamPolicies");

module.exports = IAMPolicy;
