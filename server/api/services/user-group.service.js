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
  constructor() { }

  create(groupData) {
    const newUserGroup = new UserGroupModel(groupData);
    return newUserGroup.save();
  }

  filter(filterOptions = {}) {
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

    return UserGroupModel.aggregate(resultsQuery).then(groups => {
      return UserGroupModel.populate(groups, { path: 'users' }).then(groups => {
        return UserGroupModel.aggregate(countQuery).then(r => {
          return { items: groups, totalCount: r.length ? r[0].count : 0 };
        });
      })
    });
  }
}

const userGroupService = new UserGroupService();

module.exports = userGroupService;
