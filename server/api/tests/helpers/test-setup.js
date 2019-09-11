const mongoose = require('mongoose');
const env = require('../../../env/enviroment');

mongoose.set('useCreateIndex', true);

async function removeAllCollections() {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany()
    }
}

async function dropAllCollections() {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        try {
            await collection.drop()
        } catch (error) {
            // Sometimes this error happens, but you can safely ignore it
            if (error.message === 'ns not found') return;
            if (error.message.includes('a background operation is currently running')) return;
            console.log(error.message)
        }
    }
}


function changeDbName(dbName) {
    return env.dbURI.replace(/\/(?=[^\/]*$).*\?(?=[^\?]*$)/g, `/${dbName}?`);

}

module.exports = {
    removeAllCollections,
    dropAllCollections,
    setupDB(dbName = 'test') {
        // Connect to Mongoose
        beforeAll(async () => {
            await mongoose.connect(changeDbName(dbName), {useNewUrlParser: true});
            await dropAllCollections();
        });
        //
        // // Cleans up database between each test
        afterEach(async () => {
            await removeAllCollections();
        });

        // Disconnect Mongoose
        afterAll(async () => {
            await dropAllCollections();
            await mongoose.disconnect();
        });
    }
};
