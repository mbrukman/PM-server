const userGroupService = require("../services/user-group.service");
const winston = require("winston");

module.exports = {
  async create(req, res) {
    try {
      const { body } = req;
      const userGroup = await userGroupService.create(body);
      req.io.emit("notification", {
        title: "User group saved",
        message: `${userGroup.name} saved successfully`,
        type: "success"
      });
      return res.json(userGroup);
    } catch (err) {
      winston.log("error", "Error creating user group.", err);
      return res.status(500).json(err);
    }
  }
};
