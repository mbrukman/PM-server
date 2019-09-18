const scheduledJobsFactory = require("./scheduled-jobs.factory");
const mapStructureFactory = require("./map-structure.factory");
const mapResultFactory = require("./map-result.factory");
const TestDataManager = require("./test-data-manager");
const projectsFactory = require("./projects.factory");
const processFactory = require("./process.factory");
const vaultsFactory = require("./vaults.factory");
const agentFactory = require("./agent.factory");
const mapsFactory = require("./maps.factory");
const agentResultFactory = require("./agent-result.factory");

module.exports = {
  agentResultFactory,
  scheduledJobsFactory,
  mapStructureFactory,
  mapResultFactory,
  projectsFactory,
  TestDataManager,
  processFactory,
  vaultsFactory,
  agentFactory,
  mapsFactory
};
