const {
  TestDataManager,
  projectsFactory,
  mapsFactory
} = require("./factories");
const ProjectModel = require("../../api/models/project.model");
const { randomIdx } = require("./helpers");
const request = require("supertest");

const baseApiURL = "http://127.0.0.1:3000/api";

describe("Projects API tests", () => {
  const testDataManager = new TestDataManager(ProjectModel);

  beforeEach(async () => {
    await testDataManager.generateInitialCollection(
      projectsFactory.generateProjects()
    );
  });

  afterEach(async () => {
    await testDataManager.clear();
  });

  describe("Positive", () => {
    describe(`POST /`, () => {
      it(`should respond with a list of projects`, () => {
        return request(baseApiURL)
          .post(`/projects`)
          .send({ options: {} })
          .expect(200)
          .then(({ body }) => {
            expect(body.items.length).toEqual(
              testDataManager.collection.length
            );
            expect(body.totalCount).toEqual(testDataManager.collection.length);
          });
      });

      // adding some parameter to the api like page, sort and globalFilter
      it(`should respond with a list of projects`, () => {
        const globalFilter = testDataManager.collection[0].name;
        const filtered = testDataManager.collection.filter(
          project => project.name === globalFilter
        );
        return request(baseApiURL)
          .post(`/projects`)
          .send({ options: { sort: "name", page: 1, globalFilter } })
          .expect(200)
          .then(({ body }) => {
            expect(body.items.length).toEqual(filtered.length);
            expect(body.totalCount).toEqual(filtered.length);
            if (body.items.length) {
              expect(body.items[0].name).toEqual(globalFilter);
            }
          });
      });
    });

    describe(`POST /create`, () => {
      it(`should respond with the new project`, () => {
        const randomProject = projectsFactory.generateSingleProject();
        return request(baseApiURL)
          .post(`/projects/create`)
          .send(randomProject)
          .expect(200)
          .then(res => expect(res.body.name).toEqual(randomProject.name));
      });
    });

    describe(`GET /:id/detail`, () => {
      it(`should respond with the specific project`, () => {
        const randomIndex = Math.floor(
          Math.random() * testDataManager.collection.length
        );
        const { id, name } = testDataManager.collection[randomIndex];
        return request(baseApiURL)
          .get(`/projects/${id}/detail`)
          .expect(200)
          .then(res => expect(res.body.name).toEqual(name));
      });
    });

    describe(`PUT /:id/update`, () => {
      it(`should respond with the updated project`, () => {
        const newDescription = "simple description";
        const randomIndex = Math.floor(
          Math.random() * testDataManager.collection.length
        );
        const { id, name } = testDataManager.collection[randomIndex];
        return request(baseApiURL)
          .put(`/projects/${id}/update`)
          .send({ description: newDescription })
          .expect(200)
          .then(res => {
            expect(res.body.name).toEqual(name);
            expect(res.body.description).toEqual(newDescription);
          });
      });
    });

    describe(`DELETE /:id `, () => {
      it(`should respond with 'OK'`, () => {
        const randomIndex = Math.floor(
          Math.random() * testDataManager.collection.length
        );
        const randomProject = testDataManager.collection[randomIndex];
        // testDataManager.removeFromCollection(randomProject);
        return request(baseApiURL)
          .delete(`/projects/${randomProject.id}`)
          .expect(200)
          .expect("OK");
      });
    });

    describe(`PUT /:id/archive `, () => {
      it(`should respond with 200 status code`, () => {
        const randomIndex = randomIdx(testDataManager.collection.length);
        const projectId = testDataManager.collection[randomIndex].id;
        return request(baseApiURL)
          .put(`/projects/${projectId}/archive`)
          .send({ isArchive: true })
          .expect(200);
      });
    });

    describe(`GET /:projectId/ `, () => {
      it(`should respond with the recent maps of the project`, async () => {
        const randomIndex = randomIdx(testDataManager.collection.length);
        const { id, name } = testDataManager.collection[randomIndex];
        const mapName = "random map name";
        try {
          await mapsFactory.createMap(id, mapName);
          await request(baseApiURL)
            .get(`/projects/${id}`)
            .expect(200)
            .then(({ body }) => {
              const data = body[0];
              expect(data.map.name).toBe(mapName);
              expect(data.exec).toBe(null);
              expect(data.project.name).toBe(name);
            });
        } catch (err) {
          throw err;
        }
      });
    });
  });

  describe("Negative", () => {
    describe(`POST /`, () => {
      it(`should respond with a 500 status code`, done => {
        return request(baseApiURL)
          .post(`/projects`)
          .expect(500, done);
      });
    });

    describe(`POST /create`, () => {
      it(`should respond with a 500 status code`, done => {
        return request(baseApiURL)
          .post(`/projects/create`)
          .send()
          .expect(500, done);
      });
    });

    describe(`GET /:id/detail`, () => {
      it(`should respond with a 500 status code`, done => {
        return request(baseApiURL)
          .get(`/projects/0/detail`)
          .expect(404, done);
      });
    });

    describe(`PUT /:id/update`, () => {
      it(`should respond with a 500 status code`, done => {
        const newDescription = "simple description";
        return request(baseApiURL)
          .put(`/projects/0/update`)
          .send({ description: newDescription })
          .expect(500, done);
      });
    });

    describe(`DELETE /:jobId/ `, () => {
      it(`should respond with a 500 status code`, done => {
        return request(baseApiURL)
          .delete(`/projects/0`)
          .expect(500, done);
      });
    });

    describe(`GET /:projectId/ `, () => {
      it(`should respond with a 500 status code`, done => {
        return request(baseApiURL)
          .get(`/projects/0`)
          .expect(500, done);
      });
    });
  });
});
