const Project = require("../models/project.model");
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
    detail: (projectId,options) => {
        
        let populate = {
            path:'maps'
        }
        if(!options.isArchived){
            populate.match={archived:false}
        }
        return Project.findById(projectId).populate(populate)
    },

    /* delete a project */
    delete: (projectId) => {
        return Project.remove({ _id: projectId })
    },

    /* filter projects */
    filter: (filterOptions = {}) => {
        let q = {};
        if (filterOptions.fields) {
            // This will change the fields in the filterOptions to filterOptions that we can use with mongoose (using regex for contains)
            Object.keys(filterOptions.fields).map(key => { filterOptions.fields[key] = { '$regex': `.*${filterOptions.fields[key]}.*` }});
            q = filterOptions.fields;
        } else if (filterOptions.globalFilter) {
            // if there is a global filter, expecting or condition between name and description fields
            q = {
                $or: [{ name: { '$regex': `.*${filterOptions.globalFilter}.*` } }, { description: { '$regex': `.*${filterOptions.globalFilter}.*` } }]
            }
        }
        
        let p;
        if(filterOptions.options.isArchived){
            p = Project.find(q);
        }
        else{
            p = Project.find(q).where({archived:false});
        }

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