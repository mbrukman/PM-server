const request = require('supertest');
const PluginModel = require('../../api/models/plugin.model');
const TestDataManager = require('./factories/test-data-manager');
const pluginsFactory = require('./factories/plugins.factory');
const app = 'localhost:3000';

describe('Plugins tests', () => {
  let testDataManager;
  let pluginId;
  const pluginFile = './api/tests/files/kaholo-plugin-gsuite.zip';

  describe('Positive', () => {
    beforeEach(async () => {
      testDataManager = new TestDataManager(PluginModel);
      const plugin = pluginsFactory.generatePluginDocument();
      pluginId = plugin._id;
      await testDataManager.pushToCollectionAndSave(plugin);
    });

    afterAll(async () => {
      await testDataManager.clear();
    });

    describe(`POST /upload`, () => {
      it(`should upload plugin`, () => {
        return request(app)
            .post(`/api/plugins/upload`)
            .attach('file', pluginFile)
            .expect(200)
            .then((res) => {
              expect(res.body.active).toBe(true);
              expect(Array.isArray(res.body.methods)).toBe(true);
              expect(Array.isArray(res.body.methods[0].params)).toBe(true);
            });
      });
    });

    describe(`GET /`, () => {
      it(`should respond with a list of plugins`, () => {
        return request(app)
            .get(`/api/plugins`)
            .expect(200)
            .then((res) => {
              expect(Array.isArray(res.body)).toBe(true);
              expect(Array.isArray(res.body[0].methods)).toBe(true);
              expect(Array.isArray(res.body[0].methods[0].params)).toBe(true);
            });
      });
    });

    describe(`GET /:id`, () => {
      it(`should respond with a plugin of a given id`, () => {
        return request(app)
            .get(`/api/plugins/${pluginId}`)
            .expect(200)
            .then((res) => {
              expect(Array.isArray(res.body.methods)).toBe(true);
              expect(Array.isArray(res.body.methods[0].params)).toBe(true);
            });
      });
    });

    // notice: POST method used for "update" operation
    describe(`POST /:id/settings`, () => {
      it(`should respond with an updated plugin's settings`, () => {
        const newSettings = [
          {
            value: 'testvalue3',
          },
          {
            value: 'testvalue4',
          },
        ];
        return request(app)
            .post(`/api/plugins/${pluginId}/settings`)
            .send(newSettings)
            .expect(200)
            .then((res) => {
              expect(res.body.settings[0].value).toBe(newSettings[0].value);
              expect(res.body.settings[1].value).toBe(newSettings[1].value);
            });
      });
    });

    // notice: redundant "/delete"
    describe(`DELETE /:id/delete`, () => {
      it(`should respond with 200`, () => {
        // notice: RETURNS 200 for ANY ID
        return request(app)
            .delete(`/api/plugins/${pluginId}`)
            .expect(200)
            .then();
      });
    });
  });

  describe('Negative', () => {
    describe(`POST /upload`, () => {
      it(`should respond with status 500 and proper error msg for invalid plugin file`, () => {
        return request(app)
            .post(`/api/plugins/upload`)
            .attach('file', './api/tests/plugins.test.js')
            .expect(500)
            .then((res) => {
              expect(res.text).toBe('Bad foramt'); // sic!
            });
      });
    });

    describe(`GET /:id`, () => {
      it(`should respond with status 500 and proper error msg for invalid id`, () => {
        return request(app)
            .get('/api/plugins/0')
            .expect(500)
            .then((res) => {
              expect(res.body.message).toBe(
                  'Cast to ObjectId failed for value "0" at path "_id" for model "Plugin"'
              );
            });
      });
    });

    describe(`POST /:id/settings`, () => {
      it(`should respond with status 500 and proper error msg for invalid id`, () => {
        const newSettings = [
          {
            value: 'testvalue3',
          },
          {
            value: 'testvalue4',
          },
        ];
        return request(app)
            .post(`/api/plugins/0/settings`)
            .send(newSettings)
            .expect(500)
            .then((res) => {
              expect(res.body.message).toBe(
                  'Cast to ObjectId failed for value "0" at path "_id" for model "Plugin"'
              );
            });
      });
    });

    describe(`POST /:id/settings`, () => {
      it(`should respond with status 500 and error message`, () => {
        return request(app)
            .post(`/api/plugins/${pluginId}/settings`)
            .expect(500)
            .then(({body}) => {
              expect(body.message).toEqual(`Settings not found`);
            });
      });
    });

    describe(`DELETE /:id/delete`, () => {
      it(`should respond with status 500 and proper error msg`, () => {
        return request(app)
            .delete('/api/plugins/0')
            .expect(500)
            .then((res) => {
              expect(res.body.message).toBe(
                  'Cast to ObjectId failed for value "0" at path "_id" for model "Plugin"'
              );
            });
      });
    });
  });
});
