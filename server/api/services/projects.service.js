const Project = require("../models/project.model");
const mapsService = require("./maps.service");
const env = require("../../env/enviroment");

const PAGE_SIZE = env.page_size;

module.exports = {
    /* archive project and maps */
    archive: (projectId, isArchive) => {   
        return Project.findByIdAndUpdate(projectId, { archived: isArchive }).then(project => {
            return mapsService.archive(project.maps, isArchive);
        });
    },
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
    detail: (projectId) => {
        return Project.findById(projectId).populate(
            {
                path: 'maps',
                match: { archived: false }
            })
    },

    /* delete a project */
    delete: (projectId) => {
        return Project.remove({ _id: projectId })
    },

    /* filter projects */
    filter: (query = {}) => {
        let q = {};
        if (query.fields) {
            // This will change the fields in the query to query that we can use with mongoose (using regex for contains)
            Object.keys(query.fields).map(key => { query.fields[key] = { '$regex': `.*${query.fields[key]}.*` }});
            q = query.fields;
        } else if (query.globalFilter) {
            // if there is a global filter, expecting or condition between name and description fields
            q = {
                $or: [{ name: { '$regex': `.*${query.globalFilter}.*` } }, { description: { '$regex': `.*${query.globalFilter}.*` } }]
            }
        }
        if (!query.archived) {
            q.archived = false;
        }
        let p = Project.find(q);
        if (query.sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            p.sort(query.sort)
        }
        if (query.page) {
            // apply paging. if no paging, return all
            p.limit(PAGE_SIZE).skip((query.page - 1) * PAGE_SIZE)
        }

        return p.then(projects => {
            return module.exports.count(q).then(r => {
                return { items: projects, totalCount: r }
            });
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
    getProjectNamesByMapsIds : (mapsIds) => {
        return Project.find({ maps: { $in: mapsIds} },{_id:1,name:1, maps:1})
    }

};