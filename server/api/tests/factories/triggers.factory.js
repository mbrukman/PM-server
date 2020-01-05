const { jsf } = require("./jsf.helper");

jsf.option({
  useDefaultValue: true
});

const actionParamsSchema = {
  type: "object",
  properties: {
    value: {
      type: "string",
      faker: "random.word"
    },
    viewName: {
      type: "string",
      faker: "random.word"
    },
    param: {
      type: "string",
      faker: "random.word"
    },
    name: {
      type: "string",
      faker: "random.word"
    },
    type: {
      type: "string",
      faker: "random.word"
    }
  }
};

const triggerSchema = {
  type: "object",
  properties: {
    _id: {
      type: "string",
      format: "mongoID"
    },
    name: {
      type: "string",
      chance: {
        word: {
          length: 10
        }
      }
    },
    map: {
      type: "string",
      format: "mongoID",
      default: "5d70c6f15556a11f1860bc6e"
    },
    description: {
      type: "string",
      faker: "lorem.paragraph"
    },
    createdAt: { type: "string", faker: "date.recent" },
    active: { type: "boolean", faker: "random.boolean" },
    plugin: {
      type: "string",
      chance: {
        word: {
          length: 10
        }
      }
    },
    method: {
      type: "string",
      chance: {
        word: {
          length: 10
        }
      }
    },
    configuration: {
      type: "string",
      chance: {
        word: {
          length: 10
        }
      }
    },
    params: {
      $ref: actionParamsSchema
    }
  },
  required: ["_id", "name", "map", "plugin", "method"]
};

const triggerCollectionSchema = {
  type: "array",
  items: triggerSchema,
  maxItems: 15,
  minItems: 5
};

module.exports = {
  generateTriggerCollection: options =>
    jsf.generate(Object.assign(triggerCollectionSchema, options)),
  generateTriggerDocument: options =>
    jsf.generate(Object.assign(triggerSchema, options)),
  mapId: triggerSchema.properties.map.default
};
