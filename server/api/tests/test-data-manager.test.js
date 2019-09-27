const { TestDataManager, vaultsFactory } = require("./factories");
const VaultModel = require("../../api/models/vault.model");
const { sortBy } = require("lodash");

describe("Make sure DataTestManager is working as expected", () => {
  let testDataManager;

  beforeEach(() => {
    testDataManager = new TestDataManager(VaultModel);
  });

  describe("Initialise TestDataManager", () => {
    it("should initialise the collection and return it", async done => {
      try {
        const rawReceived = await testDataManager.generateInitialCollection(
            vaultsFactory.generateVaults()
        );
        const rawExpected = await VaultModel.find({});

        expect(rawReceived.length).toEqual(rawExpected.length);

        const expected = sortBy(rawExpected, "key");
        const received = sortBy(rawReceived, "key");

        received.forEach((item, idx) => {
          expect(item.key).toBe(expected[idx].key);
          expect(item.id).toBe(expected[idx].id);
          expect(item.description).toBe(expected[idx].description);
        });

        done();
      } catch (err) {
        console.log(err.message);
        throw err;
      }
    });

    it("should not initialise collection in DataTestManager without model.", async done => {
      try {
        await testDataManager.generateInitialCollection();
      } catch (err) {
        expect(err.message).toBe("No generated data was passed!");
        done();
      }
    });
  });

  describe("Deleting single record via DataTestManager.", () => {
    beforeEach(async () => {
      await testDataManager.generateInitialCollection(
          vaultsFactory.generateVaults()
      );
    });

    it("should delete document works with single object passed to it and return the count.", async done => {
      try {
        const randomlyFoundModel = await VaultModel.findOne({});
        const received = await testDataManager.remove(randomlyFoundModel);

        expect(received._id).toMatchObject(randomlyFoundModel._id);
        expect(received.key).toBe(randomlyFoundModel.key);
        expect(received.value).toBe(randomlyFoundModel.value);

        done();
      } catch (err) {
        console.log(err.message);
        throw err;
      }
    });

    it("should not delete a document without passing id", async done => {
      try {
        await testDataManager.remove({});
        throw new Error("This request should fail!");
      } catch (err) {
        expect(err.message).toBe("Passed document has no id property!");

        done();
      }
    });
  });

  describe("A function to add document  to collection in DataTestManager works.", () => {
    it("should save and return new document", async done => {
      try {
        const expected = {
          key: "random key",
          value: "random secret value",
          description: "this will be a secret of my secrets!"
        };
        const received = await testDataManager.pushToCollectionAndSave({
          key: "random key",
          value: "random secret value",
          description: "this will be a secret of my secrets!"
        });

        expect(received.key).toBe(expected.key);
        expect(received.value).toBe(expected.value);
        expect(received.description).toBe(expected.description);
        expect(received._id).toBeTruthy();

        done();
      } catch (err) {
        console.log(err.message);
        throw err;
      }
    });

    it("should not add new document without passed data", async done => {
      try {
        const item = await testDataManager.pushToCollectionAndSave();
        if (item) {
          throw new Error("There should be no object received in this test!");
        }
      } catch (err) {
        expect(err.message).toBe("No item to add to collection!");

        done();
      }
    });
  });
});
