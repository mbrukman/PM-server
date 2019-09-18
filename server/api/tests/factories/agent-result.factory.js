const {jsf} = require('./jsf.helper');
const processFactory = require('./process.factory');


function generateSingleSchema(agentId, processes) {
    if(!processes) processes = processFactory.generateMany();
    return {
        type: "object",
        properties: {
            processes,
            agent: agentId
        },
        required: ['processes', 'agentId']
    }
}

function generateMany(agentId, processes) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(agentId, processes),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: generateSingleSchema,
};
