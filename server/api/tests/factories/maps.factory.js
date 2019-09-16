const {jsf} = require('./jsf.helper');

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
};
