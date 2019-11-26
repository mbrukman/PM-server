const mongoose = require("mongoose");
const validator = require("validator");
const Schema = mongoose.Schema;
const _ = require("lodash");

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

userSchema.post("save", async function(doc) {
  if (!doc.projectPolicy) {
    doc.projectPolicy = new ProjectPoliciesModel();
    doc.projectPolicy.user = doc._id;

    if (doc.isAdmin === true) {
      doc.projectPolicy.projects = doc.projectPolicy.projects.map(project => {
        project.permissions = _.mapValues(project.permissions, () => true);
        project.maps.map(mapData => {
          mapData.permissions = _.mapValues(project.permissions, () => true);
          return mapData;
        });
        return project;
      });
    }
    await doc.projectPolicy.save();
    doc.save();
  }
  if (!doc.iamPolicy) {
    doc.iamPolicy = new IAMPolicy();
    doc.iamPolicy.user = doc._id;
    if (doc.isAdmin === true) {
      doc.iamPolicy.permissions = _.mapValues(
        doc.iamPolicy.permissions,
        () => true
      );
    }
    await doc.iamPolicy.save();
  }

  if (!doc.iamPolicy || !doc.projectPolicy) {
    await doc.save();
  }
});

const UserModel = mongoose.model("User", userSchema, "users");
module.exports = UserModel;
