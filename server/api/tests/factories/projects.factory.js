const {jsf} = require('./jsf.helper');

const singleProjectSchema = {
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
    description: {
      type: 'string',
      chance: {paragraph: {}},
    },
    archived: {
      type: 'boolean',
      chance: {bool: {likelihood: 0}},
    },
    maps: [],
  },
  required: ['name', 'description', 'maps', 'archived'],
};

const arrayProjectSchema = {
  type: 'array',
  items: singleProjectSchema,
  maxItems: 7,
  minItems: 2,
};

module.exports = {
  generateProjects: () => jsf.generate(arrayProjectSchema),
  generateSingleProject: () => jsf.generate(singleProjectSchema),
};
