const {generateProjects,generateSingleProject} = require('./projects.factory');


class TestDataManager {
    constructor(mongooseModel) {
        this.collection = [];
        this.currentMongooseModel = mongooseModel;
    }

    pushToCollection(item){
        this.collection.push(item)
    }

    updateCollection(projectId,project){
        this.collection[this.collection.findIndex(item => item._id == projectId)] = project;
    }

    deleteCollection(projectId){
        this.collection.splice(this.collection.findIndex(item => item._id == projectId),1);
    }

    generateNewItem(schemaOptions = {}) {
        return generateSingleProject(schemaOptions);
    }

    getProjectIdByName(projectName){
        return this.collection[this.collection.findIndex(item => item.name == projectName)].id;
    }

    async _createModel(item) {
        try {
            const savedItem = await this.currentMongooseModel
                .create(item);
            this.collection.push(savedItem);
            return savedItem;
        } catch (err) {
            console.log(err.message, 'Something went wrong in _createModel of TestDataManager!');
            throw new Error('There was an error with adding items to MongoDB!');
        }
    }

    async push(item) {
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

    async initialise(generateDateCb, collectionOptions = {}, selectedFields = '',fixedData) {
        const data = generateDateCb();
        data.push(...fixedData);
        await this.currentMongooseModel.create(data);
        this.collection = await this.currentMongooseModel.find({}, selectedFields, collectionOptions);
        return this.collection;

    }
}

const initTestDataManager = (mongooseModel) => {
    return new TestDataManager(mongooseModel);
};


module.exports = {
    generateProjects,
    initTestDataManager,
};