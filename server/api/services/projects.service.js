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
           path:'maps'
       }
       if(!options.isArchived){
           populate.match = {archived:false}
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
            var filterQueryOptions = [
                { name: { '$regex': new RegExp(filterOptions.options.globalFilter,'ig') } },
                { description: { '$regex': new RegExp(filterOptions.options.globalFilter,'ig') } },
            ]
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
        let projects= Project.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(id)
                }
            },
            {
                $project:
                {
                    name: 1,
                    maps: 1
                }
            },
            { "$unwind": "$maps" },
            {
                $lookup:
                {
                    from: "mapResults",
                    let: { mapId: "$maps" },
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
                                trigger: 1
                            }
                        },
                        { $sort: { "startTime": -1 } },
                        { $limit: 1 }
        
                    ],
                    as: "exec"
                }
            },
            {
                $unwind: 
                {
                    "path": "$exec",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup:
                {
                    from: "maps",
                    let: { mapId: "$maps" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and:[
                                    {
                                    $eq: ["$$mapId", "$_id"]
                                },
                                {$ne:["$archived",true]}
                                    ]
                                }
                            }
                        },
                        {
                            $project:
                            {
                                _id:0,
                                name:1
                            }
                        },
        
                    ],
                    as: "map"
                }
            },
            {
                $unwind: 
                {
                    "path": "$map",
                    "preserveNullAndEmptyArrays": false
                }
            },
            {
                $group:
                {
                    _id:"$maps",
                    exec:{$first:"$exec"},
                    project:{$first:"$name"},
                    map:{$first:"$map"}
                }
            },
            {$sort:{"exec.startTime":-1}},
            {$limit:4}
        ])
        return projects.then((projects) => {
            return projects.map((project) => {
                return {
                    _id:project._id,
                    map:project.map,
                    exec:project.exec,
                    project:{name:project.project}
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