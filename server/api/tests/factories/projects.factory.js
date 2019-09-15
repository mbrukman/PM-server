const {jsf} = require('./jsf.helper');

const singleProjectSchema = {
    type: 'object',
    properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        archived: {type: 'boolean'},
        maps: []
    },
    required: ['name', 'description', 'maps'],

};

const arrayProjectSchema = {
    type: 'array',
    items: singleProjectSchema,
    maxItems: 2,
};


function getSimpleMapSchema(name) {
    return {
        type: 'object',
        properties: {
            name
        },
        required: ['name'],
    };
}

module.exports = {
    generateSimpleMaps: (name) => jsf.generate(getSimpleMapSchema(name)),
    generateProjects: () => jsf.generate(arrayProjectSchema),
    generateSingleProject: () => jsf.generate(singleProjectSchema),
};
