const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;

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
    projectPolicy: { type: Schema.Types.ObjectId, ref: "ProjectPolicy" },
    iamPolicy: { type: Schema.Types.ObjectId, ref: "IAMPolicy" },
    isAdmin: Boolean
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
