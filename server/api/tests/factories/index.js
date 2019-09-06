const {generateVaults} = require('./vaults.factory');


class TestDataManager {
    constructor(mongooseModel) {
        this.collection = [];
        this.currentMongooseModel = mongooseModel;
    }

    push(item) {
        if (item) {
            return this.currentMongooseModel.create(item).then(item => {
                this.collection.push(item);
                return item;
            });
        } else {
            throw new Error("No item to add to collection!");
        }
    }

    remove(document) {
        if (document._id) {
            return this.currentMongooseModel
                .deleteOne(document)
                .then(() => this.collection = this.collection.filter(item => item._id !== document._id));
        } else {
            throw new Error('Document does not have _id!');
        }
    }

    async clear() {
        try {
            await this.currentMongooseModel.deleteMany({});
            this.collection = [];
            return this.collection;
        } catch (err) {
            console.log(err.message, 'In function clear of TestDataManager');
            throw err.message;
        }
    }

    async initialise(generateDateCb, collectionOptions = {}, selectedFields = '') {
        const data = generateDateCb();
        await this.currentMongooseModel.create(data);
        this.collection = await this.currentMongooseModel.find({}, selectedFields, collectionOptions);
        return this.collection;

    }
}

const initTestDataManager = (mongooseModel) => {
    return new TestDataManager(mongooseModel);
};


module.exports = {
    generateVaults,
    initTestDataManager,
};