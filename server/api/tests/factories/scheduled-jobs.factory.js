const {jsf} = require('./jsf.helper');

const singleSchema = {
    type: 'object',
    properties: {
        project: {
            type: "string",
            format: "mongoID"
        },
        map: {
            type: "string",
            format: "mongoID"
        },
        type: {
            type: 'string',
            enum: ["once","repeated"]
        },
        datetime:{
            format:"datetime"
        }
    },
    required: ['project', 'map', 'type','datetime'],
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
    generateJobs: (options) => jsf.generate(Object.assign(arraySchema, options)),
    generateSingleJob: (options) => jsf.generate(Object.assign(singleSchema, options))
};
