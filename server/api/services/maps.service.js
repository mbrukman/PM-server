const Map = require("../models/map.model");
const MapStructure = require("../models").Structure;
const Plugin = require("../models").Plugin;
const env = require("../../env/enviroment");
const MapExecutionLog = require("../models/map-execution-log.model")
const MapTrigger = require("../models/map-trigger.model")
const MapResult = require("../models/map-results.model")
const Project = require("../models/project.model")
const proejctServise = require("./projects.service")
const PAGE_SIZE = env.page_size;


function getMapPlugins(mapStructure) {
    let plugins = new Set();
    mapStructure.processes.forEach(process => {
        plugins.add(process.used_plugin);
    });
    return Array.from(plugins);
}



function getSort(sortString) {
    var sort = {}
    if (sortString[0] == '-')
        sort[sortString.slice(1)] = -1;
    else
        sort[sortString] = 1;

    return sort;
}


module.exports = {
    /* count how many documents exist for a certain query */
    count: (filter) => {
        return Map.count(filter)
    },
    /* creating a new map */
    create: (map) => {
        return Map.create(map)
    },
    /* Create a map structure*/
    createStructure: (structure) => {
        structure.used_plugins = getMapPlugins(structure);
        return MapStructure.create(structure)
    },

    mapDelete: id => {
        return Promise.all([
            Project.findOne({ maps: { $in: [id] } }).select('maps').then(project => {
                for (let i = 0, length = project.maps.length; i < length; i++) {
                    if (project.maps[i] == id) {
                        project.maps.splice(i, 1);
                        break;
                    }
                }

                return project.save();
            }),
            MapExecutionLog.remove({ map: id }),
            MapResult.remove({ map: id }),
            MapStructure.remove({ map: id }),
            MapTrigger.remove({ map: id }),
            Map.remove({ _id: id })
        ]);
    },

    filter: (filterOptions = {}) => {
        mapsId = [];
        let q = {};
        let fields = filterOptions.fields
        let sort = filterOptions.options.sort || 'name'
        let page = filterOptions.page
        if (fields) {
            // This will change the fields in the filterOptions to filterOptions that we can use with mongoose (using regex for contains)
            Object.keys(fields).map(key => { fields[key] = { '$regex': `.*${fields[key]}.*` } });
            q = fields;
        }

        var $match = {};
        if (filterOptions.options.isArchived !== true)
            $match.archived = false;
        if (filterOptions.options.globalFilter) {
            $match.$or = [
                { name: { '$regex': `.*${filterOptions.options.globalFilter}.*` } },
                { description: { '$regex': `.*${filterOptions.options.globalFilter}.*` } }
            ]
        }

        let m = Map.aggregate([
            {
                $match: $match
            },
            {
                $lookup:
                {
                    from: "projects",
                    let: { mapId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$$mapId", "$maps"]
                                }
                            }
                        },
                        {
                            $project:
                            {
                                name: 1
                            }
                        }
                    ],
                    as: "project"
                },
            },
            {
                $lookup:
                {
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
                            $limit: 1
                        },
                        {
                            $sort: {
                                '-finishTime': 1
                            }
                        },
                        {
                            $project:
                            {
                                finishTime: 1
                            }
                        }

                    ],
                    as: "latestExectionResult",
                },
            },
            { $sort: getSort(sort) },
            { $skip: page ? ((page - 1) * PAGE_SIZE) : 0 },
            { $limit: filterOptions.options.limit || PAGE_SIZE },
            { $unwind: '$project' },
            {
                $unwind: {
                    "path": "$latestExectionResult",
                    "preserveNullAndEmptyArrays": true
                }
            }
        ])

        return m.then(maps => {
            for (let i = 0, mapsLength = maps.length; i < mapsLength; i++) {
                maps[i].id = maps[i]._id;
                maps[i].project.id = maps[i].project._id;
                delete maps[i]._id;
                delete maps[i].project._id;
            }
            return module.exports.count(q).then(r => {
                return { items: maps, totalCount: r }
            });
        });
    },
    filterByQuery(query = {}) {
        return Map.find(query);
    },

    generateMap(map) {
        return Map
            .create({ name: map.name, project: map.project })
            .then((newMap) =>
                MapStructure
                    .create({
                        map: newMap._id,
                        processes: map.processes,
                        links: map.links,
                        used_plugins: map.used_plugins
                    }));
        // TODO: TBD - should add to project?
    },
    get: (id) => {
        return Map.findOne({ _id: id }).populate('agents groups')
    },
    /* get map structure. if structure id is not defined, get the latest */
    getMapStructure: (mapId, structureId) => {
        if (structureId) {
            return MapStructure.findById(structureId)
        }
        return MapStructure.find({ map: mapId }).then((structures) => {
            return structures.pop();
        })
    },
    structureList: (mapId, page) => {
        if (!page) {
            return MapStructure.find({ map: mapId }, '_id createdAt', { sort: { createdAt: -1 } })
        }
        return MapStructure.find({ map: mapId }, '_id createdAt', { sort: { createdAt: -1 } }).limit(20).skip((page - 1) * 20)
    },
    update: (mapId, map) => {
        delete map.updatedAt;
        return Map.findByIdAndUpdate(mapId, map, { new: true }).populate('agents')
    },

    recentMaps:()=>{
        
    return Map.aggregate([
        {
            $lookup:
            {
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
                        $project:
                        {
                            startTime: 1,
                            trigger:1,
                            id : "$_id"
                        }
                    },
                    {$sort : {startTime :-1}},
                    {$limit : 1}
                  
                    
                ],
                    
                as: "exec"
            },
           
        },
         {$sort : {'exec.startTime' :-1, updatedTime : -1}},
    
         
         {
                    $lookup:
                    {
                        from: "projects",
                        let: { mapId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$$mapId", "$maps"]
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    name: 1,
                                    id : "$_id"
                                }
                            }
                        ],
                        as: "project"
                    },
                },
                   {$limit : 4},
                   { $unwind : "$project" },
                   {  $unwind: {"path": "$exec", "preserveNullAndEmptyArrays": true}}
         
         
        ])

     

    }

};