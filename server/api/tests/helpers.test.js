const {initTestDataManager} = require('./factories');
const {generateVaults} = require('./factories/vaults.factory')
const VaultModel = require('../../api/models/vault.model');
const {setupDB} = require('./helpers/test-setup');
const {sortBy} = require('lodash');

setupDB('testing');

const testDataManager = initTestDataManager(VaultModel);

describe('Initialise TestDataManager', () => {
    it('should initialise the collection and return it', async () => {
        try {

            const rawReceived = await testDataManager.initialise(
                generateVaults,
                {},
                null,
                'key description id'
            );
            const rawExpected = await VaultModel.find({}, 'key description id');

            expect(rawReceived.length).toEqual(rawExpected.length);

            const expected = sortBy(rawExpected, 'key');
            const received = sortBy(rawReceived, 'key');

            received.forEach((item, idx) => {
                expect(item.key).toBe(expected[idx].key);
                expect(item.id).toBe(expected[idx].id);
                expect(item.description).toBe(expected[idx].description);
            });
        } catch (err) {
            console.log(err.message);
            throw err;
        }
    });

    it('should not initialise collection in DataTestManager without model.', async () => {
        try {

            const rawReceived = await testDataManager.initialise(
                {},
                null,
                null,
                'key description id'
            );
            const rawExpected = await VaultModel.find({}, 'key description id');


        } catch (err) {
            expect(err.message).toBe('No model factory was passed!');
            console.log(err.message);
        }
    });

});


describe("TestDataManager's functions are working correctly.", () => {

    beforeEach(async (done) => {
        await testDataManager.clear(VaultModel);
        await testDataManager.initialise(
            generateVaults,
            {},
            null,
            'key description id'
        );
        done();
    });

    describe('Deleting single record via DataTestManager.', () => {
        let modelToBeDeleted = null;

        beforeEach(async (done) => {
            modelToBeDeleted = await VaultModel.findOne();
            done();
        });

        it('should delete document works with single object passed to it and return the count.', async () => {
            try {
                const received = await testDataManager.remove(modelToBeDeleted);

                expect(received.deletedCount).toBe(1);
                expect(received.ok).toBe(1);

            } catch (err) {
                console.log(err.message);
                throw err;
            }
        });

        it('should not delete a document without passing id', async () => {
            try {
                const received = await testDataManager.remove({});

                throw new Error("This request should fail!")

            } catch (err) {
                expect(err.message).toBe('Passed document has no id property!');
            }
        });
    });


    describe('A function to add document  to collection in DataTestManager works.', () => {

        it('should save and return new document', async () => {
            try {
                const expected = {
                    key: 'random key',
                    value: 'random secret value',
                    description: 'this will be a secret of my secrets!'
                };
                const received = await testDataManager.pushToCollectionAndSave({
                    key: 'random key',
                    value: 'random secret value',
                    description: 'this will be a secret of my secrets!'
                });

                expect(received.key).toBe(expected.key);
                expect(received.value).toBe(expected.value);
                expect(received.description).toBe(expected.description);
                expect(received._id).toBeTruthy();

            } catch (err) {
                console.log(err.message);
                throw err;
            }
        });

        it('should not add new document without passed data', async () => {
            try {
                const item = await testDataManager.pushToCollectionAndSave();
                if (item)
                    throw new Error('There should be no object received in this test!');

            } catch (err) {
                expect(err.message).toBe('No item to add to collection!');
            }
        });
    });
});
