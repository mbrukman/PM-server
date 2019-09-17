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
