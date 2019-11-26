const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports = {};

const projectPolicySchema = new Schema(
  {
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProjectPolicy" }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }
  },
  { timestamps: true }
);

projectPolicySchema.statics.autocompleteValueField = "_id";

projectPolicySchema.pre("save", async function() {
  if (!this.projects.length) {
    return;
  }
  const ProjectModel = mongoose.model("Project");
  const MapPolicyModel = mongoose.model("MapPolicy");
  const ProjectPolicyModel = mongoose.model("ProjectPolicy");
  const allProjects = await ProjectModel.find().populate("maps");
  const promises = allProjects.map(async project => {
    const projectPolicy = new ProjectPolicyModel();
    projectPolicy.project = project;
    projectPolicy.maps = await Promise.all(
      project.maps.map(async map => {
        const mapPolicy = new MapPolicyModel();
        mapPolicy.map = map;
        await mapPolicy.save();
        return mapPolicy;
      })
    );
    await Promise.all(promises);
    await projectPolicy.save();
    this.projects.push(projectPolicy);
  });
});

module.exports.ProjectPoliciesModel = mongoose.model(
  "ProjectPolicies",
  projectPolicySchema,
  "projectIntermediaryPolicies"
);
