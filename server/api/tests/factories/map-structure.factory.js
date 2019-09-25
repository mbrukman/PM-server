const { jsf } = require("./jsf.helper");
const processFactory = require("./process.factory");

function generateSingleSchema(mapId, maps) {
  const processes = processFactory.generateMany();
  return {
    type: "object",
    properties: {
      code: {
        type: "string",
        chance: {
          word: {
            length: 5
          }
        }
      },
      map: mapId,
      maps,
      processes,
      _id: {
        type: "string",
        format: "mongoID"
      }
    },
    required: ["code", "_id", "map", "processes"]
  };
}

function generateMany(mapId, maps) {
  return jsf.generate({
    type: "array",
    items: generateSingleSchema(mapId, maps),
    maxItems: 15,
    minItems: 5
  });
}

function generateOne(mapId, maps) {
  return jsf.generate(generateSingleSchema(mapId, maps));
}

module.exports = {
  generateOne,
  generateMany
};
