const {jsf} = require('./jsf.helper');

const singleSchema = {
    type: 'object',
    properties: {
        value: {
            type: 'string',
        },
        _id: {
            "type": "string",
            "format": "mongoID"
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
    required: ['value', 'key', 'description', '_id'],
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
    maxItems: 10,
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
    generateVaults: (options) => jsf.generate(Object.assign(arraySchema, options)),
    generateSingleVault: (options) => jsf.generate(Object.assign(singleSchema, options))
};
