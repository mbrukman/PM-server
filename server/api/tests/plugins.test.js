const request = require('supertest');
const app = require('../../app');

const pluginFile = './files/kaholo-plugin.csv.zip';
// TODO: use factory
let pluginID = '5d77df087044612270179e25';

describe('Plugins tests', () => {

    beforeAll(() => {

    });

    describe('Positive', () => {

        describe(`POST /upload`, () => {
            it(`should upload plugin`, (done) => {
                request(app)
                    .post(`/api/plugins/upload`)
                    .attach('file', pluginFile)
                    .expect(200)
                    .then(res => {
                        expect(res.body.active).toBe(true);
                        expect(Array.isArray(res.body.methods)).toBe(true);
                        expect(Array.isArray(res.body.methods[0].params)).toBe(true);
                        pluginID = res.body.id;
                        done();
                    });
            });
        });

        describe(`GET /`, () => {
            it(`should respond with a list of plugins`, (done) => {
                request(app)
                    .get(`/api/plugins`)
                    .expect(200)
                    .then(res => {
                        expect(Array.isArray(res.body)).toBe(true);
                        expect(Array.isArray(res.body[0].methods)).toBe(true);
                        expect(Array.isArray(res.body[0].methods[0].params)).toBe(true);
                        done();
                    });
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with a plugin of a given id`, (done) => {
                request(app)
                    .get(`/api/plugins/${pluginID}`)
                    .expect(200)
                    .then(res => {
                        expect(Array.isArray(res.body.methods)).toBe(true);
                        expect(Array.isArray(res.body.methods[0].params)).toBe(true);
                        done();
                    });
                    
            });
        });

        // notice: POST method used for "update" operation
        describe(`POST /:id/settings`, () => {
            it(`should respond with an updated plugin's settings`, (done) => {
                const newSettings = [
                    {
                        "value": "testvalue3"
                    },
                    {
                        "value": "testvalue4"
                    }
                ];
                request(app)
                    .post(`/api/plugins/${pluginID}/settings`)
                    .send(newSettings)
                    .expect(200)
                    .then( res=> {
                        expect(res.body.settings[0].value).toEqual(newSettings[0].value);
                        expect(res.body.settings[1].value).toEqual(newSettings[1].value);
                        done();
                    });
            });
        });

        // notice: redundant "/delete"
        describe(`DELETE /:id/delete`, () => {
            it(`should respond with 200`, (done) => {
                // notice: RETURNS 200 for ANY ID
                request(app)
                    .delete(`/api/plugins/${pluginID}/delete`)
                    .expect(200, done);
            });
        });

    });

    describe('Negative', () => {

        describe(`POST /upload`, () => {
            it(`should respond with status 500 and proper error msg for invalid plugin file`, (done) => {
                request(app)
                    .post(`/api/plugins/upload`)
                    .attach('file', './plugins.test.js')
                    .expect(500)
                    .then(res => {
                        expect(res.body).toBe('Bad foramt'); // sic!
                        done();
                    });
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with status 500 and proper error msg for invalid id`, (done) => {

            });
        });

        describe(`POST /:id/settings`, () => {
            it(`should respond with status 500 and proper error msg for invalid id`, (done) => {

            });
        });

        describe(`POST /:id/settings`, () => {
            it(`should respond with status 500 and proper error msg for invalid settings body`, (done) => {

            });
        });

        describe(`DELETE /:id/delete`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {

            });
        });
    });
});