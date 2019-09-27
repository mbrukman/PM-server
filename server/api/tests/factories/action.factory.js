const {jsf} = require('./jsf.helper');

function generateSingleSchema() {
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        chance: {
          word: {
            length: 7,
          },
        },
      },
      timeout: {
        type: 'number',
        chance: {
          integer: {},
        },
      },
      method: {
        type: 'string',
        chance: {
          word: {
            length: 7,
          },
        },
      },
      params: [],
      numParallel: {
        type: 'string',
        chance: {
          integer: {
            min: 0,
            max: 10,
          },
        },
      },
    },
    required: ['method', 'timeout', 'name', 'numParallel', 'params'],
  };
}

function generateMany() {
  return jsf.generate({
    type: 'array',
    items: generateSingleSchema(),
    maxItems: 15,
    minItems: 5,
  });
}

module.exports = {
  generateMany,
  generateOne: generateSingleSchema,
};
