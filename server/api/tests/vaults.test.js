const {initTestDataManager, generateVaults} = require('./factories');
const VaultModel = require('../../api/models/vault.model');
const {setupDB} = require('./helpers/test-setup');
const {sortBy} = require('lodash');
const axios = require('axios');
// const {server} = require('../../app');

setupDB('testing',);

const testDataManager = initTestDataManager(VaultModel);

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

    it('Gets the list of all vaults in the system', async () => {
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
    it('POSITIVE, Create new vault with proper data', async () => {
        try {
            const expected = testDataManager.generateNewItem();
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

    it('NEGATIVE, Create new vault without data in body', async () => {
        try {
            await axios.post(`http://127.0.0.1:3000/api/vault`);
        } catch (err) {
            const {response} = err;
            expect(response.status).toBe(500);
            expect(response.statusText).toBe('Internal Server Error');
        }
    });

    it('NEGATIVE, Create new vault with wrong data in body', async () => {
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

    it('should update ', async () => {
        try {
            const vault = testDataManager.collection[0];
            const expected = Object.assign(vault, {
                description: '\'That is a random key with random value, why even bother?\''
            });
            const receivedResponse = await axios.put(`http://127.0.0.1:3000/api/vault/${expected._id}`, {
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

    it('should not return updated value', async () => {
        try {
            const vault = testDataManager.collection[0];
            const expected = Object.assign(vault, {
                value: 'Ad victoriam'
            });
            const receivedResponse = await axios.put(`http://127.0.0.1:3000/api/vault/${expected._id}`, expected);

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');

            expect(receivedResponse.data).toBe(null);
        } catch (err) {
            console.log(err);
            throw err;
        }
    });

    it('should respond with truthy value and 200 after not receiving body', async () => {
        try {
            const receivedResponse = await axios.put('http://127.0.0.1:3000/api/vault',);

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');
            expect(receivedResponse.data).toBeTruthy();
        } catch (err) {
            console.log(err);
            throw err;
        }
    });
});


describe('DELETE /vault, Delete previously created vault', () => {
    it('should respond with OK and deleted count', function () {

    });
});
