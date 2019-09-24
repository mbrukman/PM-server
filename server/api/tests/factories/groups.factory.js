const {jsf} = require('./jsf.helper');


function generateSingleSchema(agentsIds) {
    return {
        type: "object",
        properties: {
            _id:{
                type: "string",
                format: "mongoID"
            },
            name: {
                type: "string",
                chance: {
                    word: {}
                }
            },

            agents: agentsIds,

            filters:{
                type: "array",
                items:{
                    type: 'object',
                    properties:{
                        field:{
                            type: "string",
                            chance: {
                                word: {}
                            }
                        },

                        value:{
                            type: "string",
                            chance: {
                                word: {}
                            }
                        },

                        filterType:{
                            type: 'string',
                            enum: [
                                'gte',
                                'gt',
                                'contains',
                                'lte',
                                'lt',
                                'equal'
                            ]
                        }
                    },
                    required: ['field','value','filterType']
                },
                maxItems: 5,
                minItems: 2,
            }
           
        },
        required: ['name','agents','filters','_id']
    }
}

function generateMany(agentsIds) {
    return jsf.generate({
        type: 'array',
        items: generateSingleSchema(agentsIds),
        maxItems: 15,
        minItems: 5,
    })
}

module.exports = {
    generateMany,
    generateOne: (agentsIds) => jsf.generate(generateSingleSchema(agentsIds)),
};
