const Map = require("../models/map.model");
const MapStructure = require("../models/map-structure.model");
const env = require("../../env/enviroment");

const PAGE_SIZE = env.page_size;


function getMapPlugins(mapStructure) {
    let plugins = new Set();
    mapStructure.processes.forEach(process => {
        plugins.add(process.plugin);
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
        structure.plugins = getMapPlugins(structure);
        return MapStructure.create(structure)
    },
    filter: (query = {}) => {
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
        let m = Map.find(q);
        if (query.sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            m.sort(query.sort);
        }
        if (query.page) {
            // apply paging. if no paging, return all
            m.limit(PAGE_SIZE).skip((query.page - 1) * PAGE_SIZE);
        }

        return m.then(projects => {
            return module.exports.count(q).then(r => {
                return { items: projects, totalCount: r }
            });
        });
    },
    filterByQuery(query = {}) {
        return Map.find(query);
    },
    get: (id) => {
        console.log(id);
        return Map.findOne({ _id: id }).populate('agents')
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
    structureList: (mapId) => {
        return MapStructure.find({ map: mapId }, '_id createdAt', { sort: { createdAt: -1 } })
    },
    update: (mapId, map) => {
        return Map.findByIdAndUpdate(mapId, map, { new: true }).populate('agents')
    },

};