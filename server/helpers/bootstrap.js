const agentsService = require("../api/services/agents.service");
const pluginsService = require("../api/services/plugins.service");
const scheduledJobsService = require("../api/services/scheduled-job.service");

module.exports = {
    bootstrap: (app) => {
        console.log("Restarting agents status");
        agentsService.restartAgentsStatus();
        console.log("Reloading plugins");
        pluginsService.loadModules(app);
        console.log("Loading scheduled jobs");
        scheduledJobsService.loadJobs(app);
        // setTimeout(() => {
        //     pluginsService.loadPlugins();
        // }, 3000);
    }
};
