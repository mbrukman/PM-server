const {jsf} = require('./jsf.helper');
const MapModel = require("../../models/map.model");
const ProjectModel = require('../../models/project.model');

function getSimpleMapSchema(name) {
    return {
        type: 'object',
        properties: {
            name
        },
        required: ['name'],
    };
}

function generateSimpleMaps(name) {
    return jsf.generate(getSimpleMapSchema(name));
}

async function createMap(projectId, index, mapName) {
    const generatedMap = generateSimpleMaps(mapName);
    try {
        const map = await MapModel.create(generatedMap);
        await ProjectModel.findByIdAndUpdate({_id: projectId}, {$push: {maps: map.id}});
        return map;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    createMap,
    generateSimpleMaps
};
