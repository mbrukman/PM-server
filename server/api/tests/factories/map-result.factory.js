
// map: { type: Schema.Types.ObjectId, ref: 'Map' },
// structure: { type: Schema.Types.ObjectId, ref: 'MapStructure' },
// configuration: Schema.Types.Mixed,
//     agentsResults: [AgentResultSchema],
//     startTime: { type: Date, index: true },
// finishTime: { type: Date, index: true },
// trigger: String,
//     status: { type: String, enum: [statusEnum.DONE, statusEnum.ERROR, statusEnum.RUNNING, statusEnum.PENDING] },
// reason: String, // e.g. no agents
//     triggerPayload: Schema.Types.Mixed,
//     archivedMap: { type: Boolean, default: false, index: true },
// createdAt:  {type: Date, default: new Date()}

const {jsf} = require('./jsf.helper');

function generateSingleSchema(mapId, maps) {
    return {
        type: 'object',
        properties: {
            reason: {
                type: 'string',
                chance: {
                    word: {
                        length: 5
                    }
                }
            },
            trigger: {
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
        required: ['trigger', 'reason', '_id', 'map'],
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
