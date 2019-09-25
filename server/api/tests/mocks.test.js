const request = require('supertest');

const baseApiURL = 'http://127.0.0.1:3000/api';
describe("All vaults endpoints are working as expected.", () => {
    jest.mock('../../env/test-mocks');
    it('should use mocks', () => {
        return request(baseApiURL)
            .get(`/vault`)
            .expect(200)
            .then(({ text }) => {
                expect(text).toEqual('mocked!')
            });
    });
})

