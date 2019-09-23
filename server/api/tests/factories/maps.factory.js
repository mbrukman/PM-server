const { jsf } = require('./jsf.helper');
const MapModel = require("../../models/map.model");
const ProjectModel = require('../../models/project.model');

function getSimpleMapSchema() {
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

function generateSimpleMap() {
    return jsf.generate(getSimpleMapSchema());
}

async function createMap(projectId, index, mapName) {
    const generatedMap = generateSimpleMap();
    generatedMap.name = mapName;
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
