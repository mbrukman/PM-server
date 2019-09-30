const { jsf } = require("./jsf.helper");
const actionFactory = require("./action.factory");

function generateSingleSchema(usedPlugins, actions) {
  if (!actions || !actions.length) actions = actionFactory.generateMany();

  return {
    type: "object",
    properties: {
      actions,
      uuid: {
        type: "string",
        chance: {
          word: {}
        }
      },
      name: {
        type: "string",
        chance: {
          word: {}
        }
      },
      description: {
        type: "string",
        chance: {
          paragraph: {
            length: 1
          }
        }
      },
      default_execution: {
        type: "boolean",
        chance: {
          bool: {
            likelihood: 30
          }
        }
      },
      order: {
        type: "number",
        chance: {
          integer: {}
        }
      }
    },
    required: [
      "order",
      "default_execution",
      "description",
      "name",
      "uuid",
      "actions"
    ]
  };
}

function generateMany(usedPlugins) {
  return jsf.generate({
    type: "array",
    items: generateSingleSchema(usedPlugins),
    maxItems: 15,
    minItems: 5
  });
}

module.exports = {
  generateMany,
  generateOne: generateSingleSchema
};
