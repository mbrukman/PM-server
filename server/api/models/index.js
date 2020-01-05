const Agent = require("./agent.model");
const Group = require("./group.model");
const Log = require("./logs.model");
const Map = require("./map.model");
const {
  MapResult,
  AgentResultModel,
  AgentResult,
  ActionResult,
  ActionResultModel,
  statusEnum
} = require("./map-results.model");
const {
  MapStructure,
  ActionModel,
  ProcessModel
} = require("./map-structure.model");
const Trigger = require("./map-trigger.model");
const Plugin = require("./plugin.model");
const Project = require("./project.model");
const ScheduledJob = require("./scheduled-job.model");
const Vault = require("./vault.model");
const Socket = require("./socket.model");

module.exports = {
  Agent,
  Group,
  Log,
  Map,
  MapResult,
  AgentResultModel,
  AgentResult,
  ActionResult,
  ActionResultModel,
  statusEnum,
  MapStructure,
  ActionModel,
  ProcessModel,
  Trigger,
  Plugin,
  Project,
  ScheduledJob,
  Vault,
  Socket
};
