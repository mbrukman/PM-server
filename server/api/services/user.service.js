const { UserModel } = require("../models");
const crypto = require("crypto");
const serverKey = process.env.SERVER_KEY;
const mongoose = require("mongoose");
const _ = require("lodash");

function getSort(sortString) {
  const sort = {};
  if (sortString[0] === "-") {
    sort[sortString.slice(1)] = -1;
  } else {
    sort[sortString] = 1;
  }
  return sort;
}

class UserService {
  hashPassword(password) {
    const hash = crypto.createHash("sha256");
    const salt = serverKey;
    hash.update(password + salt);
    return hash.digest("hex");
  }

  async createUser(userData) {
    const user = new UserModel(userData);
    user.password = this.hashPassword(user.password);
    return user.save();
  }

  getUser(userId, filterOptions = {}) {
    let page;
    const fields = filterOptions.fields;
    filterOptions.options = filterOptions.options || {};
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

    return UserModel.findById(userId).populate([
      {
        path: "iamPolicy"
      },
      {
        path: "projectPolicy",
        populate: {
          path: "projects",
          model: "ProjectPolicy",
          populate: {
            path: "maps",
            model: "MapPolicy"
          }
        }
      },
      {
        path: "groups",
        match,
        options,
        populate: [
          {
            path: "users"
          },
          {
            path: "iamPolicy"
          }
        ]
      }
    ]);
  }

  updateUser(_id, newUserData) {
    if (newUserData.password) {
      newUserData.password = this.hashPassword(newUserData.password);
      newUserData.changePasswordOnNextLogin = false;
    }
    return UserModel.findOneAndUpdate(
      { _id },
      { $set: newUserData },
      {
        runValidators: true,
        new: true
      }
    ).populate("groups");
  }

  async bulkUpdateUser(usersData) {
    const entries = Object.entries(usersData);
    const updates = entries.map(([_id, value]) => {
      return {
        updateOne: {
          filter: { _id },
          update: { $set: value }
        }
      };
    });
    await UserModel.bulkWrite(updates);
    return UserModel.find({
      _id: {
        $in: Object.keys(usersData)
      }
    }).populate("groups");
  }

  async filter(filterOptions = {}) {
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
          name: { $regex: new RegExp(filterOptions.options.globalFilter, "ig") }
        },
        {
          email: {
            $regex: new RegExp(filterOptions.options.globalFilter, "ig")
          }
        }
      ];
    }

    if (filterOptions.options.notInGroup) {
      $match.$and = [
        {
          groups: {
            // eslint-disable-next-line new-cap
            $ne: mongoose.Types.ObjectId(filterOptions.options.notInGroup)
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

    const users = await UserModel.aggregate(resultsQuery);
    const populatedUsers = await UserModel.populate(users, [
      {
        path: "groups"
      },
      {
        path: "projectPolicy",
        populate: {
          path: "projects",
          model: "ProjectPolicy",
          populate: {
            path: "maps",
            model: "MapPolicy"
          }
        }
      },
      {
        path: "iamPolicy"
      }
    ]);
    const totalUsersLength = await UserModel.aggregate(countQuery);
    return {
      items: populatedUsers,
      totalCount: totalUsersLength.length ? totalUsersLength[0].count : 0
    };
  }

  deleteUser(userId) {
    return UserModel.deleteOne({ _id: userId });
  }

  returnUserWithPickedFields(userDocument) {
    return _.pick(userDocument, [
      "_id",
      "name",
      "email",
      "groups",
      "iamPolicy",
      "projectPolicy",
      "createdAt",
      "phoneNumber",
      "changePasswordOnNextLogin"
    ]);
  }
}

const userService = new UserService();

module.exports = userService;
