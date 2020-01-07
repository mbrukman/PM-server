const settingsApi = require("../api/routes/settings.routes");
const mapsApi = require("../api/routes/maps.routes");
const pluginsApi = require("../api/routes/plugins.routes");
const agentsApi = require("../api/routes/agents.routes");
const projectsApi = require("../api/routes/projects.routes");
const triggersApi = require("../api/routes/triggers.routes");
const scheduledJobsApi = require("../api/routes/scheduled-jobs.routes");
const vaultApi = require("../api/routes/vault.routes");
const configTokenApi = require("../api/routes/config-token.routes");
const autoCompleteApi = require("../api/routes/autocomplete.routes");
const tosApi = require("../api/routes/tos.routes");



module.exports = function bootstrapApi(app) {
    app.use("/api/settings", settingsApi);
    app.use("/api/maps", mapsApi);
    app.use("/api/plugins", pluginsApi);
    app.use("/api/triggers", triggersApi);
    app.use("/api/agents", agentsApi);
    app.use("/api/projects", projectsApi);
    app.use("/api/scheduled-jobs", scheduledJobsApi);
    app.use("/api/vault", vaultApi);
    app.use("/api/config-token", configTokenApi);
    app.use("/api/autocomplete", autoCompleteApi);
    app.use("/api/tos", tosApi);
}
