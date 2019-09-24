const scheduledJobsFactory = require("./scheduled-jobs.factory");
const actionResultsFactory = require("./action-result.factory");
const mapStructureFactory = require("./map-structure.factory");
const agentResultFactory = require("./agent-result.factory");
const mapResultFactory = require("./map-result.factory");
const TestDataManager = require("./test-data-manager");
const projectsFactory = require("./projects.factory");
const processFactory = require("./process.factory");
const vaultsFactory = require("./vaults.factory");
const actionFactory = require("./action.factory");
const groupFactory = require("./groups.factory");
const agentFactory = require("./agent.factory");
const mapsFactory = require("./maps.factory");

module.exports = {
  actionResultsFactory,
  scheduledJobsFactory,
  mapStructureFactory,
  agentResultFactory,
  mapResultFactory,
  projectsFactory,
  TestDataManager,
  processFactory,
  vaultsFactory,
  actionFactory,
  agentFactory,
  groupFactory,
  mapsFactory,
};
