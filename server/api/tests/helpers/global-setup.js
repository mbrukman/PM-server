const startKaholo = require("../../../helpers/index");
// const { envDir } = require("../../../env");
// const fs = require("fs");
// const { MongoMemoryServer } = require("mongodb-memory-server");
module.exports = async () => {
  // const prodConfigPath = `${envDir}/config.json`;
  // const testConfigPath = `${envDir}/config.test.json`;
  // const prodConfig = JSON.parse(fs.readFileSync(prodConfigPath, "utf-8"));

  // DO NOT DELETE
  // const mongoMemServer = new MongoMemoryServer({});
  // const connectionString = await mongoMemServer.getConnectionString();
  // global.mongoMemServer = mongoMemServer;
  // prodConfig.dbURI = connectionString;
  // fs.writeFileSync(testConfigPath, JSON.stringify(prodConfig));

  // delete require.cache[testConfigPath];
  // delete require.cache[
  //   Object.keys(require.cache).filter(i => i.includes("env/enviroment"))[0]
  // ];

  global.server = startKaholo();
};
