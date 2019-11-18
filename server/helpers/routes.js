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
const userGroupApi = require("../api/routes/user-group.routes");
const usersApi = require("../api/routes/user.routes");
const authApi = require("../api/routes/auth.routes");

const authMiddleware = require("./auth.middleware");

module.exports = function bootstrapApi(app) {
  app.use("/api/settings", authMiddleware, settingsApi);
  app.use("/api/maps", authMiddleware, mapsApi);
  app.use("/api/plugins", authMiddleware, pluginsApi);
  app.use("/api/triggers", authMiddleware, triggersApi);
  // TODO: agents auth
  app.use("/api/agents", agentsApi);
  app.use("/api/projects", authMiddleware, projectsApi);
  app.use("/api/scheduled-jobs", authMiddleware, scheduledJobsApi);
  app.use("/api/vault", authMiddleware, vaultApi);
  app.use("/api/config-token", authMiddleware, configTokenApi);
  app.use("/api/autocomplete", authMiddleware, autoCompleteApi);
  app.use("/api/users", authMiddleware, usersApi);
  app.use("/api/user-groups", authMiddleware, userGroupApi);
  app.use("/api/auth", authApi);
};
