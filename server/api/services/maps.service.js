const Map = require("../models/map.model");
const { MapStructure } = require("../models");
const MapTrigger = require("../models/map-trigger.model");
const MapResult = require("../models").MapResult;
const { Project } = require("../models");
const shared = require("../shared/recents-maps");
const mongoose = require("mongoose");

function getMapPlugins(mapStructure) {
  let plugins = new Set();
  mapStructure.processes.forEach(process => {
    plugins.add(process.used_plugin);
  });
  return Array.from(plugins);
}

function getSort(sortString) {
  var sort = {};
  if (sortString[0] === "-") sort[sortString.slice(1)] = -1;
  else sort[sortString] = 1;

  return sort;
}

module.exports = {
  /* count how many documents exist for a certain query */
  count: filter => {
    return Map.count(filter);
  },
  /* creating a new map */
  create: map => {
    return Map.create(map);
  },
  /* Create a map structure*/
  createStructure: structure => {
    structure.used_plugins = getMapPlugins(structure);
    return MapStructure.create(structure);
  },

  mapDelete: id => {
    return Promise.all([
      Project.findOne({ maps: { $in: [id] } })
        .select("maps")
        .then(project => {
          for (let i = 0, length = project.maps.length; i < length; i++) {
            if (project.maps[i] == id) {
              project.maps.splice(i, 1);
              break;
            }
          }

          return project.save();
        }),
      MapResult.deleteMany({ map: id }),
      MapStructure.deleteMany({ map: id }),
      MapTrigger.deleteMany({ map: id }),
      Map.deleteMany({ _id: id })
    ]);
  },

  filter: (filterOptions = {}) => {
    mapsId = [];
    let fields = filterOptions.fields;
    let sort = filterOptions.options.sort || "name";
    let page = Number(filterOptions.options.page);
    if (fields) {
      // This will change the fields in the filterOptions to filterOptions that we can use with mongoose (using regex for contains)
      Object.keys(fields).map(key => {
        fields[key] = { $regex: `.*${fields[key]}.*` };
      });
    }

    var $match = {};
    if (
      !(
        filterOptions.options.isArchived == true ||
        filterOptions.options.isArchived == "true"
      )
    )
      $match.archived = false;
    if (filterOptions.options.globalFilter) {
      $match.$or = [
        {
          name: { $regex: new RegExp(filterOptions.options.globalFilter, "ig") }
        },
        {
          description: {
            $regex: new RegExp(filterOptions.options.globalFilter, "ig")
          }
        }
      ];
    }
    let projectLookup;
    if (
      filterOptions.options.filter &&
      filterOptions.options.filter.projectId
    ) {
      projectLookup = {
        $and: [
          {
            $eq: [
              "$_id",
              mongoose.Types.ObjectId(filterOptions.options.filter.projectId)
            ]
          },
          { $in: ["$$mapId", "$maps"] }
        ]
      };
    } else {
      projectLookup = { $in: ["$$mapId", "$maps"] };
    }

    let aggregateSteps = [
      {
        $match: $match
      },
      {
        $lookup: {
          from: "projects",
          let: { mapId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: projectLookup
              }
            },
            {
              $project: {
                name: 1
              }
            }
          ],
          as: "project"
        }
      },
      {
        $unwind: "$project"
      },
      {
        $lookup: {
          from: "mapResults",
          let: { mapId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$mapId", "$map"]
                }
              }
            },
            {
              $sort: {
                finishTime: -1
              }
            },
            {
              $limit: 1
            },
            {
              $project: {
                finishTime: 1
              }
            }
          ],
          as: "latestExectionResult"
        }
      }
    ];
    const pageSize = parseInt(process.env.PAGE_SIZE, 10);
    let resultsQuery = [
      ...aggregateSteps,
      { $sort: getSort(sort) },
      { $skip: page ? (page - 1) * pageSize : 0 },
      { $limit: filterOptions.options.limit || pageSize },
      { $unwind: "$project" },
      {
        $unwind: {
          path: "$latestExectionResult",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    let countQuery = [
      ...aggregateSteps,
      {
        $count: "count"
      }
    ];

    return Map.aggregate(resultsQuery).then(maps => {
      for (let i = 0, mapsLength = maps.length; i < mapsLength; i++) {
        maps[i].id = maps[i]._id;
        maps[i].project.id = maps[i].project._id;
        delete maps[i]._id;
        delete maps[i].project._id;
      }
      return Map.aggregate(countQuery).then(r => {
        return { items: maps, totalCount: r.length ? r[0].count : 0 };
      });
    });
  },
  filterByQuery(query = {}) {
    return Map.find(query);
  },

  generateMap(map) {
    return Map.create({ name: map.name, project: map.project }).then(newMap =>
      MapStructure.create({
        map: newMap._id,
        processes: map.processes,
        links: map.links,
        used_plugins: map.used_plugins
      })
    );
    // TODO: TBD - should add to project?
  },
  get: id => {
    return Map.findOne({ _id: id }).populate("agents groups");
  },
  /* get map structure. if structure id is not defined, get the latest */
  getMapStructure: (mapId, structureId) => {
    if (structureId) {
      return MapStructure.findById(structureId);
    }

    return MapStructure.findOne({ map: mapId })
      .sort("-createdAt")
      .then(res => {
        return res;
      });
  },

  structureList: (mapId, page) => {
    const load_Structures = 25;
    if (page) {
      let index = page * load_Structures - load_Structures;
      return MapStructure.find({ map: mapId }, "_id createdAt", {
        sort: { createdAt: -1 }
      })
        .skip(index)
        .limit(load_Structures);
    } else {
      return MapStructure.find({ map: mapId }, "_id createdAt", {
        sort: { createdAt: -1 }
      });
    }
  },

  update: (mapId, map) => {
    delete map.updatedAt;
    return Map.findByIdAndUpdate(mapId, map, { new: true }).populate("agents");
  },

  recentMaps: () => {
    return shared.recentsMaps(4, ["startTime", "trigger"]);
  },

  /**
   * returns an array of the maps configurations
   */
  getMapConfigurations: async structureId => {
    let item = await MapStructure.find(
      { _id: structureId },
      { configurations: 1 }
    );
    return Promise.resolve(item[0].configurations.toBSON());
  },

  /**
   * returns an array of the executions results
   * @param {Number} amount - the aount of results to return
   */
  getMapExecutions: (amount, mapId) => {
    return MapResult.find({ map: mapId })
      .sort("-createdAt")
      .limit(amount);
  },

  /**
   *  returns the latest map and map structure
   */
  getMap: async mapId => {
    let structure = await MapStructure.findOne({ map: mapId }).sort(
      "-createdAt"
    );
    let map = await Map.findById(mapId);
    return Promise.resolve({
      map: map.toJSON(),
      structure: structure.toJSON()
    });
  }
};
