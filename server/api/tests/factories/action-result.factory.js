const {jsf} = require('./jsf.helper');


function generateSingleSchema(action) {
    return {
        type: "object",
        properties: {
            action,
            result: {
                type: "string",
                chance: {
                    word: {}
                }
            },
            status: {
                type: 'string',
                enum: [
                    'running',
                    'done',
                    'pending',
                    'error',
                    'stopped',
                    'canceled',
                    'success'
                ]
            },
            retriesLeft: {
                type: "number",
                chance: {
                    integer: {}
                }
            },
            startTime: {
                format: "date-time",
                type: "string",
                // type: "date",
                // chance: {
                //     date: {}
                // }
            },
            endTime: {
                // type: "date",
                format: "date-time",
                type: "string",
                // chance: {
                //     date: {}
                // }
            },
        },
        required: ['status', 'retriesLeft', 'startTime', 'endTime', 'action', 'result']
    }
}

function generateMany(action) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(action),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: generateSingleSchema,
};
