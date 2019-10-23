const request = require("request");
const fs = require("fs");
const path = require("path");
const socketService = require("./socket.service");
const winston = require("winston");
const humanize = require("../../helpers/humanize");
const Map = require("../models/map.model");
const Agent = require("../models").Agent;
const Group = require("../models").Group;

const LIVE_COUNTER = parseInt(process.env.RETRIES, 10); // attempts before agent will be considered dead
const INTERVAL_TIME = parseInt(process.env.INTERVAL_TIME, 10);
const socketNamespaceName = "/agents";

const FILTER_TYPES = Object.freeze({
  gte: "gte",
  gt: "gt",
  equal: "equal",
  contains: "contains",
  lte: "lte",
  lt: "lt"
});

// TODO: refactor into scheduler microservice
// why?
// - in node.js, setInterval returns a reference to Timout class instance, not intervalId handle number
//   that's why it's impossible to save a reference to it in a model
const runningIntervals = {};

function startInterval(agent) {
  runningIntervals[agent.key] = setInterval(() => {
    followAgentStatusIntervalFunction(agent);
  }, INTERVAL_TIME);
}

function stopInterval(agent) {
  clearInterval(runningIntervals[agent.key]);
}

/**
 * @param {string} agentKey - agent.key
 * @return {agentStatusSchema}
 */
async function getAgentStatus(agentKey) {
  const allAgentStatus = await getAllAgentsStatus();
  return allAgentStatus[agentKey];
}

/**
 * @return {Object} - where keys are agent.key
 * and values are agentStatusSchema from agents.model
 * plus socket
 * plus some field required by legacy code
 */
async function getAllAgentsStatus() {
  const agents = await Agent.find();
  if (!agents) {
    return {};
  }
  // map agents to statuses
  const agentStatusObject = {};
  for (const agent of agents) {
    if (!agent.status) {
      agentStatusObject[agent.key] = {};
      continue;
    }
    agentStatusObject[agent.key] = agent.status;
    // create socket reference based on socketId stored in model
    agentStatusObject[agent.key].socket = socketService.socket.of(
      socketNamespaceName
    ).connected[agent.status.socketId];

    agentStatusObject[agent.key].id = agent.id;
    agentStatusObject[agent.key].key = agent.key;
  }
  return agentStatusObject;
}

async function saveStatusToAgent(agent, agentStatus) {
  await Agent.findOneAndUpdate(
    { key: agent.key },
    { $set: { status: agentStatus } }
  );
}

/* here we initiate following the agent status */
async function startFollowingAgentStatus(agent) {
  startInterval(agent);

  let agentStatus = await getAgentStatus(agent.key);
  if (!agentStatus) {
    agentStatus = agent.toJSON();
    agentStatus.alive = false;
    agentStatus.following = true;

    setDefaultUrl(agent);

    saveStatusToAgent(agent, agentStatus);
  }
}

/* stop following an agent */
async function stopFollowingAgentStatus(agentId) {
  const agent = await Agent.findOne({ "status.id": agentId });
  if (!agent) {
    return;
  }
  // stop the check interval
  stopInterval(agent);
  agent.status.alive = false;
  agent.status.following = false;
  agent.save();
}

/**
 * function being called every interval
 * @param {agentSchema} agent
 */
async function followAgentStatusIntervalFunction(agent) {
  const start = new Date();
  let agentStatus = await getAgentStatus(agent.key);
  if (!agentStatus || !agentStatus.defaultUrl) {
    return;
  }
  request.post(
    agentStatus.defaultUrl + "/api/status",
    {
      form: {
        key: agent.key
      }
    },
    (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { res: e };
      }

      if (!error && response.statusCode === 200) {
        agentStatus = updateAliveAgent(agentStatus, body, start);
        saveStatusToAgent(agent, agentStatus);
      } else {
        agentStatus.liveCounter -= 1;
        if (agentStatus.liveCounter === 0) {
          agentStatus = updateDeadAgent(agentStatus);
          saveStatusToAgent(agent, agentStatus);
        }
      }
    }
  );
}

function updateDeadAgent(agentStatus) {
  agentStatus.alive = false;
  if (!agentStatus.hostname) {
    agentStatus.hostname = "unknown";
  }
  if (!agentStatus.arch) {
    agentStatus.arch = "unknown";
  }
  if (!agentStatus.freeSpace) {
    agentStatus.freeSpace = 0;
  }
  agentStatus.respTime = 0;
  return agentStatus;
}

function updateAliveAgent(agentStatus, body, start) {
  agentStatus.alive = true;
  agentStatus.hostname = body.hostname;
  agentStatus.arch = body.arch;
  agentStatus.freeSpace = humanize.bytes(body.freeSpace);
  agentStatus.respTime = new Date() - start;
  agentStatus.defaultUrl = agentStatus.defaultUrl || "";
  agentStatus.installed_plugins = body.installed_plugins;
  agentStatus.liveCounter = LIVE_COUNTER;
  return agentStatus;
}

function setDefaultUrl(agent) {
  return new Promise((resolve, reject) => {
    request.post(
      agent.url + "/api/status",
      { form: { key: agent.key } },
      async function(error, response, body) {
        const agentStatus = await getAgentStatus(agent.key);
        if (error) {
          agentStatus.defaultUrl = agent.publicUrl;
        } else {
          agentStatus.defaultUrl = agent.url;
        }
        await saveStatusToAgent(agent, agentStatus);
        resolve();
      }
    );
  });
}

/**
 * Evaluates group dynamic agents and constant agents.
 * @param {groupSchema} group
 * @return {any}
 */
async function evaluateGroupAgents(group) {
  group = JSON.parse(JSON.stringify(group)); // make sure its not a mongoose document

  const agentsCopy = {};
  const allAgentsStatus = await getAllAgentsStatus();
  // remove socket
  Object.keys(allAgentsStatus).map(key => {
    const a = Object.assign({}, allAgentsStatus[key]);
    delete a.socket;
    agentsCopy[key] = a;
  });

  let filteredAgents = Object.keys(allAgentsStatus).map(key => agentsCopy[key]);
  group.filters.forEach(filter => {
    filteredAgents = evaluateFilter(filter, filteredAgents);
  });

  // array of the constant agents attached to the group
  const constAgents = group.agents.reduce((total, current) => {
    const agent = Object.keys(agentsCopy).find(key => {
      return agentsCopy[key].id === current;
    });
    if (agent) {
      total.push(agentsCopy[agent]);
    }
    return total;
  }, []);

  filteredAgents = [...filteredAgents, ...constAgents];
  return filteredAgents.reduce((total, current) => {
    total[current.key] = current;
    return total;
  }, {});
}

/**
 * Evaluates group's filter on given agents
 * @param {?} filter
 * @param {Array} agents
 * @return {Array} of filtered agents
 */
function evaluateFilter(filter, agents) {
  return agents.filter(o => {
    if (!o[filter.field]) {
      return false;
    }
    switch (filter.filterType) {
      case FILTER_TYPES.equal: {
        if (!o[filter.field]) {
          return false;
        }
        return o[filter.field].toString() === filter.value;
      }
      case FILTER_TYPES.contains: {
        return o[filter.field].includes(filter.value);
      }

      case FILTER_TYPES.gt: {
        try {
          return parseFloat(o[filter.field]) > parseFloat(filter.value);
        } catch (e) {
          return false;
        }
      }

      case FILTER_TYPES.gte: {
        try {
          return parseFloat(o[filter.field]) >= parseFloat(filter.value);
        } catch (e) {
          return false;
        }
      }

      case FILTER_TYPES.lt: {
        try {
          return parseFloat(o[filter.field]) < parseFloat(filter.value);
        } catch (e) {
          return false;
        }
      }

      case FILTER_TYPES.lte: {
        try {
          return parseFloat(o[filter.field]) <= parseFloat(filter.value);
        } catch (e) {
          return false;
        }
      }

      default: {
        return false;
      }
    }
  });
}

async function sendRequestToAgent(_options, agentStatus) {
  const options = Object.assign({}, _options);
  options.uri = agentStatus.defaultUrl + options.uri;
  options.method = options.method || "POST";

  if (options.body) {
    options.json = true;
    options.body.key = agentStatus.key;
  } else if (options.formData) {
    options.formData.key = agentStatus.key;
  }

  winston.log("info", "Sending request to agent");
  request(options, function(error, response, body) {
    if (error) {
      return error;
    }
    return response;
  });
}

function deleteAgentFromMap(agentId) {
  return Map.updateMany(
    { agents: { $elemMatch: { $eq: agentId } } },
    { $pull: { agents: { $in: [agentId] } } }
  );
}

/**
 * a remote agent calls this to add himself
 * @param {agentSchema} agent
 * @return {Agent}
 */
function add(agent) {
  return Agent.findOne({ key: agent.key })
    .then(agentObj => {
      if (!agentObj) {
        return Agent.create(agent);
      }
      return Agent.findByIdAndUpdate(agentObj._id, {
        $set: { url: agent.url, publicUrl: agent.publicUrl, isDeleted: false }
      });
    })
    .then(agent => {
      startFollowingAgentStatus(agent);
      return setDefaultUrl(agent).then(() => {
        return agent;
      });
    });
}

// get an object of installed plugins and versions on certain agent.
async function checkPluginsOnAgent(agent) {
  const agentStatus = await getAgentStatus(agent.key);
  return new Promise((resolve, reject) => {
    request.post(
      agentStatus.defaultUrl + "/api/plugins",
      { form: { key: agent.key } },
      function(error, response, body) {
        if (error || response.statusCode !== 200) {
          resolve("{}");
        }
        resolve(body);
      }
    );
  });
}

function deleteAgent(agentId) {
  return Agent.findByIdAndUpdate(agentId, {
    $set: { isDeleted: "true" }
  }).then(async agent => {
    await deleteAgentFromMap(agentId);
    const agentStatus = await getAgentStatus(agent.key);
    if (agentStatus) {
      stopFollowingAgentStatus(agentId);
    }
    // remove status from agent
    Agent.update({ key: agent.key }, { $unset: { status: 1 } });
  });
}
/* filter the agents. if no query is passed, will return all agents */
function filter(query = {}) {
  query.isDeleted = { $ne: true };
  return Agent.find(query);
}
/* send plugin file to an agent */
async function installPluginOnAgent(pluginPath, agentStatus) {
  const formData = {
    file: {
      value: fs.createReadStream(pluginPath),
      options: {
        filename: path.basename(pluginPath)
      }
    }
  };
  // if there is no agents, send this plugin to all living agents
  const requestOptions = {
    uri: "/api/plugins/install",
    formData: formData
  };

  if (!agentStatus) {
    const requests = [];
    const agentStatuses = await getAllAgentsStatus();
    for (const key in agentStatuses) {
      if (!agentStatuses[key].alive) {
        continue;
      }
      requests.push(sendRequestToAgent(requestOptions, agentStatuses[key]));
    }
    return Promise.all(requests);
  } else {
    return Promise.all([sendRequestToAgent(requestOptions, agentStatus)]);
  }
}

/**
 *
 * @param {string} name
 * @param {Agent} agent
 * @return {Promise<result[]>}
 */
async function deletePluginOnAgent(name, agent) {
  // if there is no agents, send this plugin to all living agents
  const requestOptions = {
    body: { name: name },
    uri: "/api/plugins/delete"
  };

  if (!agent) {
    const requests = [];
    const agents = await getAllAgentsStatus();
    for (const key in agents) {
      if (!agents[key].alive) {
        continue;
      }
      requests.push(sendRequestToAgent(requestOptions, agents[key]));
    }
    return Promise.all(requests);
  } else {
    return Promise.all([sendRequestToAgent(requestOptions, agent)]);
  }
}

/* restarting the agents live status, and updating the status for all agents */
async function restartAgentsStatus() {
  await Agent.update({}, { $unset: { status: 1 } });

  Agent.find({}).then(agents => {
    agents.forEach(agent => {
      startFollowingAgentStatus(agent);
    });
  });
}

/* update an agent */
function update(agentId, agent) {
  return Agent.findByIdAndUpdate(agentId, agent, { new: true });
}

function updateGroup(groupId, groupUpdated) {
  return Group.findOne({ _id: groupId }).then(group => {
    group.name = groupUpdated.name;
    group.filters = groupUpdated.filters;
    return group.save();
  });
}

/* Groups */
/**
 * Creating new group object
 * @param {groupSchema} group
 * @return {group}
 */
function createGroup(group) {
  return Group.create(group);
}

function groupsList(query = {}) {
  return Group.find(query);
}

/**
 * Adding agents to group
 * @param {ObjectID} groupId
 * @param {ObjectID} agentsId
 * @return {Query}
 */
function addAgentToGroup(groupId, agentsId) {
  return Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { agents: { $each: agentsId } } },
    { new: true }
  );
}

/**
 * Adding filters to group
 * @param {ObjectID} groupId
 * @param {?} filters
 * @return {Query}
 */
function addGroupFilters(groupId, filters) {
  return Group.findByIdAndUpdate(
    groupId,
    { $set: { filters: filters } },
    { new: true }
  );
}

/**
 * Delete a group.
 * @param {ObjectID} groupId
 * @return {Query}
 */
function deleteGroup(groupId) {
  return Group.findByIdAndRemove(groupId);
}

/**
 * Returning a group by it's id
 * @param {ObjectID} groupId
 * @return {Query}
 */
function groupDetail(groupId) {
  return Group.findById(groupId);
}

/**
 * Removes agents ref from groups.
 * @param {string} agentId
 * @return {Promise}
 */
function removeAgentFromGroups(agentId) {
  return Group.update(
    { agents: { $in: [agentId] } },
    { $pull: { agents: { $in: [agentId] } } }
  );
}

function deleteFilterFromGroup(groupId, index) {
  return Group.findOne({ _id: groupId }).then(group => {
    group.filters.splice(index, 1);
    return group.save();
  });
}

/**
 * Removing an agent from a group
 * @param {ObjectID} groupId
 * @param {ObjectID} agentId
 * @return {Query|*}
 */
function removeAgentFromGroup(groupId, agentId) {
  return Group.findOne({ _id: groupId }).then(group => {
    group.agents.splice(
      group.agents.findIndex(agent => agent.id == agentId),
      1
    );
    return group.save();
  });
}

/**
 * Adding a socket to agents statuses (if agentkey exists)
 * @param {string} agentKey
 * @param {Socket} socket
 */
async function addSocketIdToAgent(agentKey, socket) {
  const agent = await Agent.findOne({ key: agentKey });
  if (!agent) {
    return;
  }
  agent.status.socketId = socket.id;
  agent.save();
}

/**
 * Establish a room for agents
 * @param {Socket} socket
 */
function establishSocket(socket) {
  const nsp = socket.of(socketNamespaceName);
  nsp.on("connection", function(socket) {
    winston.log("info", "Agent log");
    // agent send key on connection string
    addSocketIdToAgent(socket.client.request._query.key, socket);
  });
}

module.exports = {
  add,
  delete: deleteAgent,
  setDefaultUrl,
  followAgent: startFollowingAgentStatus,
  unfollowAgent: stopFollowingAgentStatus,
  getAllAgentsStatus,
  evaluateGroupAgents,
  checkPluginsOnAgent,
  filter,
  installPluginOnAgent,
  deletePluginOnAgent,
  restartAgentsStatus,
  update,
  updateGroup,
  createGroup,
  groupsList,
  addAgentToGroup,
  addGroupFilters,
  deleteGroup,
  groupDetail,
  removeAgentFromGroups,
  deleteFilterFromGroup,
  removeAgentFromGroup,
  establishSocket,
  getAgentStatus
};
