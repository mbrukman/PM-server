const request = require('supertest');
const app = 'localhost:3000';

describe('Settings tests', () => {
    describe('GET api/settings/', () => {
        it(`should handle lack of setup of dbURI`, () => {
            expect.assertions(1);
        });
        it(`should respond with 'true' for valid db connection`, () => {
            expect.assertions(1);
        });
        it(`should respond with 'false' for invalid db connection`, () => {
            expect.assertions(1);
        });
    });
    describe('POST api/settings/db', () => {
        it(`should respond with 204 after successful connection to db`, () => {
            expect.assertions(1);
        });
        it(`should respond with 500 for missing req.body.uri`, () => {
            expect.assertions(1);
        });
        it(`should respond with 500 for error connecting to db`, () => {
            expect.assertions(1);
        });
    });
});