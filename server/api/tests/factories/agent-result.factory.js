const {jsf} = require('./jsf.helper');
const processResultFactory = require('./process-result.factory');


function generateSingleSchema({agentId, actionId, processId}) {
    const processes = processResultFactory.generateMany({actionId, processId});

    return {
        type: "object",
        properties: {
            processes,
            agent: agentId
        },
        required: ['processes', 'agent']
    }
}

function generateMany(idsCollection) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(idsCollection),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: generateSingleSchema,
};
