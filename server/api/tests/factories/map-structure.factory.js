const {jsf} = require('./jsf.helper');

// createdAt: { type: Date, default: Date.now, index:true },
// map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
// content: Schema.Types.Mixed,
//     links: [linkSchema],
//     processes: [processSchema],
//     code: String,
//     configurations: [configurationSchema],
//     used_plugins: [usedPluginsSchema]

function generateSingleSchema(mapId, maps) {
    return {
        type: 'object',
        properties: {
            code: {
                type: 'string',
                chance: {
                    word: {
                        length: 5
                    }
                }
            },
            map: mapId,
            maps,
            _id: {
                "type": "string",
                "format": "mongoID"
            }
        },
        required: ['code', '_id', 'map'],
    };

}

function generateMany(mapId, maps) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(mapId, maps),
        maxItems: 15,
        minItems: 5,
    })
}

function generateOne(mapId, maps) {
    return jsf.generate(generateSingleSchema(mapId, maps));
}

module.exports = {
    generateOne,
    generateMany
};
