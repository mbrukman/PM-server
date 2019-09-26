const { app, server, port, winston } = require("../../index");
const bootstrap = require("../../../helpers/bootstrap").bootstrap;
const { envDir } = require("../../../env");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  const mongoMemServer = new MongoMemoryServer();
  const connectionString = await mongoMemServer.getConnectionString();
  const testConfigPath = `${envDir}/config.test.json`;
  const prodConfigPath = `${envDir}/config.json`;

  const prodConfig = fs.readFileSync(prodConfigPath);

  prodConfig.dbURI = connectionString;

  fs.writeFileSync(testConfigPath, JSON.stringify(prodConfig));

  global.server = server.listen(port, () => {
    winston.log("info", `Running on localhost:${port}`);
    bootstrap(app);
  });
};
