const request = require("supertest");
const { generateMapAndProject } = require("./helpers");
const { mapStructureFactory, processFactory } = require("./factories");

const baseUrl = "localhost:3000";
const apiURL = `${baseUrl}/api`;

function createStructure(map, structure) {
  if (!structure) {
    structure = mapStructureFactory.generateOne(map._id, [map]);
    structure.processes = processFactory.generateMany([]);
  }

  return request(apiURL)
    .post(`/maps/${map._id}/structure/create`)
    .send({ structure });
}

describe("Websocket listens to events after map update", () => {
  let map;

  beforeEach(async () => {
    const data = await generateMapAndProject();
    map = data.map;
  });

  it("should return successful message through WebSocket after well-created structure", async done => {
    global.io.on("message", ({ type, msg }) => {
      if (type === "saved-map") {
        expect.assertions(3);
        expect(msg.title).toBe("Saved");
        expect(msg.type).toBe("success");
        expect(msg.mapId).toBe(map._id.toString());
        done();
      }
    });
    await createStructure(map);
  });

  it("should return error message through WebSocket after not created structure", async done => {
    global.io.on("notification", ({ type, message, title }) => {
      if (type === "error") {
        expect.assertions(3);
        expect(title).toBe("Whoops...");
        expect(type).toBe("error");
        expect(message).toBe("Error saving map structure");
        done();
      }
    });
    await createStructure(map, {});
  });
});
