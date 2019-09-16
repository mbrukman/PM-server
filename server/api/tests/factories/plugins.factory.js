const { jsf } = require('./jsf.helper');

jsf.option({
    useDefaultValue: true,
});

/*
let pluginSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["server", "executer", "trigger", "module"], required: true },
    description: String,
    main: { type: String, required: true },
    execProgram: { type: String, required: true },
    active: { type: Boolean, default: true },
    version: { type: String, required: true },
    imgUrl: String,
    methods: [pluginMethodSchema],
    settings:[pluginSettingsSchema],
    file: { type: String, required: true }
});
*/

const pluginSchema = {
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
        },
        type: {
            type: 'string',
            chance: {
                pickone: [
                    ["server", "executer", "trigger", "module"]
                ]
            }
        },
        main: {
            type: 'string',
            default: 'main.js'
        },
        execProgram: {
            type: 'string'
        },
        version: {
            type: 'string'
        },
        file: {
            type: 'string'
        },
    },
    required: ['_id', 'name', 'type', 'main', 'execProgram', 'version', 'file']
};

const pluginListSchema = {
    type: 'array',
    items: pluginSchema,
    maxItems: 9,
    minItems: 3
};

module.exports = {
    generatePluginCollection: (options) => jsf.generate(Object.assign(pluginListSchema, options)),
    generatePluginDocument: (options) => jsf.generate(Object.assign(pluginSchema, options))
};