const { jsf } = require('./jsf.helper');

jsf.option({
    useDefaultValue: true,
    useExamplesValue: true,
});

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
            examples: ["server", "executer", "trigger", "module"]
        },
        main: {
            type: 'string',
            default: 'main.js'
        },
        execProgram: {
            type: 'string',
            chance: {
                word: {
                    length: 10
                }
            }
        },
        version: {
            type: 'string',
            default: '1.0.0'
        },
        file: {
            type: 'string',
            chance: {
                word: {
                    length: 10
                }
            }
        },
        methods: {
            type: 'array',
            default: [
                {
                    name: 'testMethod',
                    params: []
                }
            ]
        },
        settings: {
            type: 'array',
            default: [
                {
                    name: 'testName1',
                    value: 'testvalue1'
                },
                {
                    name: 'testName2',
                    value: 'testvalue2'
                }
            ]
        },
    },
    required: ['_id', 'name', 'main', 'execProgram', 'version', 'file', 'methods', 'settings', 'type']
};

const pluginListSchema = {
    type: 'array',
    items: pluginSchema,
    maxItems: 9,
    minItems: 3
};

module.exports = {
    generateMany: (options) => jsf.generate(Object.assign(pluginListSchema, options)),
    generatePluginDocument: (options) => jsf.generate(Object.assign(pluginSchema, options))
};
