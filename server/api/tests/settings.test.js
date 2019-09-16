const request = require('supertest');
const env = require('../../env/enviroment');
const fs = require('fs');
const path = require("path");
const {setupDB} = require('./helpers/test-setup');
let config = require('../../env/config');
const baseApiURL = 'http://127.0.0.1:3000/api';

setupDB();

describe("Settings Api", () => {

    beforeAll( () => {
        delete config.dbURI;
        config = Object.assign({}, config);
        fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
    });

    describe('Negative', () => {
        it('GET /',  () => {
            delete config.dbURI;
            config = Object.assign({}, config);
            fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
            return request(baseApiURL).get(`/settings`)
                .expect(200)
                .then(res => {
                    expect(res.body.isSetup).toBe(true);
                    expect(res.body.version).toBe(env.version);
                });

        });

        it('POST /db',  () => {
            let url = '';
            return request(baseApiURL)
                .post(`/settings/db`)
                .send({uri: url})
                .expect(500);
        });
    });

    describe('Positive', () => {

        it('Should create new config and return 204',  () => {
            let url = 'mongodb://localhost/test';

            return request(baseApiURL)
                .post(`/settings/db`)
                .send({uri: url})
                .expect(204);
        });

        it('should return 200 and new config', async () => {

            return request(baseApiURL).get(`/settings`)
                .expect(200)
                .then(res => {
                    expect(res.body.isSetup).toBe(true);
                    expect(res.body.version).toBe(env.version);
                });
        });
    });
});
