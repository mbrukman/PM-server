const Map = require("../models/map.model");
const MapStructure = require("../models").Structure;
const Plugin = require("../models").Plugin;
const env = require("../../env/enviroment");
const MapExecutionLog = require("../models/map-execution-log.model")
const MapTrigger = require("../models/map-trigger.model")
const MapResult = require("../models/map-results.model")
const Project = require("../models/project.model")

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
    archive: (mapsIds, isArchive) => {
        return Map.update({ _id: { $in: mapsIds } }, { archived: isArchive }, { multi: true })
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
        return Promise.all([
            Project.findOne({maps:{$in:[id]}}).select('maps').then(project=>{
                for(let i=0, length=project.maps.length; i<length; i++){
                    if(project.maps[i]==id){
                        project.maps.splice(i,1);
                        break;
                    }
                }

                return project.save();
            }),
            MapExecutionLog.remove({map:id}),
            MapResult.remove({map:id}),
            MapStructure.remove({map:id}),
            MapTrigger.remove({map:id}),
            Map.remove({ _id: id })
        ]);
    },

    filter: (body = {}) => {
        mapsId = [];
        let q = {};
        let fields = body.fields
        let sort = body.options.sort
        let page = body.page
        if (fields) {
            // This will change the fields in the body to body that we can use with mongoose (using regex for contains)
            Object.keys(fields).map(key => { fields[key] = { '$regex': `.*${fields[key]}.*` }});
            q = fields;
        } else if (body.options.globalFilter!=undefined) {
            // if there is a global filter, expecting or condition between name and description fields
            q = {
                $or: [
                    { name: { '$regex': `.*${body.options.globalFilter}.*` } },
                    { description: { '$regex': `.*${body.options.globalFilter}.*` } }
                ]
            }
        }
        let m;
        if(body.options.isArchived){
            m = Map.find(q);
        }
        else{
            m = Map.find(q).where({archived:false});
        }
        
        if (sort) {
            // apply sorting by field name. for reverse, should pass with '-'.
            m.sort(sort);
        }
        if (page) {
            // apply paging. if no paging, return all
            m.limit(PAGE_SIZE).skip((page - 1) * PAGE_SIZE);
        }
        return m.then(maps => {
            let mapsId = maps.map(map=> map.id);
            // searching project in DB when maps holds an array with a least one element of the mapsId
            return {maps, mapsId};
        }).then(({maps,mapsId}) => {
            return Project.find({ maps: { $in: mapsId} },{_id:1,name:1, maps:1})
            .then(projects=>{
                return {maps, projects}
            })
        }).then(({maps, projects})=>{
            return Promise.all(maps.map(map=>{
                for(let j=0, projectsLength = projects.length; j<projectsLength; j++){
                    if (projects[j].maps.toString().includes(map.id)){
                        map= map.toJSON();
                        map.project = projects[j];
                        break;
                   }
                }
                return MapResult.findOne({map : map.id}).sort('-finishTime').select('finishTime').then(result=>{
                    map.latestExectionResult = result;
                    return map;
                })
            }))
        }).then(maps => {
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

};