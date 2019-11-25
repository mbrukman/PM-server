const socket = require("socket.io-client");
const { Project } = require("../../models");
const TestDataManager = require("./../factories/test-data-manager");
const { MapStructure } = require("../../../api/models/map-structure.model");
const {
  mapStructureFactory,
  mapsFactory,
  projectsFactory
} = require("./../factories");

function randomIdx(length) {
  return Math.floor(Math.random() * length);
}

module.exports = {
  randomIdx,
  connectToSocket(url = "http://localhost:3000/") {
    const io = socket(url);
    return new Promise(resolve => {
      io.on("connect", () => {
        resolve(io);
      });
    });
  },
  async generateMapAndProject() {
    const mapStructureTestDataManager = new TestDataManager(MapStructure);
    const projectTestDataManager = new TestDataManager(Project);
    const projects = await projectTestDataManager.generateInitialCollection(
      projectsFactory.generateProjects()
    );

    const randomIndex = randomIdx(projectTestDataManager.collection.length);
    const project = projectTestDataManager.collection[randomIndex];

    const map = await mapsFactory.createMap(project.id, "random map name");
    const mapStructures = await mapStructureTestDataManager.generateInitialCollection(
      mapStructureFactory.generateMany(map._id.toString(), [map])
    );
    return {
      map,
      projects,
      mapStructures
    };
  }
};
