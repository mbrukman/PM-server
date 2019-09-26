const request = require('supertest');
const app = 'localhost:3000';

describe('Settings tests', () => {
    describe('GET api/settings', () => {
        it.todo(`should handle lack of setup of dbURI`);
        // change config?

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

        it.todo(`should respond with 'false' for invalid db connection`);
        // disconnect with db?
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