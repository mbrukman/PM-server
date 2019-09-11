const request = require('supertest');
const app = require('../../app');

const pluginFile = './api/tests/files/kaholo-plugin-gsuite.zip';
// TODO: use factory
let pluginID = '5d77df087044612270179e25';

describe('Plugins tests', () => {

    afterEach((done) => {
        request(app)
            .delete(`/api/plugins/${pluginID}/delete`)
            .then(res => {
                done();
            });
    });

    describe('Positive', () => {

        beforeEach((done) => {
            jest.setTimeout(9000);
            request(app)
                .post(`/api/plugins/upload`)
                .attach('file', pluginFile)
                .then(res => {
                    pluginID = res.body.id;
                    done();
                });
        });

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
                    .then(res => {
                        expect(res.body.settings[0].value).toBe(newSettings[0].value);
                        expect(res.body.settings[1].value).toBe(newSettings[1].value);
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
                    .attach('file', './api/tests/plugins.test.js')
                    .expect(500)
                    .then(res => {
                        expect(res.text).toBe('Bad foramt'); // sic!
                        done();
                    });
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with status 500 and proper error msg for invalid id`, (done) => {
                request(app)
                    .get('/api/plugins/0')
                    .expect(500)
                    .then((res) => {
                        expect(res.body.message).toBe("Cast to ObjectId failed for value \"0\" at path \"_id\" for model \"Plugin\"");
                        done();
                    });
            });
        });

        describe(`POST /:id/settings`, () => {
            it(`should respond with status 500 and proper error msg for invalid id`, (done) => {
                request(app)
                    .post(`/api/plugins/0/settings`)
                    .expect(500)
                    .then((res) => {
                        expect(res.body.message).toBe("Cast to ObjectId failed for value \"0\" at path \"_id\" for model \"Plugin\"");
                        done();
                    });
            });
        });

        describe(`POST /:id/settings`, () => {
            // notice: bug - response body should be an error message, not an empty object
            it(`should respond with status 500 and empty object for invalid settings body`, (done) => {
                request(app)
                    .post(`/api/plugins/${pluginID}/settings`)
                    .expect(500)
                    .then((res) => {
                        expect(res.body).toEqual({});
                        done();
                    });
            });
        });

        describe(`DELETE /:id/delete`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {
                request(app)
                    .delete('/api/plugins/0/delete')
                    .expect(500)
                    .then((res) => {
                        expect(res.body.message).toBe("Cast to ObjectId failed for value \"0\" at path \"_id\" for model \"Plugin\"");
                        done();
                    });
            });
        });
    });
});