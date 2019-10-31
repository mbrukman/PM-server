const User = require("../models/user.model");

function getSort(sortString) {
  const sort = {};
  if (sortString[0] === "-") sort[sortString.slice(1)] = -1;
  else sort[sortString] = 1;

  return sort;
}

module.exports = {
  filter: (filterOptions = {}) => {
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

    return User.aggregate(resultsQuery).then(users => {
      return User.aggregate(countQuery).then(r => {
        return { items: users, totalCount: r.length ? r[0].count : 0 };
      });
    });
  }
};
