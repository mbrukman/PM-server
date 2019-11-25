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
  const ProjectModel = mongoose.model("Project");
  const MapPolicyModel = mongoose.model("MapPolicy");
  const ProjectPolicyModel = mongoose.model("ProjectPolicy");
  const allProjects = await ProjectModel.find().populate("maps");
  allProjects.forEach(project => {
    const projectPolicy = new ProjectPolicyModel();
    projectPolicy.project = project;
    projectPolicy.maps = project.maps.map(map => {
      const mapPolicy = new MapPolicyModel();
      mapPolicy.map = map;
      return mapPolicy;
    });
    this.projects.push(projectPolicy);
  });
});

module.exports.ProjectPoliciesModel = mongoose.model(
  "ProjectPolicies",
  projectPolicySchema,
  "projectIntermediaryPolicies"
);
