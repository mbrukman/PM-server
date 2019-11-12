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
      const { deletedCount } = await userGroupService.remove(id);
      req.io.emit("notification", {
        title: "Group removal",
        message: `The group was removed successfully.`,
        type: "success"
      });
      return res.status(200).json({ deletedCount });
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

  async getOne(req, res) {
    const { id } = req.params;
    const { query } = req;

    try {
      const user = await userGroupService.getOne(id, query);
      return res.status(200).json(user);
    } catch (err) {
      winston.log("error", "Error filtering user group.", err);
      return res.status(500).json(err);
    }
  },

  async filter(req, res) {
    const { query } = req;
    if (typeof query.options === "string" && query.options) {
      query.options = JSON.parse(query.options);
    } else {
      query.options = {};
    }
    try {
      const userGroup = await userGroupService.filter(query);
      return res.status(200).json(userGroup);
    } catch (err) {
      winston.log("error", "Error filtering user group.", err);
      return res.status(500).json(err);
    }
  }
};
