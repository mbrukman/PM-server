const { jsf } = require('./jsf.helper');

const singleProjectSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string', 
            chance: {
                word: {
                    length: 10
                }
            }
        },
        description: { type: 'string' },
        archived: { type: 'boolean' },
        maps: []
    },
    required: ['name', 'description', 'maps'],

};

const arrayProjectSchema = {
    type: 'array',
    items: singleProjectSchema,
    maxItems: 2,
};

module.exports = {
    generateProjects: () => jsf.generate(arrayProjectSchema),
    generateSingleProject: () => jsf.generate(singleProjectSchema)
};
