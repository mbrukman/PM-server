const UserGroupModel = require("../models/user-group.model");
const mongoose = require("mongoose");

function getSort(sortString) {
  const sort = {};
  if (sortString[0] === "-") {
    sort[sortString.slice(1)] = -1;
  } else {
    sort[sortString] = 1;
  }
  return sort;
}

class UserGroupService {
  constructor() {}

  create(groupData) {
    const newUserGroup = new UserGroupModel(groupData);
    return newUserGroup.save();
  }

  remove(_id) {
    return UserGroupModel.deleteOne({ _id });
  }

  getOne(_id, filterOptions = {}) {
    let page;
    const fields = filterOptions.fields;
    const sort = filterOptions.options.sort || "name";

    if (typeof filterOptions.options.page === "string") {
      page = 0;
    } else {
      page = parseInt(filterOptions.options.page, 10);
    }

    if (fields) {
      Object.keys(fields).map(key => {
        fields[key] = { $regex: `.*${fields[key]}.*` };
      });
    }
    const match = {};
    if (filterOptions.options.globalFilter) {
      match.name = {
        $regex: new RegExp(filterOptions.options.globalFilter, "ig")
      };
    }

    const pageSize = parseInt(process.env.PAGE_SIZE, 10);
    const options = {
      sort: getSort(sort),
      skip: page ? (page - 1) * pageSize : 0,
      limit: filterOptions.options.limit || pageSize
    };

    return UserGroupModel.findById(_id).populate({
      path: "users",
      match,
      options,
      populate: {
        path: "groups"
      }
    });
  }

  patch(_id, objectToUpdate) {
    return UserGroupModel.findOneAndUpdate(
      { _id },
      { $set: objectToUpdate },
      {
        runValidators: true,
        new: true
      }
    ).populate("users");
  }

  async filter(filterOptions = {}) {
    try {
      let page;
      const fields = filterOptions.fields;
      const sort = filterOptions.options.sort || "name";

      if (typeof filterOptions.options.page === "string") {
        page = 0;
      } else {
        page = parseInt(filterOptions.options.page, 10);
      }

      if (fields) {
        Object.keys(fields).map(key => {
          fields[key] = { $regex: `.*${fields[key]}.*` };
        });
      }

      const $match = {};
      if (filterOptions.options.globalFilter) {
        $match.$or = [
          {
            name: {
              $regex: new RegExp(filterOptions.options.globalFilter, "ig")
            }
          },
          {
            email: {
              $regex: new RegExp(filterOptions.options.globalFilter, "ig")
            }
          }
        ];
      }
      if (filterOptions.options.notInUsers) {
        $match.$and = [
          {
            users: {
              // eslint-disable-next-line new-cap
              $ne: mongoose.Types.ObjectId(filterOptions.options.notInUsers)
            }
          }
        ];
      }
      const aggregateSteps = [
        {
          $match: $match
        }
      ];
      const pageSize = parseInt(process.env.PAGE_SIZE, 10);
      const resultsQuery = [
        ...aggregateSteps,
        { $sort: getSort(sort) },
        { $skip: page ? (page - 1) * pageSize : 0 },
        { $limit: filterOptions.options.limit || pageSize }
      ];

      const countQuery = [
        ...aggregateSteps,
        {
          $count: "count"
        }
      ];
      const groups = await UserGroupModel.aggregate(resultsQuery);
      const populatedGroups = await UserGroupModel.populate(groups, {
        path: "users"
      });
      const totalGroupLength = await UserGroupModel.aggregate(countQuery);
      return {
        items: populatedGroups,
        totalCount: totalGroupLength.length ? totalGroupLength[0].count : 0
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async bulkUpdateUserGroup(userGroupsData) {
    const entries = Object.entries(userGroupsData);
    const updates = entries.map(([_id, value]) => {
      return {
        updateOne: {
          filter: { _id },
          update: { $set: value }
        }
      };
    });
    await UserGroupModel.bulkWrite(updates);
    return UserGroupModel.find({
      _id: {
        $in: Object.keys(userGroupsData)
      }
    }).populate("users");
  }
}

const userGroupService = new UserGroupService();

module.exports = userGroupService;
