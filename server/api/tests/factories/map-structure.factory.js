const { jsf } = require('./jsf.helper');

// createdAt: { type: Date, default: Date.now, index:true },
// map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
// content: Schema.Types.Mixed,
//     links: [linkSchema],
//     processes: [processSchema],
//     code: String,
//     configurations: [configurationSchema],
//     used_plugins: [usedPluginsSchema]

const singleSchema = {
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
        _id: {
            "type": "string",
            "format": "mongoID"
        }
    },
    required: ['code', '_id'],
    definitions: {
        positiveInt: {
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true
        }
    }
};

const arraySchema = {
    type: 'array',
    items: singleSchema,
    maxItems: 15,
    minItems: 5,
};

module.exports = {
    generateOne: () => jsf.generate(singleSchema),
    generateMany: () => jsf.generate(arraySchema)
};
