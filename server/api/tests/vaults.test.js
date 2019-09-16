const {TestDataManager, vaultsFactory} = require('./factories');
const VaultModel = require('../../api/models/vault.model');
const {setupDB} = require('./helpers/test-setup');
const request = require('supertest');

const baseApiURL = 'http://127.0.0.1:3000/api';

setupDB('vaultsTesting');

describe("All vaults endpoints are working as expected.", () => {
    let testDataManager;


    beforeEach(() => {
        testDataManager = new TestDataManager(VaultModel);
        return testDataManager.generateInitialCollection(
            vaultsFactory.generateVaults(),
            {},
            null,
            'key description id'
        );
    });

    describe("Get all vaults, GET /vaults", () => {

        it('should return all vaults in system', () => {
            return request(baseApiURL)
                .get(`/vault`)
                .expect(200)
                .expect('Content-Type', /json/)
                .then((res) => {
                    expect.assertions(1);
                    expect(res.body.length).toEqual(testDataManager.collection.length);
                });
        });
    });

    describe('POST /vault, save new vault', () => {

        it('should create, save and return new vault', () => {
            const expected = vaultsFactory.generateSingleVault();
            testDataManager.pushToCollection(expected);

            return request(baseApiURL)
                .post(`/vault`)
                .send(expected)
                .expect(200)
                .expect('Content-Type', /json/)
                .then(({body}) => {
                    expect.assertions(3);
                    expect(body.key).toBe(expected.key);
                    expect(body._id).toBe(expected._id);
                    expect(body.description).toBe(expected.description);
                });
        });

        it('should not create', (done) => {
            return request(baseApiURL).post(`/vault`)
                .send()
                .expect(500, done);
        });

        it('should not create, save and return vault with wrong body passed to it', (done) => {
            return request(baseApiURL).post(`/vault`)
                .send({message: 'xyz', vault: 6131})
                .expect(500, done)
        });
    });


    describe('PUT /vault, Update already created vault', () => {

        it('should update a vault and return old record', () => {
            const expected = testDataManager.collection[0];
            return request(baseApiURL)
                .put(`/vault/${expected._id}`)
                .send({
                    description: 'That is a random key with random value, why even bother?'
                })
                .expect(200)
                .expect('Content-Type', /json/)
                .then(({body}) => {
                    expect.assertions(1);
                    expect(body.description).toBe(expected.description);
                });
        });
    });


    describe('DELETE /vault, Delete previously created vault', () => {

        it('should respond with OK and deleted count', () => {
            const vault = testDataManager.collection[0];
            return request(baseApiURL)
                .del(`/vault/${vault._id}`)
                .expect(204)
                .then(() => {
                    testDataManager.removeFromCollection(vault);
                });
        });
    });
});
