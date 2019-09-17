const { jsf } = require('./jsf.helper');
const MapModel = require("../../models/map.model");
const ProjectModel = require('../../models/project.model');

function getSimpleMapSchema(name) {
    return {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                format: 'mongoID'
            },
            name: {
                type: 'string',
                chance: {
                    word: {
                        length: 10
                    }
                }
            }
        },
        required: ['_id', 'name'],
    };
}

function generateSimpleMap(name) {
    return jsf.generate(getSimpleMapSchema(name));
}

async function createMap(projectId, index, mapName) {
    const generatedMap = generateSimpleMap(mapName);
    try {
        const map = await MapModel.create(generatedMap);
        await ProjectModel.findByIdAndUpdate({ _id: projectId }, { $push: { maps: map.id } });
        return map;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    createMap,
    generateSimpleMap: generateSimpleMap
};
