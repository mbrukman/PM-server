const projectPolicyService = require("../services/project-policy.service");
const winston = require("winston");

module.exports = {
  async getOne(req, res) {
    try {
      const { id } = req.params;
      const projectPolicy = await projectPolicyService.getOne(id);
      return res.status(200).json(projectPolicy);
    } catch (err) {
      console.log(err);
      winston.log("error", "Error getting project policy's details", err);
      res.status(404).json(err);
    }
  }
};
