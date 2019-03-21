const mongoose = require('mongoose');
const Project = require("../models/project.model");
const Map = require("../models/map.model");
const env = require("../../env/enviroment");

const PAGE_SIZE = env.page_size;

module.exports = {
    count: (filter) => {
        return Project.count(filter)
    },
    /* add a new project */
    create: (project) => {
        return Project.create(project)
    },

    /* add a map to project */
    addMap: (projectId, mapId) => {
        return Project.update({ _id: projectId }, { $push: { maps: mapId } });
    },

    /* get project details */
    detail: (projectId, options) => {

        let populate = {
            path: 'maps'
        }
        if (!options.isArchived) {
            populate.match = { archived: false }
        }
        return Project.findById(projectId).populate(populate)
    },

    /* delete a project */
    delete: (projectId) => {
        return Project.remove({ _id: projectId })
    },

    /* filter projects */
    filter: (filterOptions = {}) => {
        let q = filterOptions.options.filter || {};
        if (filterOptions.fields) {
            // This will change the fields in the filterOptions to filterOptions that we can use with mongoose (using regex for contains)
            Object.keys(filterOptions.fields).map(key => { filterOptions.fields[key] = { '$regex': `.*${filterOptions.fields[key]}.*` } });
            q = filterOptions.fields;
        }

        if (filterOptions.options.globalFilter) {
            var filterQueryOptions = [{ name: { '$regex': `.*${filterOptions.options.globalFilter}.*` } }, { description: { '$regex': `.*${filterOptions.options.globalFilter}.*` } }]
            q.$or = filterQueryOptions;
        }

        if (!filterOptions.options.isArchived) {
            q.archived = false
        }
        let p = Project.find(q)

        if (filterOptions.options.sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            p.sort(filterOptions.options.sort)
        }
        if (filterOptions.page) {
            var pageSize = filterOptions.options.limit || PAGE_SIZE;
            // apply paging. if no paging, return all
            p.limit(pageSize).skip((filterOptions.page - 1) * pageSize)
        }

        return p.then(projects => {
            return module.exports.count(q).then(r => {
                return { items: projects, totalCount: r }
            });
        })
    },


    filterRecentMaps: (id) => {
        let maps= Map.aggregate([
            {
                $lookup:
                {
                    from: "projects",
                    let: { mapId: "$_id" },
                    pipeline: [
                        {
                            $match: 
                            {
                                $expr:
                                {
                                     $and:
                                    [
                                        {$ne :["$archived", true]},
                                        {$eq:["$_id",mongoose.Types.ObjectId(id)]},
                                        {$in: ["$$mapId","$maps"]}
                                    ]
                                }       
                            }
                        },
                        {
                            $project:
                            {
                                name: 1,
                                _id:0,
                            }
                        }
                    ],
                    as: "project"
                }
            },
            {
                $unwind: {
                    "path": "$project",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $match:
                {
                    archived:false
                }
            },
            {
                $project:
                {
                    name:1,
                    project:1,
                    
                }
            },
            {
                $match:
                {
                     project:{$exists:true}
                }
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
                                    $eq: ["$$mapId","$map"]
                                }
                            }
                        },
                        {
                            $project:
                            {
                                startTime: 1,
                                trigger:1
                            }
                        },
                        {$sort:{"startTime":-1}},
                        {$limit:1}
                     
                    ],
                    as: "exec"
                }
            },
            {
                $unwind: {
                    "path": "$exec",
                    "preserveNullAndEmptyArrays": true
                }
            },
            { $sort: { "exec.startTime": -1 } },
            {$limit:4}
        ])
        return maps.then((mapsQuery) => {
            return mapsQuery.map((map) => {
                return {
                    _id:map._id,
                    map:{name:map.name},
                    exec:map.exec,
                    project:map.project
                }
            })
        })
    },

    /* update a project */
    update: (project) => {
        return Project.findByIdAndUpdate(project._id, project)
    },
    /* Updating the maps list of the project.
     */
    updateMap: (mapId, projectId) => {
        return Project.update({ maps: mapId }, { $pull: { maps: mapId } }) // remove the map from all
            .then(projects => {
                return module.exports.addMap(projectId, mapId); // add map to the selected project
            });

    },
    getProjectNamesByMapsIds: (mapsIds) => {
        return Project.find({ maps: { $in: mapsIds } }, { _id: 1, name: 1, maps: 1 })
    }

};