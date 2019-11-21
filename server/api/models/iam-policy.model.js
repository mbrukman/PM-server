const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const iamPolicySchema = new Schema({
  permissions: {
    read: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    remove: { type: Boolean, default: false }
  },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  group: { type: Schema.Types.ObjectId, ref: "UserGroup" }
});

const IAMPolicy = mongoose.model("IAMPolicy", iamPolicySchema, "iamPolicies");

module.exports = IAMPolicy;
