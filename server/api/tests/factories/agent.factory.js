const {jsf} = require('./jsf.helper');


function generateSingleSchema() {
    return {
        type: "object",
        properties: {
            name: {
                type: "string",
                chance: {
                    word: {}
                }
            },
            url: {
                type: "string",
                chance: {
                    url: {}
                }
            },
            publicUrl: {
                type: "string",
                chance: {
                    url: {}
                }
            },
            key: {
                type: "string",
                chance: {
                    guid: {}
                }
            }
        },
        required: ['key', 'publicUrl', 'url', 'name']
    }
}

function generateMany() {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: () => jsf.generate(generateSingleSchema()),
};
