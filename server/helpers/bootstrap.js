const winston = require("winston");
const agentsService = require("../api/services/agents.service");
const pluginsService = require("../api/services/plugins.service");
const scheduledJobsService = require("../api/services/scheduled-job.service");

module.exports = {
  bootstrap: async app => {
    winston.log("info", "Restarting agents status");
    await agentsService.restartAgentsStatus();
    winston.log("info", "Establish agents socket");
    await agentsService.establishSocket(app.io);
    winston.log("info", "Reloading plugins");
    pluginsService.loadModules(app);
    winston.log("info", "Loading scheduled jobs");
    scheduledJobsService.loadJobs(app);
    // setTimeout(() => {
    //     pluginsService.loadPlugins();
    // }, 3000);
  }
};
