module.exports = {
  items: {
    type: 'object',
    properties: {
      name: {type: 'string'},
      viewName: {type: 'string'},
      description: {type: 'string'},
      type: {
        type: 'string',
        enum: ['string', 'int', 'float', 'options', 'autocomplete', 'file', 'text', 'boolean', 'vault'],
      },
      options: {
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
          },
          additionalProperties: true,
          required: ['id', 'name'],
        },
      },
      model: {
        type: 'string',
      },
      propertyName: {
        type: 'string',
      },
    },
    allOf: [
      {
        if: {
          properties: {
            type: {
              const: 'options',
            },
          },
        },
        then: {
          required: ['options'],
        },

      },
      {
        if: {
          properties: {
            type: {
              const: 'autocomplete',
            },
          },
        },
        then: {
          required: ['model', 'propertyName'],
        },

      },
    ],
  },
};
