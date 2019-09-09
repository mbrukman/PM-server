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

    });

    describe('Negative', () => {

    });
});