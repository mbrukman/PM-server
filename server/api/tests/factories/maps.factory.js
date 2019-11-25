const { jsf } = require("./jsf.helper");
const MapModel = require("../../models/map.model");
const {Project} = require("../../models");

function getSimpleMapSchema() {
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
          word: {
            length: 10
          }
        }
      }
    },
    required: ["_id", "name"]
  };
}

function generateSimpleMap() {
  return jsf.generate(getSimpleMapSchema());
}

async function createMap(projectId, mapName) {
  const generatedMap = generateSimpleMap();
  generatedMap.name = mapName || generatedMap.name;
  try {
    const map = await MapModel.create(generatedMap);
    await addMapToProject(projectId, map.id);
    return map;
  } catch (err) {
    return err;
  }
}

async function addMapToProject(projectId, mapId) {
  try {
    await ProjectModel.findByIdAndUpdate(
      { _id: projectId },
      { $push: { maps: mapId } }
    );
  } catch (err) {
    return err;
  }
}

function generateMany() {
  return jsf.generate({
    type: "array",
    items: getSimpleMapSchema(),
    maxItems: 15,
    minItems: 5
  });
}

module.exports = {
  createMap,
  generateSimpleMap,
  generateMany,
  addMapToProject
};
