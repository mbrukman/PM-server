const request = require('supertest');
const fs = require('fs');
//const app = require('../../app');

//const file = fs.readFileSync('./files/kaholo-plugin.csv.zip');

describe('Plugins tests', () => {

    beforeAll(() => {

    });

    describe('Positive', () => {

        describe(`POST /upload`, () => {
            it(`should upload plugin`, (done) => {
                request(app)
                    .post(`/api/plugins/upload`)
                    .attach('file', './files/kaholo-plugin.csv.zip')
                    .expect(200)
                    .then(res => {
                        expect(res.body.name).toEqual("CSV");
                        done();
                    });
            });
        });

        describe(`GET /`, () => {
            it(`should respond with a list of plugins`, (done) => {

            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with a plugin of a given id`, (done) => {

            });
        });

        // notice: POST method used for "update" operation
        describe(`POST /:id/settings`, () => {
            it(`should respond with an updated plugin`, (done) => {

            });
        });

        // notice: redundant "/delete"
        describe(`DELETE /:id/delete`, () => {
            it(`should respond with a plugin of a given id`, (done) => {

            });
        });

    });

    describe('Negative', () => {

        describe(`POST /upload`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {

            });
        });

        describe(`GET /`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {
                // TODO: how to get 500 here?
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {

            });
        });

        describe(`POST /:id/settings`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {

            });
        });

        describe(`DELETE /:id/delete`, () => {
            it(`should respond with status 500 and proper error msg`, (done) => {

            });
        });
    });
});