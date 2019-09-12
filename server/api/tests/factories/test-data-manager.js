module.exports = class TestDataManager {
    // you can also extend this class for each of your test suites and overwrite some of the methods

    constructor(mongooseModel) {
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
        if (!item)
            throw new Error("No item to add to collection!");
        else
            try {
                return this._createModel(item);
            } catch (err) {
                throw err;
            }
    }

    remove(document) {
        if (document && document._id) {
            return this.currentMongooseModel
                .findByIdAndRemove(document._id)
                .then((response) => {
                    this.collection = this.collection.filter(item => item.id !== document.id);
                    return response;
                });
        } else {
            throw new Error('Passed document has no id property!');
        }
    }

    removeFromCollection(document) {
        if (document && document._id) {
            this.collection = this.collection.filter(item => item.id !== document._id);
            return this.collection;
        } else {
            throw new Error('Passed document has no id property!');
        }
    }

    async clear() {
        try {
            const response = await this.currentMongooseModel.deleteMany({});
            const resp = await this.currentMongooseModel.find({});
            this.collection = [];
            return this.collection;
        } catch (err) {
            console.log(err.message, 'In function clear of TestDataManager');
            throw 'There was an error with clearing the collection and the database!';
        }
    }

    async generateInitialCollection(generatedData) {
        if (!generatedData || typeof generatedData !== 'object') {
            throw new Error("No generated data was passed!");
        }

        try {
            this.collection = await this.currentMongooseModel.insertMany(generatedData, {ordered: false});
            return this.collection;
        } catch (err) {
            throw err;
        }
    }
}
