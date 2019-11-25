const mongoose = require("mongoose");
const {
  ProjectPoliciesModel
} = require("./project-policy/project-policies.model");

const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    archived: { type: Boolean, default: false },
    maps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Map" }]
  },
  { timestamps: true }
);

projectSchema.statics.autocompleteKey = "name";
projectSchema.statics.autocompleteValueField = "_id";

// new project is added to policies of all users and groups !!!!
projectSchema.post("save", async doc => {
  const UserGroupModel = mongoose.model("UserGroup");
  const UserModel = mongoose.model("User");
  const userGroups = await UserGroupModel.find({}).populate("projectPolicy");
  const users = await UserModel.find({}).populate("projectPolicy");
  await Promise.all(
    users.map(async user => {
      const projectPolicy = new ProjectPoliciesModel();
      projectPolicy.project = doc;
      if (user.projectPolicy) {
        user.projectPolicy.projects.push(projectPolicy);
        await projectPolicy.save();
      }
      return user.save();
    })
  );
  await Promise.all(
    userGroups.map(async userGroup => {
      const projectPolicy = new ProjectPoliciesModel();
      projectPolicy.project = doc;
      if (userGroup.projectPolicy) {
        userGroup.projectPolicy.projects.push(projectPolicy);
        await projectPolicy.save();
      }
      return userGroup.save();
    })
  );
});

projectSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});

module.exports = mongoose.model("Project", projectSchema, "projects");
