const {initTestDataManager} = require('./factories');
const {generateVaults, generateSingleVault} = require('./factories/vaults.factory');
const VaultModel = require('../../api/models/vault.model');
const {setupDB} = require('./helpers/test-setup');
const {sortBy} = require('lodash');
const axios = require('axios');

setupDB('testing',);

const testDataManager = initTestDataManager(VaultModel, generateSingleVault, generateVaults);

describe("Get all vaults, GET /vaults", () => {

    beforeAll(async (done) => {
        await testDataManager.clear(VaultModel);
        await testDataManager.initialise(
            generateVaults,
            {},
            null,
            'key description id'
        );
        done();
    });

    it('should return all vaults in system', async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:3000/api/vault`);

            expect(response.status).toBe(200);
            expect(response.data.length).toEqual(testDataManager.collection.length);
            const expected = sortBy(response.data, 'key');
            const received = sortBy(testDataManager.collection, 'key');
            received.forEach((item, idx) => {
                expect(item.key).toBe(expected[idx].key);
                expect(item.id).toBe(expected[idx].id);
                expect(item.description).toBe(expected[idx].description);
            })
        } catch (err) {
            console.log(err.message);
            throw err;
        }
    });
});

describe('POST /vault, save new vault', function () {
    it('should create, save and return new vault', async () => {
        try {
            const expected = generateSingleVault();
            testDataManager.pushToCollection(expected);

            const receivedResponse = await axios.post(`http://127.0.0.1:3000/api/vault`, expected);
            const {data} = receivedResponse;

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');

            expect(data.key).toBe(expected.key);
            expect(data._id).toBe(expected._id);
            expect(data.description).toBe(expected.description);
        } catch (err) {
            console.log(err);
            throw err;
        }
    });

    it('should not create', async () => {
        try {
            await axios.post(`http://127.0.0.1:3000/api/vault`);
        } catch (err) {
            const {response} = err;
            expect(response.status).toBe(500);
            expect(response.statusText).toBe('Internal Server Error');
        }
    });

    it('should not create, save and return vault with wrong body passed to it', async () => {
        try {
            await axios.post(`http://127.0.0.1:3000/api/vault`, {message: 'xyz', vault: 6131});
        } catch (err) {
            const {response} = err;
            expect(response.status).toBe(500);
            expect(response.statusText).toBe('Internal Server Error');
        }
    });
});


describe('PUT /vault, Update already creted vault', () => {

    beforeAll(async (done) => {
        await testDataManager.clear(VaultModel);
        await testDataManager.initialise(
            generateVaults,
            {},
            null,
            'key description id'
        );
        done();
    });

    it('should update a vault and return old record', async () => {
        try {
            const vault = testDataManager.collection[0];
            const expected = vault;
            const receivedResponse = await axios.put(`http://127.0.0.1:3000/api/vault/${vault._id}`, {
                description: 'That is a random key with random value, why even bother?'
            });

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');

            expect(receivedResponse.data.description).toBe(expected.description);
        } catch (err) {
            console.log(err);
            throw err;
        }
    });
});


describe('DELETE /vault, Delete previously created vault', () => {

    beforeAll(async (done) => {
        await testDataManager.clear(VaultModel);
        await testDataManager.initialise(
            generateVaults,
            {},
            null,
            'key description id'
        );
        done();
    });

    it('should respond with OK and deleted count', async () => {
        try {
            const vault = testDataManager.collection[0];
            const receivedResponse = await axios.delete(`http://127.0.0.1:3000/api/vault/${vault._id}`);
            expect(receivedResponse.status).toBe(204);
            expect(receivedResponse.statusText).toBe('No Content');
        } catch (err) {
            console.log(err);
            throw err;
        }

    });
});
