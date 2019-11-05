const userGroupService = require("../services/user-group.service");
const winston = require("winston");

module.exports = {
  async create(req, res) {
    try {
      const { body } = req;
      const userGroup = await userGroupService.create(body);
      req.io.emit("notification", {
        title: "Group saved",
        message: `${userGroup.name} saved successfully`,
        type: "success"
      });
      return res.json(userGroup);
    } catch (err) {
      winston.log("error", "Error creating user group.", err);
      return res.status(500).json(err);
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const { nRemoved } = await userGroupService.remove(id);
      req.io.emit("notification", {
        title: "Group removal",
        message: `The group was removed successfully.`,
        type: "success"
      });
      return res.status(204).json({ removed: nRemoved });
    } catch (err) {
      req.io.emit("notification", {
        title: "Group removal",
        message: `The group was not removed due to error.`,
        type: "error"
      });
      winston.log("error", "Error creating user group.", err);
      return res.status(500).json(err);
    }
  },

  async filter(req, res) {
    const { query } = req;
    query.options = query.options || {};
    try {
      const userGroup = await userGroupService.filter(query);
      return res.status(200).json(userGroup);
    } catch (err) {
      winston.log("error", "Error filtering user group.", err);
      return res.status(500).json(err);
    }
  }
};
