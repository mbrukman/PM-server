const {
  ProjectPoliciesModel
} = require("../models/project-policy/project-policies.model");

const projectPolicyPopulate = {
  path: "projects",
  model: "ProjectPolicy",
  populate: [
    {
      path: "project",
      model: "Project"
    },
    {
      path: "maps",
      model: "MapPolicy",
      populate: {
        path: "map",
        model: "Map"
      }
    }
  ]
};

module.exports = {
  patch() {},
  getOne(id) {
    return ProjectPoliciesModel.findOne({ _id: id }).populate(
      projectPolicyPopulate
    );
  }
};
