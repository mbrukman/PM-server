const Project = require("../models/project.model");
const mapsService = require("./maps.service");
const env = require("../../env/enviroment");

const PAGE_SIZE = env.page_size;

module.exports = {
    /* archive project and maps */
    archive: (projectId) => {
        return Project.findByIdAndUpdate(projectId, { archived: true }).then(project => {
            return mapsService.archive(project.maps);
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
    detail: (req) => {
        if(req.body.isArchived){
            return Project.findById(req.params.id).populate(
                {
                    path: 'maps'
                })
        }
        else{
            return Project.findById(req.params.id).populate(
                {
                    path: 'maps',
                    match:{archived:false}
                })
        }
        
        
    },

    /* delete a project */
    delete: (projectId) => {
        return Project.remove({ _id: projectId })
    },

    /* filter projects */
    filter: (body = {}) => {
        let q = {};
        if (body.fields) {
            // This will change the fields in the body to body that we can use with mongoose (using regex for contains)
            Object.keys(body.fields).map(key => { body.fields[key] = { '$regex': `.*${body.fields[key]}.*` }});
            q = body.fields;
        } else if (body.globalFilter) {
            // if there is a global filter, expecting or condition between name and description fields
            q = {
                $or: [{ name: { '$regex': `.*${body.globalFilter}.*` } }, { description: { '$regex': `.*${body.globalFilter}.*` } }]
            }
        }
        
        let p;
        if(body.options.isArchived){
            p = Project.find(q);
        }
        else{
            p = Project.find(q).where({archived:false});
        }

        if (body.sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            p.sort(body.sort)
        }
        if (body.page) {
            // apply paging. if no paging, return all
            p.limit(PAGE_SIZE).skip((body.page - 1) * PAGE_SIZE)
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

    }

};