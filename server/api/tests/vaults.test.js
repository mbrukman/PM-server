const {initTestDataManager, generateVaults} = require('./factories');
const VaultModel = require('../../api/models/vault.model');
const baseUrl = 'localhost:3000';
const {setupDB} = require('./helpers/test-setup');
const {sortBy} = require('lodash');
const request = require('supertest');

setupDB('testing');

describe("Get all vaults, GET /vaults", () => {
    const testDataManager = initTestDataManager(VaultModel);


    beforeAll(async (done) => {
        await testDataManager.clear(VaultModel);
        await testDataManager.initialise(
            generateVaults,
            null,
            'key description id'
        );
        done();
    });

    it('Gets the list of all vaults in the system', async () => {
        try {
            const response = await request(baseUrl).get(`/api/vault`)
                .withCredentials();
            expect(response.status).toBe(200);
            expect(response.body.length).toEqual(testDataManager.collection.length);
            const expected = sortBy(response.body, 'key');
            const received = sortBy(testDataManager.collection, 'key');
            received.forEach((item, idx) => {
                expect(item.key).toBe(expected[idx].key);
                expect(item.id).toBe(expected[idx].id);
                expect(item.description).toBe(expected[idx].description);
            })
        } catch (err) {
            console.log(err.message)
            throw err;
        }
    })
});
