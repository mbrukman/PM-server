const { jsf } = require("./jsf.helper");
const actionResultFactory = require("./action-result.factory");

function generateSingleSchema({ processId, actionId }) {
  const actionsResults = actionResultFactory.generateMany(actionId);
  return {
    type: "object",
    properties: {
      actions: actionsResults,
      startTime: {
        format: "date-time",
        type: "string"
      },
      process: processId,
      finishTime: {
        format: "date-time",
        type: "string"
      },
      status: {
        type: "string",
        enum: [
          "running",
          "done",
          "pending",
          "error",
          "stopped",
          "canceled",
          "success"
        ]
      },
      iterationIndex: {
        type: "number",
        chance: {
          integer: {}
        }
      }
    },
    required: [
      "status",
      "startTime",
      "finishTime",
      "iterationIndex",
      "actions",
      "process"
    ]
  };
}

function generateMany(idsCollection) {
  return jsf.generate({
    type: "array",
    items: generateSingleSchema(idsCollection),
    maxItems: 15,
    minItems: 5
  });
}

module.exports = {
  generateMany,
  generateOne: generateSingleSchema
};
