const request = require("supertest");
const { randomIdx } = require("./helpers/index");
const TriggerModel = require("../../api/models/map-trigger.model");
const TestDataManager = require("./factories/test-data-manager");
const triggersFactory = require("./factories/triggers.factory");
const app = "localhost:3000";
const mapId = triggersFactory.mapId;

describe("Map triggers tests", () => {
  let testDataManager;

  describe("Positive", () => {
    beforeEach(async () => {
      testDataManager = new TestDataManager(TriggerModel);
      const triggerCollection = triggersFactory.generateTriggerCollection();
      await testDataManager.generateInitialCollection(triggerCollection);
    });

    afterEach(() => {});

    describe(`GET /:mapId`, () => {
      it(`should respond with a list of triggers`, function(done) {
        request(app)
          .get(`/api/triggers/${mapId}`)
            .expect(200)
          .then(res => {
              expect(Array.isArray(res.body)).toBe(true);
              done();
            });
      });
    });

    describe(`POST /:mapId`, () => {
      it(`should respond with a created trigger`, function(done) {
        const triggerName = "test trigger name";
        const plugin = "test trigger plugin";
        const method = "test trigger method";
        request(app)
            .post(`/api/triggers/${mapId}`)
            .send({ name: triggerName, plugin: plugin, method: method })
            .expect(200)
          .then(res => {
            expect(res.body.name).toEqual(triggerName);
              done();
          });
      });
    });

    describe(`DELETE /:mapId/:triggerId`, () => {
      it(`should respond with 'OK'`, function(done) {
        const randomIndex = randomIdx(testDataManager.collection.length);
        const triggerId = testDataManager.collection[randomIndex].id;
        return request(app)
          .delete(`/api/triggers/${mapId}/${triggerId}`)
            .expect(200)
            .then(() => {
            expect("OK");
            done();
            });
      });
    });

    describe(`PUT /:mapId/:triggerId`, () => {
      it(`should respond with an updated trigger`, function(done) {
        const randomIndex = randomIdx(testDataManager.collection.length);
        const triggerId = testDataManager.collection[randomIndex].id;
        const newTriggerName = "test trigger name 2";
        request(app)
            .put(`/api/triggers/${mapId}/${triggerId}`)
            .send({ name: newTriggerName })
          .expect(200)
          .then(res => {
            expect(res.body.name).toEqual(newTriggerName);
              done();
            });
      });
    });
  });

  describe("Negative", () => {
    describe(`GET /:mapId`, () => {
      it(`should respond with status code 500 and proper error msg`, function(done) {
        request(app)
          .get("/api/triggers/0")
            .expect(500, done);
      });
    });

    describe(`POST /:mapId`, () => {
      it(`should respond with status code 500 and proper error msg`, function(done) {
        request(app)
            .post("/api/triggers/0")
          .expect(500, done);
      });
    });

    describe(`DELETE /:mapId/:triggerId`, () => {
      it(`should respond with status code 500 and proper error msg`, function(done) {
        request(app)
            .delete(
            "/api/triggers/5d83970f611fb22814c56c07/5d83970f611fb22814c56c07"
          )
          .expect(500)
          .then(({ body }) => {
            expect(body.message).toBe("Trigger not found");
              done();
            });
      });
    });

    describe(`PUT /:mapId/:triggerId`, () => {
      it(`should respond with status code 500 and proper error msg`, function(done) {
        request(app)
            .put("/api/triggers/0/0")
            .expect(500)
          .then(res => {
              expect(res.body.message).toEqual(
              'Cast to ObjectId failed for value "0" at path "_id" for model "Trigger"'
              );
              done();
          });
      });
    });
  });
});
