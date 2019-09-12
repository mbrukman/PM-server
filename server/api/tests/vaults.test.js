const {TestDataManager, vaultsFactory} = require('./factories');
const VaultModel = require('../../api/models/vault.model');
const {setupDB} = require('./helpers/test-setup');
const axios = require('axios');

const baseApiURL = 'http://127.0.0.1:3000/api';

setupDB('vaultsTesting');

describe("All vaults endpoints are working as expected.", () => {
    let testDataManager;


    beforeEach(async (done) => {
        testDataManager = new TestDataManager(VaultModel);
        await testDataManager.generateInitialCollection(
            vaultsFactory.generateVaults(),
            {},
            null,
            'key description id'
        );
        done();
    });

    describe("Get all vaults, GET /vaults", () => {

    it('should return all vaults in system', async (done) => {
        try {
            const response = await axios.get(`${baseApiURL}/vault`);
            expect.assertions(2);
            expect(response.status).toBe(200);
            expect(response.data.length).toEqual(testDataManager.collection.length);
            done();
        } catch (err) {
            console.log(err.message);
            throw err;
        }
    });
    });

    describe('POST /vault, save new vault', () => {

    it('should create, save and return new vault', async (done) => {
        try {
            const expected = vaultsFactory.generateSingleVault();
            testDataManager.pushToCollection(expected);

            const receivedResponse = await axios.post(`${baseApiURL}/vault`, expected);
            const {data} = receivedResponse;

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');

            expect(data.key).toBe(expected.key);
            expect(data._id).toBe(expected._id);
            expect(data.description).toBe(expected.description);

            done();
        } catch (err) {
            console.log(err);
            throw err;
        }
    });

    it('should not create', async (done) => {
        try {
            await axios.post(`${baseApiURL}/vault`);
        } catch (err) {
            const {response} = err;
            expect(response.status).toBe(500);
            expect(response.statusText).toBe('Internal Server Error');

            done();
        }
    });

    it('should not create, save and return vault with wrong body passed to it', async (done) => {
        try {
            await axios.post(`${baseApiURL}/vault`, {message: 'xyz', vault: 6131});
        } catch (err) {
            const {response} = err;
            expect(response.status).toBe(500);
            expect(response.statusText).toBe('Internal Server Error');

            done();
        }
    });
    });


    describe('PUT /vault, Update already created vault', () => {

    it('should update a vault and return old record', async (done) => {
        try {
            const expected = testDataManager.collection[0];
            const receivedResponse = await axios.put(`${baseApiURL}/vault/${expected._id}`, {
                description: 'That is a random key with random value, why even bother?'
            });

            expect(receivedResponse.status).toBe(200);
            expect(receivedResponse.statusText).toBe('OK');

            expect(receivedResponse.data.description).toBe(expected.description);

            done();
        } catch (err) {
            console.log(err);
            throw err;
        }
    });
    });


    describe('DELETE /vault, Delete previously created vault', () => {

    it('should respond with OK and deleted count', async (done) => {
        try {
            const vault = testDataManager.collection[0];
            const receivedResponse = await axios.delete(`${baseApiURL}/vault/${vault._id}`);
            testDataManager.removeFromCollection(vault);
            expect(receivedResponse.status).toBe(204);
            expect(receivedResponse.statusText).toBe('No Content');

            done();
        } catch (err) {
            console.log(err);
            throw err;
        }
    });
    });
});
