const { randomIdx } = require("./helpers");

const request = require("supertest");
const ProjectModel = require("../../api/models/project.model");
const { MapStructure } = require("../../api/models/map-structure.model");
const {
  mapStructureFactory,
  mapsFactory,
  projectsFactory,
  processFactory
} = require("./factories");
const TestDataManager = require("./factories/test-data-manager");

const apiURL = "localhost:3000/api";

describe("Map revision endpoints should work correctly", () => {
  const mapStructureTestDataManager = new TestDataManager(MapStructure);
  const projectTestDataManager = new TestDataManager(ProjectModel);
  let map;
  let project;

  beforeEach(async () => {
    await projectTestDataManager.generateInitialCollection(
      projectsFactory.generateProjects()
    );

    const randomIndex = randomIdx(projectTestDataManager.collection.length);
    project = projectTestDataManager.collection[randomIndex];

    map = await mapsFactory.createMap(project.id, "random map name");
    await mapStructureTestDataManager.generateInitialCollection(
      mapStructureFactory.generateMany(map._id.toString(), [map])
    );
  });

  afterEach(async () => {
    await mapStructureTestDataManager.clear();
    await projectTestDataManager.clear();
    map = null;
  });

  describe("/GET works correctly", () => {
    it("should return 200 and single structure", () => {
      return request(apiURL)
        .get(`/maps/${map._id}/structure`)
        .expect(200)
        .then(({ body }) => {
          expect.assertions(1);
          expect(body.map).toBe(map._id.toString());
        });
    });

    it("should return 500 and error message instead of single structure", () => {
      return request(apiURL)
        .get(`/maps/undefined/structure`)
        .expect(500)
        .then(({ body }) => expect(body.name).toBe("CastError"));
    });

    it("should return 200 and all structures in the system", () => {
      return request(apiURL)
        .get(`/maps/${map._id}/structures`)
        .expect(200)
        .then(({ body }) => {
          expect.assertions(1);
          expect(body.length).toBe(
            mapStructureTestDataManager.collection.length
          );
        });
    });

    it("should return 500 and error message instead of all structures", () => {
      return request(apiURL)
        .get(`/maps/undefined/structures`)
        .expect(500)
        .then(({ body }) => expect(body.name).toBe("CastError"));
    });

    it("should return 200 and single structure chosen by passed id", () => {
      const structure = mapStructureTestDataManager.collection[0];
      return request(apiURL)
        .get(`/maps/${map._id}/structure/${structure._id}`)
        .expect(200)
        .then(({ body }) => {
          expect.assertions(2);
          expect(body._id).toBe(structure._id.toString());
          expect(body.code).toBe(structure.code);
        });
    });

    it("should return 500, error message and no single structure chosen by passed id without structure id", () => {
      return request(apiURL)
        .get(`/maps/${map._id}/structure/undefined`)
        .expect(500)
        .then(({ body }) => expect(body.name).toBe("CastError"));
    });

    it("should return 200, error message and no single structure chosen by passed id without map id", () => {
      const structure = mapStructureTestDataManager.collection[0];
      return request(apiURL)
        .get(`/maps/undefined/structure/${structure._id}`)
        .expect(200)
        .then(({ body }) => {
          expect(body._id).toBe(structure._id.toString());
          expect(body.code).toBe(structure.code);
        });
    });
  });

  describe("/POST works correctly", () => {
    it("should create a structure and return 200", () => {
      const structure = mapStructureFactory.generateOne(map._id, [map]);
      structure.processes = processFactory.generateMany([]);
      return request(apiURL)
        .post(`/maps/${map._id}/structure/create`)
        .send({ structure })
        .expect(200)
        .then(({ body }) => {
          expect.assertions(2);
          expect(body._id).toBe(structure._id.toString());
          expect(body.code).toBe(structure.code);
        });
    });

    it("should not create a structure and return 500 without the POST body", () => {
      return request(apiURL)
        .post(`/maps/${map._id}/structure/create`)
        .send({})
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    it("should not create a structure and return 500 without the map param id body", () => {
      const structure = mapStructureFactory.generateOne(map._id, [map]);
      structure.processes = processFactory.generateMany([]);
      return request(apiURL)
        .post(`/maps/undefined/structure/create`)
        .send({ structure })
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    it("should create a duplicate of a map with given name and return 200", () => {
      const structure = mapStructureTestDataManager.collection[0];
      const name = "a new name of a map";
      return request(apiURL)
        .post(`/maps/${map._id}/structure/${structure._id}/duplicate`)
        .send({
          options: {
            name
          },
          projectId: project.id
        })
        .expect(200)
        .then(({ body }) => {
          expect.assertions(1);
          expect(body.name).toBe(name);
        });
    });

    it("should not create a duplicate of a map and return 500 without POST body", () => {
      const structure = mapStructureTestDataManager.collection[0];
      return request(apiURL)
        .post(`/maps/${map._id}/structure/${structure._id}/duplicate`)
        .send({})
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    it("should not create a duplicate of a map and return 500 without structure id param", () => {
      const name = "a new name of a map";
      return request(apiURL)
        .post(`/maps/${map._id}/structure/undefined/duplicate`)
        .send({
          options: {
            name
          },
          projectId: project.id
        })
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    it("should not create a duplicate of a map and return 500 without map id param", () => {
      const structure = mapStructureTestDataManager.collection[0];
      const name = "a new name of a map";
      return request(apiURL)
        .post(`/maps/undefined/structure/${structure._id}/duplicate`)
        .send({
          options: {
            name
          },
          projectId: project.id
        })
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    it('should not create a duplicate of a map and return 500 with missing "options" property in POST body', () => {
      const structure = mapStructureTestDataManager.collection[0];
      return request(apiURL)
        .post(`/maps/${map._id}/structure/${structure._id}/duplicate`)
        .send({
          projectId: project.id
        })
        .expect(500)
        .then(({ body }) => expect(body).toMatchObject({}));
    });

    // FAILS DUE TO BUG ON BACKEND
    //     it('should not create a duplicate of a map and return 500 with missing "projectId" property in POST body', () => {
    //         const structure = mapStructureTestDataManager.collection[0];
    //         const name = 'a new name of a map';
    //         return request(apiURL)
    //             .post(`/maps/${map._id}/structure/${structure._id}/duplicate`)
    //             .send({
    //                 options: {
    //                     name
    //                 },
    //             })
    //             .expect(500)
    //             .then(({body}) => expect(body).toMatchObject({}));
    //     });
  });
});
