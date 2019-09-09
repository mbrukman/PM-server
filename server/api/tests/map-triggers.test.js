const request = require('supertest');

const app = require('../../app');
const mapId = '5d70c6f15556a11f1860bc6e';
let triggerId = '5d720cabd990b82430dcf60a';

describe('Map triggers tests', () => {
  describe('Positive', () => {

    beforeEach((done) => {
      request(app)
        .post(`/api/triggers/${mapId}`)
        .send({ name: 'beforeEach trigger' })
        .end(function (err, res) {
          triggerId = res.body.id;
          done();
        });
    })

    afterEach((done) => {
      request(app)
        .delete(`/api/triggers/${mapId}/${triggerId}`)
        .end(function (err, res) {
          done();
        });
    })

    describe(`GET /:mapId`, () => {
      it(`should respond with a list of triggers`, function (done) {
        request(app)
          .get(`/api/triggers/${mapId}`)
          .expect(200)
          .end(function (err, res) {
            expect(Array.isArray(res.body)).toBe(true);
            done();
          });
      });
    });

    describe(`POST /:mapId`, () => {
      it(`should respond with a created trigger`, function (done) {
        const triggerName = 'test trigger name';
        request(app)
          .post(`/api/triggers/${mapId}`)
          .send({ name: triggerName })
          .expect(200)
          .end(function (err, res) {
            expect(res.body.name).toEqual(triggerName);
            done();
          });
      });
    });

    describe(`DELETE /:mapId/:triggerId`, () => {
      it(`should respond with 'OK'`, function (done) {
        request(app)
          .delete(`/api/triggers/${mapId}/${triggerId}`)
          .expect(200)
          .end(function (err, res) {
            expect('OK');
            done();
          });
      });
    });

    describe(`PUT /:mapId/:triggerId`, () => {
      it(`should respond with an updated trigger`, function (done) {
        const newTriggerName = 'test trigger name 2';
        request(app)
          .put(`/api/triggers/${mapId}/${triggerId}`)
          .send({ name: newTriggerName })
          .expect(200)
          .end(function (err, res) {
            expect(res.body.name).toEqual(newTriggerName);
            done();
          });
      });
    });
  });

  describe('Negative', () => {
    describe(`GET /:mapId`, () => {
      it(`should respond with status code 500 and proper error msg`, function (done) {
        request(app)
          .get('/api/triggers/0')
          .expect(500)
          .end(function (err, res) {
            expect(res.body.message).toEqual("Cast to ObjectId failed for value \"0\" at path \"map\" for model \"Trigger\"");
            done();
          });
      });
    });

    describe(`POST /:mapId`, () => {
      it(`should respond with status code 500 and proper error msg`, function (done) {
        request(app)
          .post('/api/triggers/0')
          .expect(500)
          .end(function (err, res) {
            expect(res.body.message).toEqual("Trigger validation failed: map: Cast to ObjectID failed for value \"0\" at path \"map\", name: Path `name` is required.");
            done();
          });
      });
    });

    describe(`DELETE /:mapId/:triggerId`, () => {
      it(`should respond with status code 500 and proper error msg`, function (done) {
        request(app)
          .delete('/api/triggers/0/0')
          .expect(500)
          .end(function (err, res) {
            expect(res.body.message).toEqual("Cast to ObjectId failed for value \"0\" at path \"_id\" for model \"Trigger\"");
            done();
          });
      });
    });
    
    describe(`PUT /:mapId/:triggerId`, () => {
      it(`should respond with status code 500 and proper error msg`, function (done) {
        request(app)
          .put('/api/triggers/0/0')
          .expect(500)
          .end(function (err, res) {
            expect(res.body.message).toEqual("Cast to ObjectId failed for value \"0\" at path \"_id\" for model \"Trigger\"");
            done();
          });
      });
    });
  });
});
