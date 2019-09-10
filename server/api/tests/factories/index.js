class TestDataManager {
    // you can also expand this class for each of your test suites and overwrite some of the methods

    constructor(mongooseModel, singularModelFactory, multipleModelFactory) {
        this.collection = [];
        this.currentMongooseModel = mongooseModel;
    }
    prepareItem(itemData) { // if you need ANY additional functionality to be added to items
        if (!itemData || typeof itemData !== 'object') {
            throw new Error('Passed item is not an object!');
        }
        return itemData;
    }

    pushToCollection(item) {
        item = this.prepareItem(item);
        this.collection.push(item);
        return item;
    }

    async _createModel(item) {
        try {
            item = this.prepareItem(item);
            const savedItem = await this.currentMongooseModel
                .create(item);
            this.collection.push(savedItem);
            return savedItem;
        } catch (err) {
            console.log(err.message, 'Something went wrong in _createModel of TestDataManager!');
            throw new Error('There was an error with adding items to MongoDB!');
        }
    }

    async pushToCollectionAndSave(item) {
        try {
            return this._createModel(item);
        } catch (err) {
            if (!item)
                throw new Error("No item to add to collection!");
            else
                throw new Error(err.message);
        }
    }

    remove(document) {
        if (document && document.id) {
            return this.currentMongooseModel
                .deleteOne(document)
                .then((response) => {
                    this.collection = this.collection.filter(item => item.id !== document.id);
                    return response;
                });
        } else {
            throw new Error('Passed document has no id property!');
        }
    }

    async clear() {
        try {
            await this.currentMongooseModel.deleteMany({});
            this.collection = [];
            return this.collection;
        } catch (err) {
            console.log(err.message, 'In function clear of TestDataManager');
            throw 'There was an error with clearing the collection and the database!';
        }
    }

    async initialise(modelFactory, schemaOptions = {}, collectionOptions = {}, selectedFields = '') {
        if (!modelFactory) {
            throw new Error("No model factory was passed!");
        }
        const data = modelFactory();
        await this.currentMongooseModel.create(data);
        this.collection = await this.currentMongooseModel.find({}, selectedFields, collectionOptions);
        return this.collection;
    }
}

const initTestDataManager = (mongooseModel) => {
    return new TestDataManager(mongooseModel);
};


module.exports = {
    initTestDataManager,
};
