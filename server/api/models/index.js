const Agent = require("./agent.model");
const Group = require("./group.model");
const Log = require("./logs.model");
const Map = require("./map.model");
const UserModel = require("./user.model");
const UserGroupModel = require("./user-group.model");
const { MapPolicyModel } = require("./project-policy/map-policy.model");
const { ProjectPolicyModel } = require("./project-policy/project-policy.model");
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
const {
  ProjectPoliciesModel
} = require("./project-policy/project-policies.model");

module.exports = {
  Agent,
  MapPolicyModel,
  ProjectPolicyModel,
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
  ProjectPoliciesModel,
  UserModel,
  UserGroupModel,
  Project,
  ScheduledJob,
  Vault,
  Socket
};
