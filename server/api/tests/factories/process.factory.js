// name: String,
//     description: String,
//     order: Number,
//     default_execution: Boolean,
//     preRun: String,
//     postRun: String,
//     filterAgents: String,
//     coordination: String,
//     flowControl: { type: String, enum: ['race', 'each', 'wait'], default: 'each' },
// actionsExecution: { type: String, enum: ['series', 'parallel'], default: 'series' },
// correlateAgents: { type: Boolean, default: false },
// mandatory: { type: Boolean, default: false },
// condition: String,
//     createdAt: { type: Date, default: Date.now },
// used_plugin: usedPluginsSchema,
//     actions: [actionSchema],
//     uuid: String,
//     numProcessParallel:String

const {jsf} = require('./jsf.helper');

function generateSingleSchema(usedPlugins) {
    return {
        type: "object",
        properties: {
            used_plugins: usedPlugins,
            uuid: {
                type: "string",
                chance: {
                    uuid: {}
                }
            },
            name: {
                type: "string",
                chance: {
                    word: {}
                }
            },
            description: {
                type: "string",
                chance: {
                    paragraph: {
                        length: 1
                    }
                }
            },
            default_execution: {
                type: "boolean",
                chance: {
                    bool: {
                        likelihood: 30
                    }
                }
            },
            order: {
                type: 'number',
                chance: {
                    integer: {}
                }
            },
        },
        required: ['order', 'default_execution', 'description', 'name', 'uuid', 'used_plugins']
    }
}

function generateMany(usedPlugins) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(usedPlugins),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: generateSingleSchema,
};
