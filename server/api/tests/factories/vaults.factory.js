const jsf = require('json-schema-faker');
const chance = require('chance').Chance();

jsf.extend('chance', () => chance);

const schema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            value: {
                $ref: '#/definitions/positiveInt'
            },
            key: {
                type: 'string',
                uniqueItems: true,
                chance: {
                    word: "",
                }
            },
            description: {
                type: 'string',
                faker: 'lorem.paragraph'
            }
        },
        required: ['value', 'key', 'description'],
    },
    maxItems: 2,
    uniqueItems: 'key',
    definitions: {
        positiveInt: {
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true
        }
    }
};

// async (preferred way)
// jsf.resolve(schema)

// sync-version)
module.exports = {
    generateVaults: () => jsf.generate(schema),
}