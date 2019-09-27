const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = 'localhost:3000';
let originalConfig = {};
const testConfig = { "upload_path": "uploads", "interval_time": 5000, "retries": 3, "page_size": 15, "dbURI": "mongodb+srv://admin:7vXYF4nNu8B9SnH5@cluster0-qnjcz.mongodb.net/jest-settings-test", "serverKey": "b92a5c991d68e544a3fa21da9b083903" }

describe('Settings tests', () => {

    beforeAll(() => {
        // copy original env/config.json so the tests won't override it
        originalConfig = require('../../env/config');
    });

    afterAll(() => {
        // recreate the original config
        fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(originalConfig));
    });

    describe('GET api/settings', () => {
        it(`should respond with 'true' for valid db connection`, () => {
            return request(app)
                .get('/api/settings')
                .expect(200)
                .then(({ body }) => {
                    expect(body.isSetup).toBe(true);
                    expect(body.version).toBeDefined();
                    expect(typeof body.version).toBe('string');
                });
        });

        describe('in case of no db uri', () => {
            beforeAll(() => {
                delete testConfig.dbURI;
                fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(testConfig));
            });

            it(`should handle lack of setup of dbURI`, () => {
                return request(app)
                    .get('/api/settings')
                    .expect(200)
                    .then(({ body }) => {
                        expect(body.isSetup).toBe(false);
                        expect(body.version).toBeDefined();
                        expect(typeof body.version).toBe('string');
                    });
            });
        });

        describe('in case of invalid db uri', () => {
            beforeAll(() => {
                testConfig.dbURI = "wrong-uri";
                fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(testConfig));
            });

            it(`should respond with 'false' for invalid db connection`, () => {
                return request(app)
                    .get('/api/settings')
                    .expect(200)
                    .then(({ body }) => {
                        expect(body.isSetup).toBe(false);
                        expect(body.version).toBeDefined();
                        expect(typeof body.version).toBe('string');
                    });
            });
        });
    });

    describe('POST api/settings/db', () => {
        it(`should respond with 204 after successful connection to given db uri`, () => {
            return request(app)
                .post('/api/settings/db')
                .send({ uri: 'mongodb+srv://admin:7vXYF4nNu8B9SnH5@cluster0-qnjcz.mongodb.net/jest-settings-test' })
                .expect(204);
        });

        it(`should respond with 500 for missing req.body.uri`, () => {
            return request(app)
                .post('/api/settings/db')
                .send({})
                .expect(500)
                .then(({ text }) => {
                    expect(text).toEqual('Missing parameters');
                });
        });

        it(`should respond with 500 for error connecting to db`, () => {
            return request(app)
                .post('/api/settings/db')
                .send({ uri: 'mongodb+srv://admin:wrong-password@cluster0-qnjcz.mongodb.net/jest-settings-test' })
                .expect(500);
        });
    });
});