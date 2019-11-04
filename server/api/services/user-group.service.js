const UserGroupModel = require("../models/user-group.model");

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

  async filter(filterOptions = {}) {
    const fields = filterOptions.fields;
    const sort = filterOptions.options.sort || "name";
    const page = Number(filterOptions.options.page);
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

    try {
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
      return err;
    }
  }
}

const userGroupService = new UserGroupService();

module.exports = userGroupService;