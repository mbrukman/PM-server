const Map = require("../models/map.model");
const MapStructure = require("../models").Structure;
const Project = require("../models/project.model");
const env = require("../../env/enviroment");

const PAGE_SIZE = env.page_size;


function getMapPlugins(mapStructure) {
    let plugins = new Set();
    mapStructure.processes.forEach(process => {
        plugins.add(process.used_plugin);
    });
    return Array.from(plugins);
}


module.exports = {
    /* archiving maps in ids array */
    archive: (mapsIds) => {
        return Map.update({ _id: { $in: mapsIds } }, { archived: true }, { multi: true })
    },
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
        return Map.remove({ _id: id });
    },

    filter: (query = {}) => {
        mapsId = [];
        let q = {};
        if (query.fields) {
            // This will change the fields in the query to query that we can use with mongoose (using regex for contains)
            Object.keys(query.fields).map(key => { query.fields[key] = { '$regex': `.*${query.fields[key]}.*` }});
            q = query.fields;
        } else if (query.globalFilter) {
            // if there is a global filter, expecting or condition between name and description fields
            q = {
                $or: [
                    { name: { '$regex': `.*${query.globalFilter}.*` } },
                    { description: { '$regex': `.*${query.globalFilter}.*` } }
                ]
            }
        }
        let m = Map.find(q).where({ archived: false });
        if (query.sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            m.sort(query.sort);
        }
        if (query.page) {
            // apply paging. if no paging, return all
            m.limit(PAGE_SIZE).skip((query.page - 1) * PAGE_SIZE);
        }

        

        
        
        return m.then(maps => {
            for(map in maps){
                mapsId.push(maps[map].id)
            }
            // searching project in DB when maps holds an array with a least one element of the mapsId
            let p = Project.find({ maps: { $in: mapsId} })
            p.then(projects => {
                 //looping into maps
                for(map in maps){
                     //looping into projects
                    for(project in projects){
                        if (projects[project].maps.toString().includes(maps[map].id)){
                            maps[map].project.name = projects[project].name;
                            maps[map].project.id = projects[project].id;

                        }
                     }
                 }
             })
             
            return module.exports.count(q).then(r => {
                return { items: maps, totalCount: r }
            });
        });
    },
    filterByQuery(query = {}) {
        return Map.find(query);
    },

    mapDelete: id => {
        return Map.remove({ _id: id });
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

};