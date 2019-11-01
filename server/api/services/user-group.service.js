const UserGroupModel = require("../models/user-group.model");

class UserGroupService {
  constructor() {}

  create(groupData) {
    const newUserGroup = new UserGroupModel(groupData);
    return newUserGroup.save();
  }
}

const userGroupService = new UserGroupService();

module.exports = userGroupService;
