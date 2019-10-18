/* eslint-disable valid-jsdoc */
const request = require("request");
const fs = require("fs");
const path = require("path");
const socketService = require("./socket.service");
const winston = require("winston");
const _ = require("lodash");
const humanize = require("../../helpers/humanize");
const Map = require("../models/map.model");
const Agent = require("../models").Agent;
const Group = require("../models").Group;

const LIVE_COUNTER = env.retries; // attempts before agent will be considered dead
const INTERVAL_TIME = env.interval_time;
const socketNamespaceName = "/agents";

// let agents = {};

const FILTER_TYPES = Object.freeze({
  gte: "gte",
  gt: "gt",
  equal: "equal",
  contains: "contains",
  lte: "lte",
  lt: "lt"
});

async function getAgentStatus(agentKey) {
  const agent = await Agent.findOne({ key: agentKey });
  return agent.status;
}

async function getAllAgentsStatus() {
  const agents = await Agent.find();
  // map agents to statuses
  const agentStatusObject = {};
  for (const agent of agents) {
    agentStatusObject[agent.key] = agent.status;
    // create socket reference based on socketId stored in model
    agentStatusObject[agent.key].socket = socketService.socket.of(
      socketNamespaceName
    ).connected[agent.status.socketId];
  }
  return agentStatusObject;
}

/* Send a post request to agent every INTERVAL seconds */
async function startFollowingAgentStatus(_agent) {
  // TODO: when using load balancer
  // make sure to not duplicate interval on another server
  const listenInterval = setInterval(() => {
    followAgentStatusIntervalFunction(_agent);
  }, INTERVAL_TIME);
  let agentStatus = await getAgentStatus(_agent.key);
  if (!agentStatus) {
    agentStatus = _agent.toJSON();
    agentStatus.alive = false;
    agentStatus.following = true;
    agentStatus.intervalId = listenInterval;
    setDefaultUrl(_agent);
    // TODO save agentStatus to agent model
  }
}

async function followAgentStatusIntervalFunction(_agent) {
  const start = new Date();
  const agentStatus = await getAgentStatus(_agent.key);
  if (!agentStatus) return;
  request.post(
    agentStatus.defaultUrl + "/api/status",
    {
      form: {
        key: _agent.key
      }
    },
    (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { res: e };
      }
      if (!error && response.statusCode === 200 && agentStatus) {
        agentStatus.name = _agent.name;
        agentStatus.attributes = _agent.attributes;
        agentStatus.alive = true;
        agentStatus.hostname = body.hostname;
        agentStatus.arch = body.arch;
        agentStatus.freeSpace = humanize.bytes(body.freeSpace);
        agentStatus.respTime = new Date() - start;
        agentStatus.url = _agent.url;
        agentStatus.publicUrl = _agent.publicUrl;
        agentStatus.defaultUrl = agentStatus.defaultUrl || "";
        agentStatus.id = _agent.id;
        agentStatus.key = _agent.key;
        agentStatus.installed_plugins = body.installed_plugins;
        agentStatus.liveCounter = LIVE_COUNTER;
      } else if (agentStatus && --agentStatus.liveCounter === 0) {
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
      }

      // TODO save agentStatus to agent model
    }
  );
}

/* stop following an agent */
function unfollowAgentStatus(agentId) {
  const agent = _.find(agents, o => {
    return o.id === agentId;
  });
  // stop the check interval
  if (!agent) {
    return;
  }
  clearInterval(agents[agent.key].intervalId);
  agents[agent.key].alive = false;
  agents[agent.key].following = false;
}

function setDefaultUrl(agent) {
  return new Promise((resolve, reject) => {
    request.post(
      agent.url + "/api/status",
      { form: { key: agent.key } },
      function(error, response, body) {
        if (error) {
          agents[agent.key].defaultUrl = agent.publicUrl;
        } else {
          agents[agent.key].defaultUrl = agent.url;
        }
        resolve();
      }
    );
  });
}

/**
 * Evaluates group dynamic agents and constant agents.
 * @param group
 * @return {any}
 */
function evaluateGroupAgents(group) {
  group = JSON.parse(JSON.stringify(group)); // make sure its not a mongoose document

  const agentsCopy = {};
  Object.keys(agents).map(key => {
    const a = Object.assign({}, agents[key]);
    delete a.socket;
    agentsCopy[key] = a;
  });

  let filteredAgents = Object.keys(agents).map(key => agentsCopy[key]);
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
 * @param filter
 * @param agents
 * @return array of filtered agents
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

function sendRequestToAgent(options, agent) {
  return new Promise((resolve, reject) => {
    options = Object.assign({}, options);
    options.uri = agents[agent.key].defaultUrl + options.uri;
    options.method = options.method || "POST";

    if (options.body) {
      options.json = true;
      options.body.key = agent.key;
    } else if (options.formData) options.formData.key = agent.key;

    winston.log("info", "Sending request to agent");
    request(options, function(error, response, body) {
      if (error) {
        return reject(error);
      }
      resolve(response);
    });
  });
}

function deleteAgentFromMap(agentId) {
  return Map.updateMany(
    { agents: { $elemMatch: { $eq: agentId } } },
    { $pull: { agents: { $in: [agentId] } } }
  );
}

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

function getByKey(agentKey) {
  agents[agentKey].key = agentKey;
  return agents[agentKey];
}

// get an object of installed plugins and versions on certain agent.
function checkPluginsOnAgent(agent) {
  return new Promise((resolve, reject) => {
    console.log(" checkPluginsOnAgent", agents[agent.key].defaultUrl);
    request.post(
      agents[agent.key].defaultUrl + "/api/plugins",
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
    if (agents[agent.key]) {
      clearInterval(agents[agent.key].intervalId);
    }
    delete agents[agent.key];
  });
}
/* filter the agents. if no query is passed, will return all agents */
function filter(query = {}) {
  query.isDeleted = { $ne: true };
  return Agent.find(query);
}
/* send plugin file to an agent */
function installPluginOnAgent(pluginPath, agent) {
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

  if (!agent) {
    const requests = [];
    for (const i in agents) {
      if (!agents[i].alive) {
        continue;
      }
      requests.push(sendRequestToAgent(requestOptions, agents[i]));
    }
    return Promise.all(requests);
  } else {
    return Promise.all([sendRequestToAgent(requestOptions, agent)]);
  }
}

/**
 *
 * @param {string} name
 * @param {Agent} agent
 * @return {Promise<result[]>}
 */
function deletePluginOnAgent(name, agent) {
  // if there is no agents, send this plugin to all living agents
  const requestOptions = {
    body: { name: name },
    uri: "/api/plugins/delete"
  };

  if (!agent) {
    const requests = [];
    for (const i in agents) {
      if (!agents[i].alive) {
        continue;
      }

      requests.push(sendRequestToAgent(requestOptions, agents[i]));
    }
    return Promise.all(requests);
  } else {
    return Promise.all([sendRequestToAgent(requestOptions, agent)]);
  }
}

/* restarting the agents live status, and updating the status for all agents */
function restartAgentsStatus() {
  agents = {};
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
 * @param group
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
 * @param groupId
 * @param agentsId
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
 * @param groupId
 * @param filters
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
 * @param groupId
 * @return {Query}
 */
function deleteGroup(groupId) {
  return Group.findByIdAndRemove(groupId);
}

/**
 * Returning a group by it's id
 * @param groupId
 * @return {Query}
 */
function groupDetail(groupId) {
  return Group.findById(groupId);
}

/**
 * Removes agents ref from groups.
 * @param agentId
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
 * @param groupId
 * @param agentId
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
 * @param agentKey
 * @param socket - instance of socket
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
 * @param socket - instance of socket
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
  unfollowAgent: unfollowAgentStatus,
  agentsStatus: getAllAgentsStatus,
  evaluateGroupAgents,
  getByKey,
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
  establishSocket
};
