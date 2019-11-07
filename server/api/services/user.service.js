const User = require("../models/user.model");
const crypto = require("crypto");
const serverKey = process.env.SERVER_KEY;

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
  hashPassword(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
  }

  createUser(userData) {
    const user = new User(userData);
    user.password = this.hashPassword(user.password, serverKey);
    return user.save();
  }

  getUser(userId) {
    return User.findOne({ _id: userId });
  }

  updateUser(userId, newUserData) {
    if (newUserData.password) {
      newUserData.password = this.hashPassword(newUserData.password, serverKey);
    }
    return User.findOneAndUpdate({ _id: userId }, newUserData, {
      runValidators: true,
      new: true
    });
  }

  filter(filterOptions = {}) {
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

    return User.aggregate(resultsQuery).then(users => {
      return User.aggregate(countQuery).then(r => {
        return { items: users, totalCount: r.length ? r[0].count : 0 };
      });
    });
  }

  deleteUser(userId) {
    return User.deleteOne({ _id: userId });
  }
}

const userService = new UserService();

module.exports = userService;
