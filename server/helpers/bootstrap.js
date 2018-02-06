const agentsService = require("../api/services/agents.service");
const pluginsService = require("../api/services/plugins.service");
const scheduledJobsService = require("../api/services/scheduled-job.service");

module.exports = {
    bootstrap: (app) => {
        winston.log('info', "Restarting agents status");
        agentsService.restartAgentsStatus();
        winston.log('info', "Reloading plugins");
        pluginsService.loadModules(app);
        winston.log('info', "Loading scheduled jobs");
        scheduledJobsService.loadJobs(app);
        // setTimeout(() => {
        //     pluginsService.loadPlugins();
        // }, 3000);
    }
};
