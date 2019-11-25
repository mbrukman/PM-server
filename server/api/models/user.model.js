const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;

const {
  ProjectPoliciesModel
} = require("./project-policy/project-policies.model");
const IAMPolicy = require("./iam-policy.model");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: validator.isEmail
    },
    phoneNumber: { type: String },
    changePasswordOnNextLogin: { type: Boolean },
    password: { type: String },
    groups: [{ type: Schema.Types.ObjectId, ref: "UserGroup" }],
    projectPolicy: { type: Schema.Types.ObjectId, ref: "ProjectPolicies" },
    iamPolicy: { type: Schema.Types.ObjectId, ref: "IAMPolicy" },
    isAdmin: Boolean
  },
  { timestamps: true }
);

userSchema.pre("save", async function() {
  this.projectPolicy = new ProjectPoliciesModel();
  this.iamPolicy = new IAMPolicy();
  await this.iamPolicy.save();
  await this.projectPolicy.save();
});
const UserModel = mongoose.model("User", userSchema, "users");
module.exports = UserModel;
