const { jsf } = require("./jsf.helper");

function generateSingleSchema() {
  return {
    type: "object",
    properties: {
      _id: {
        type: "string",
        format: "mongoID"
      },
      name: {
        type: "string",
        chance: {
          word: {}
        }
      },
      url: {
        type: "string",
        chance: {
          url: {}
        }
      },
      publicUrl: {
        type: "string",
        chance: {
          url: {}
        }
      },
      key: {
        type: "string",
        chance: {
          guid: {}
        }
      }
    },
    required: ["key", "publicUrl", "url", "name", "_id"]
  };
}

function generateMany() {
  return jsf.generate({
    type: "array",
    items: generateSingleSchema(),
    maxItems: 15,
    minItems: 5
  });
}

module.exports = {
  generateMany,
  generateOne: () => jsf.generate(generateSingleSchema())
};
