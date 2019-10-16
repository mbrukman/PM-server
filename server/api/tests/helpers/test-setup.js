const mongoose = require("mongoose");

mongoose.set("useCreateIndex", true);

async function removeAllCollections() {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany();
  }
}

async function dropAllCollections() {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    try {
      await collection.drop();
    } catch (error) {
      // Sometimes this error happens, but you can safely ignore it
      if (error.message === "ns not found") return;
      if (
        error.message.includes("a background operation is currently running")
      ) {
        return;
      }
      console.log(error.message);
    }
  }
}

module.exports = {
  removeAllCollections,
  dropAllCollections,
  setupDB() {
    beforeAll(async () => {
      await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });
      await dropAllCollections();
    });

    afterEach(async () => {
      await removeAllCollections();
    });

    afterAll(async () => {
      await dropAllCollections();
      await mongoose.disconnect();
    });
  }
};
