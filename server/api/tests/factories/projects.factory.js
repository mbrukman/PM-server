const {jsf} = require('./jsf.helper');

const singleSchema = {
    type: 'object',
    properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        archived: {type: 'boolean'},
        maps: []
    },
    required: ['name', 'description', 'maps'],

};

const arraySchema = {
    type: 'array',
    items: singleSchema,
    maxItems: 2,
};

function getSimpleMapSchema(project) {
    return {
        type: 'array',
        items: {
            type: 'object',
            required: ['name', 'project'],
            properties: {
                name: {type: 'string'},
                project
            }
        },
        maxItems: 2,
    };

}

module.exports = {
    generateSimpleMaps: (project) => jsf.generate(getSimpleMapSchema(project)),
    generateProjects: () => jsf.generate(arraySchema),
    generateSingleProject: () => jsf.generate(singleSchema),
};
