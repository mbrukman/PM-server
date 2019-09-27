const {jsf} = require('./jsf.helper');
const agentResultsFactory = require('./agent-result.factory');

function generateSingleSchema({
  mapId,
  agentId,
  actionId,
  processId,
  mapStructureId,
}) {
  const agentsResults = agentResultsFactory.generateMany({
    agentId,
    actionId,
    processId,
  });

  return {
    type: 'object',
    properties: {
      structure: mapStructureId,
      status: {
        type: 'string',
        enum: ['running', 'done', 'pending', 'error'],
      },
      reason: {
        type: 'string',
        chance: {
          word: {
            length: 5,
          },
        },
      },
      trigger: {
        type: 'string',
        chance: {
          word: {
            length: 5,
          },
        },
      },
      map: mapId,
      agentsResults,
      _id: {
        type: 'string',
        format: 'mongoID',
      },
    },
    required: [
      'trigger',
      'reason',
      'map',
      'agentsResults',
      'status',
      'structure',
    ],
  };
}

function generateMany(idsCollection) {
  return jsf.generate({
    type: 'array',
    items: generateSingleSchema(idsCollection),
    maxItems: 15,
    minItems: 5,
  });
}

function generateOne(idsCollection) {
  return jsf.generate(generateSingleSchema(idsCollection));
}

module.exports = {
  generateOne,
  generateMany,
};
