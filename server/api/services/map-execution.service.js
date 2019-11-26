const vm = require("vm");
const fs = require("fs");
const path = require("path");
const { Subject } = require("rxjs");
const winston = require("winston");
const request = require("request");
const _ = require("lodash");
const ObjectId = require("mongoose").Types.ObjectId;

const models = require("../models");

const MapResult = models.MapResult;

const agentsService = require("./agents.service");
const mapsService = require("./maps.service");
const pluginsService = require("../services/plugins.service");
const vaultService = require("./vault.service");
const helper = require("./map-execution.helper");
const dbUpdates = require("./map-execution-updates")({ stopExecution });
const shared = require("../shared/recents-maps");
const socketService = require("./socket.service");

const statusEnum = models.statusEnum;
let clientSocket;
const executions = {};
let pending = {};
let libpm = ""; // all sdk code.
const libpmObjects = {};

fs.readFile(
  path.join(path.dirname(path.dirname(__dirname)), "libs", "sdk.js"),
  "utf8",
  function(err, data) {
    // opens the lib_production file. this file is used for user to use overwrite custom function at map code
    if (err) {
      return winston.log("error", err);
    }
    libpm = data;
    eval(libpm);
    libpmObjects.currentAgent = currentAgent;
  }
);

/**
 * @param {*} agent
 * @return {object} an agent object like with the sdk format
 */
function getCurrentAgent(agent) {
  const obj = {};
  Object.keys(libpmObjects.currentAgent).forEach(field => {
    obj[field] = agent[field];
  });
  return obj;
}

/**
 * @param {*} param
 * @param {*} typeParam
 * @param {*} context
 * @return {Promise} with the relevant param
 */
async function evaluateParam(param, typeParam, context) {
  if (!param.code) {
    if (typeParam == "vault" && param.value) {
      return await vaultService.getValueByKey(param.value);
    }
    return param.value;
  }
  return vm.runInNewContext(param.value, context);
}

/**
 * @param {*} plugin
 * @return {Promise} - with the settings of a plugin.
 */
async function getSettingsAction(plugin) {
  return Promise.all(
    plugin.settings.map(async setting => {
      if (setting.valueType == "vault" && setting.value) {
        setting.value = await vaultService.getValueByKey(setting.value);
      }
      return setting;
    })
  );
}

/**
 * Send to client all runIds executions that still running.
 * @param socket
 */
function updateClientExecutions(socket, execToDelete = null) {
  execToDelete ? delete executions[execToDelete] : null;
  const emitv = Object.keys(executions).reduce((total, current) => {
    total[current] = executions[current].mapId;
    return total;
  }, {});
  socket
    ? socket.emit("executions", emitv)
    : clientSocket.emit("executions", emitv);
}

/**
 * Update client what the pending executions.
 * mapId is keys and value is array of pending runIds
 * @param socket
 */
function updateClientPending(socket, pendingToRemove = null) {
  if (pendingToRemove && pending[pendingToRemove.mapId]) {
    const runIndex = pending[pendingToRemove.mapId].findIndex(
      o => o === pendingToRemove.runId
    );
    runIndex < 0 ? null : pending[pendingToRemove.mapId].splice(runIndex, 1);
  }
  pending ? socket.emit("pending", pending) : null;
}

/**
 * Adds a new process to context and returns its index in the executions array.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param process
 * @return {number}
 */
function createProcessContext(runId, agent, processUUID, process) {
  let executionAgent = executions[runId].executionAgents[agent.key];
  let processes = executionAgent.context.processes;

  if (!executionAgent.numProcesses && executionAgent.numProcesses != 0) {
    executionAgent.numProcesses = 0;
  } else {
    executionAgent.numProcesses++;
  }
  if (!processes[processUUID]) {
    processes[processUUID] = [];
  }

  process.name =
    process.name || "Process #" + (executionAgent.numProcesses + 1);

  const processData = {
    processId: process.id || process._id.toString(),
    iterationIndex: processes[processUUID].length,
    status: process.status || statusEnum.RUNNING,
    uuid: processUUID,
    actions: {},
    startTime: new Date(),
    processIndex: executionAgent.numProcesses // numProcesses => represents the process in the DB.
  };
  processes[processUUID].push(processData);

  const options = {
    mapResultId: runId,
    agentId: agent.id,
    processData: processData
  };
  dbUpdates.addProcess(options);

  process.iterationIndex = processData.iterationIndex;
}

/**
 * Assigning data to process execution.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param processIndex
 * @param processData
 */
function updateProcessContext(
  runId,
  agent,
  processUUID,
  iterationIndex,
  processData
) {
  if (!executions[runId]) {
    return;
  }

  if (processData.finishTime) {
    let processUuid =
      executions[runId].executionAgents[agent.key].context.processes[
        processUUID
      ][0].uuid;
    sendFinishTimeToClient(runId, {
      process: { finishTime: processData.finishTime, uuid: processUuid }
    });
  }

  executions[runId].executionAgents[agent.key].context.processes[processUUID][
    iterationIndex
  ] = Object.assign(
    executions[runId].executionAgents[agent.key].context.processes[processUUID][
      iterationIndex
    ] || {},
    processData
  );

  const options = {
    mapResultId: runId,
    agentId: agent.id,
    processIndex:
      executions[runId].executionAgents[agent.key].context.processes[
        processUUID
      ][iterationIndex].processIndex,
    data: processData
  };

  dbUpdates.updateProcess(options);
}

/**
 * create new action
 * @param {string} runId
 * @param {string} agentKey
 * @param {string} processKey
 * @param {string} processIndex
 * @param {models} action
 * @param {object} actionData
 */
function createActionContect(
  runId,
  agentKey,
  processKey,
  processIndex,
  action,
  actionData
) {
  if (!executions[runId]) {
    return;
  }
  let process =
    executions[runId].executionAgents[agentKey].context.processes[processKey][
      processIndex
    ];

  process.actions[action._id] = Object.assign(action, actionData);

  // set previousAction & currentAction
  executions[runId].executionAgents[agentKey].context.previousAction =
    executions[runId].executionAgents[agentKey].context.currentAction;
  executions[runId].executionAgents[agentKey].context.currentAction =
    process.actions[action._id];

  const options = {
    data: actionData,
    mapResultId: runId,
    agentId: executions[runId].executionAgents[agentKey].id,
    processIndex: process.processIndex,
    actionIndex: process.actions[action._id].actionIndex
  };

  return dbUpdates.addAction(options);
}

/**
 * assigning data to action execution.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param processIndex
 * @param actionKey
 * @param actionData
 */
function updateActionContext(
  runId,
  agentKey,
  processKey,
  processIndex,
  action,
  actionData
) {
  if (!executions[runId]) {
    return;
  }

  let curActionData =
    executions[runId].executionAgents[agentKey].context.processes[processKey][
      processIndex
    ].actions[action._id];

  Object.assign(curActionData, actionData);

  // If action have a result (i.e. done) set to previous action;
  if (actionData.result)
    executions[runId].executionAgents[agentKey].context.previousAction = action;

  let result = "";
  const options = {
    data: actionData,
    mapResultId: runId,
    agentId: executions[runId].executionAgents[agentKey].id,
    processIndex:
      executions[runId].executionAgents[agentKey].context.processes[processKey][
        processIndex
      ].processIndex,
    actionIndex: curActionData.actionIndex
  };

  dbUpdates.updateAction(options);
}

/**
 * Starting a pending execution
 * @param mapId
 */
async function startPendingExecution(mapId, socket) {
  let pendingExec = await dbUpdates.getAndUpdatePendingExecution(mapId);
  if (!pendingExec) {
    return;
  }

  updateClientPending(socket, { mapId, runId: pendingExec._id });
  socket.emit("map-execution-result", pendingExec);

  map = await mapsService.get(pendingExec.map);
  mapStructure = await mapsService.getMapStructure(
    map._id,
    pendingExec.structure
  );

  agents = await helper.getRelevantAgent(map.groups, map.agents);
  if (agents.length == 0) {
    // If no living agents, stop execution with status error
    return updateMapResult(
      pendingExec.id,
      { reason: "no agents alive", status: statusEnum.ERROR },
      socket
    );
  }

  let context = createExecutionContext(
    pendingExec._id,
    socket,
    pendingExec,
    mapStructure
  );
  executeMap(pendingExec._id, map, mapStructure, agents, context);
}

function updateMapResult(mapResultId, updateData, socket) {
  const options = {
    mapResultId: mapResultId,
    data: updateData,
    socket: socket
  };
  dbUpdates.updateMapResult(options);
}

/**
 *
 * @param {*} agent
 * @param {*} runId
 * @param {*} executionContext - general context to save on every agent
 * @param {*} startNode
 * @param {*} mapCode - the code section of a map
 */
function createAgentContext(
  agent,
  runId,
  executionContext,
  startNode,
  mapCode
) {
  let processes = {}; // creates to every agent 'prcesses' object that saved in context
  processes[startNode.uuid] = [
    {
      // in processes we save all the processes we got
      status: statusEnum.DONE,
      startNode: true
    }
  ];

  executions[runId].executionAgents[agent.key] = {
    context: Object.assign(
      { processes },
      executionContext,
      _addFuncsToCodeEnv()
    ),
    id: agent.id,
    runNodeSuccessorsCounter: 0
  };
  createCodeEnv(mapCode, runId, agent.key);
  executions[runId].executionAgents[
    agent.key
  ].context.currentAgent = getCurrentAgent(agent);

  dbUpdates.addAgentResult(executions[runId].executionAgents[agent.key], runId);
}

/**
 * Create code enviroment in context
 * @param {*} mapCode
 * @param {*} runId
 * @param {*} agentKey
 */
function createCodeEnv(mapCode, runId, agentKey) {
  try {
    vm.runInNewContext(
      libpm + "\n" + mapCode,
      executions[runId].executionAgents[agentKey].context
    );
  } catch (err) {
    stopExecution(
      runId,
      executions[runId],
      "Error in code environment. " + err
    );
  }
}

/**
 * Add more functionalities in our code enviroment (monaco). e.g. using 'require'.
 */
function _addFuncsToCodeEnv() {
  return { require, console, Buffer };
}

/**
 * create general context and executions[runId]
 * @param {*} runId
 * @param {*} socket
 * @param {mapResult} mapResult
 * @return {object} - all the global context of an execution
 */
function createExecutionContext(runId, socket, mapResult, structure) {
  executions[runId] = {
    mapId: mapResult.map,
    status: mapResult.status,
    executionAgents: {},
    clientSocket: socket
  };

  return (executionContext = {
    executionId: runId,
    startTime: mapResult.startTime,
    // structure: structure.id,
    configuration: {
      name: mapResult.configuration.name,
      value: mapResult.configuration.value
    },
    trigger: {
      msg: mapResult.trigger,
      payload: mapResult.triggerPayload
    },
    vault: {
      getValueByKey: vaultService.getValueByKey
    },

    MapService: {
      getMapConfigurations: () => {
        return structure.configurations.toBSON();
      },
      getMapExecutions: async amount => {
        return mapsService.getMapExecutions(amount, structure.map.toString());
      },
      getMap: (mapId = mapResult.map) => {
        return mapsService.getMap(mapId);
      }
    }
  });
}

/**
 * Create mapResult, with the wright status and configuration
 * @param {*} runId
 * @param {*} socket
 * @param {*} map
 * @param {*} configurationName
 * @param {*} structure
 * @param {*} triggerReason
 * @param {*} payload
 * @return {MapResult}
 */
async function createMapResult(
  socket,
  map,
  configuration,
  structure,
  triggerReason,
  payload
) {
  // get number of running executions
  const ongoingExecutions = helper.countMapExecutions(
    executions,
    map.id.toString()
  );

  // if more running executions than map.queue them save map as pending
  const status =
    map.queue && ongoingExecutions >= map.queue
      ? statusEnum.PENDING
      : statusEnum.RUNNING;
  configuration = helper.getConfiguration(structure, configuration);
  const startTime = status == statusEnum.PENDING ? null : new Date();

  const mapResult = new MapResult({
    map: map._id,
    structure: structure.id,
    startTime: startTime,
    configuration: configuration,
    trigger: triggerReason,
    triggerPayload: payload,
    status: status,
    agentsResults: []
  });

  console.log("mapResultId : ", mapResult.id);
  status == statusEnum.PENDING
    ? null
    : socket.emit("map-execution-result", mapResult); // sending mapResult to client
  await mapResult.save();

  return mapResult;
}

/**
 * returns empty array if there is a plugin that isn`t installed on server. else returns the relevant plugins
 * @param {*} mapStructure
 * @param {*} runId
 * @return {String[]}
 */
async function getPluginsToExec(mapStructure) {
  let pluginNames = {};
  mapStructure.used_plugins.forEach(
    plugin => (pluginNames[plugin.name] = plugin.name)
  );
  const names = Object.keys(pluginNames);
  let plugins = await pluginsService.filterPlugins({ name: { $in: names } });
  if (plugins.length != names.length) {
    return [];
  }
  return plugins;
}

function isProcessIsOnTheFlow(
  nodeUuid,
  structure,
  processUuid,
  processesDidntPassConditionUuid = null
) {
  const successor = helper.findSuccessors(nodeUuid, structure);
  if (successor.includes(processUuid)) {
    return true;
  }
  if (successor.length == 0) {
    return false;
  }
  for (let i = 0, length = successor.length; i < length; i++) {
    if (
      !processesDidntPassConditionUuid ||
      !processesDidntPassConditionUuid.includes(successor[i])
    ) {
      if (
        isProcessIsOnTheFlow(
          successor[i],
          structure,
          processUuid,
          processesDidntPassConditionUuid
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

async function runCode(map, runId, agent) {
  let responseData;
  try {
    responseData = await vm.runInNewContext(
      map.apiResponseCodeReference,
      executions[runId].executionAgents[agent.key].context
    );
  } catch (err) {
    responseData = null;
  }
  return responseData;
}

/**
 *
 * @param {*} runId
 * @param {*} map
 * @param {*} mapStructure
 * @param {*} agents
 * @param {*} context - general context about the execution (this conetxt is seperate to every agent)
 */
async function executeMap(runId, map, mapStructure, agents, context) {
  updateClientExecutions(executions[runId].clientSocket);

  executions[runId].plugins = await getPluginsToExec(mapStructure, runId);
  if (!executions[runId].plugins.length) {
    return stopExecution(runId, clientSocket, "not all plugins installed");
  }

  const startNode = helper.findStartNode(mapStructure);

  if (
    map.processResponse &&
    !isProcessIsOnTheFlow(startNode.uuid, mapStructure, map.processResponse)
  ) {
    executions[runId].subscription.next();
  }

  if (!startNode) {
    stopExecution(runId, clientSocket, "link is missing to start execution");
  }

  let nsp = await socketService.getNamespaceSocket(
    "execution-update-" + runId.toString()
  );
  nsp.on("connection", function(socket) {
    Object.keys(nsp.sockets).forEach(socket => {
      nsp.sockets[socket].emit("updateActions", nsp.actions);
    });
  });
  nsp["actions"] = [];

  let promises = [];
  for (let i = 0, length = agents.length; i < length; i++) {
    try {
      createAgentContext(
        agents[i],
        runId,
        context,
        startNode,
        mapStructure.code
      );
    } catch (err) {
      return;
    }
    promises.push(
      runMapOnAgent(map, mapStructure, runId, startNode, agents[i])
    );
  }
  Promise.all(promises)
    .then(async () => {
      const responseData = await runCode(map, runId, agent);
      executions[runId].subscription.complete(responseData);
      executions[runId].subscription.unsubscribe();
    })
    .catch(err => {
      winston.log("error", "structureId: " + mapStructure.id + err);
    });
}

function checkDuplicateProcess(structure) {
  const processIds = [];
  let isDuplicateProcess = false;
  structure.processes.map(process => {
    if (processIds.includes(process._id.toString())) {
      delete process.id;
      delete process._id;
      isDuplicateProcess = true;
    } else {
      processIds.push(process._id.toString());
    }
  });

  return { isDuplicate: isDuplicateProcess, structure: structure };
}

/**
 * create mapResult if all params are good and run it.
 * @param {*} mapId
 * @param {*} structureId
 * @param {*} socket
 * @param {object} configuration - {config - the main configuration, mergeConfig - in case of mapExecution plugin}
 * @param {*} triggerReason
 * @param {*} triggerPayload
 * @return {string} - the new runId
 */
async function execute(
  mapId,
  structureId,
  socket,
  configuration,
  triggerReason,
  triggerPayload = null
) {
  clientSocket = socket; // save socket in global
  const map = await mapsService.get(mapId);
  if (!map) {
    throw new Error(`Couldn't find map`);
  }
  if (map.archived) {
    throw new Error("Can't execute archived map");
  }

  let mapStructure = await mapsService.getMapStructure(map._id, structureId);
  if (!mapStructure) {
    throw new Error("No structure found.");
  }

  const checkDuplicate = checkDuplicateProcess(mapStructure.toObject());
  if (checkDuplicate.isDuplicate) {
    delete checkDuplicate.structure.id;
    delete checkDuplicate.structure._id;
    mapStructure = await models["Structure"].create(checkDuplicate.structure);
  }

  const agents = await helper.getRelevantAgent(map.groups, map.agents);

  if (agents.length == 0 && triggerReason == "Started manually by user") {
    throw new Error("No agents alive");
  }
  const mapResult = await createMapResult(
    socket,
    map,
    configuration,
    mapStructure,
    triggerReason,
    triggerPayload
  );
  const runId = mapResult.id;

  const response = {
    runId: runId,
    mapId: mapId
  };

  if (agents.length == 0) {
    // in case of trigger or schedules task we create mapResult and save the error.
    await MapResult.findOneAndUpdate(
      { _id: ObjectId(mapResult.id) },
      { $set: { reason: "No agents alive" } }
    );
    return response;
  }

  if (mapResult.status == statusEnum.PENDING) {
    pending[mapResult.map]
      ? pending[mapResult.map].push(runId)
      : (pending[mapResult.map] = [runId]);
    updateClientPending(socket);
    return response; // exit if the map is pending
  }

  const context = createExecutionContext(
    runId,
    socket,
    mapResult,
    mapStructure
  );

  executeMap(runId, map, mapStructure, agents, context);

  if (!map.processResponse) {
    return Promise.resolve(response);
  }

  executions[runId].subscription = new Subject();
  return new Promise((resolve, reject) => {
    executions[runId].subscription.subscribe(
      responseData => {
        response.responseData = responseData;
        resolve(response);
      },
      error => console.log(error),
      responseData => {
        response.responseData = responseData;
        resolve(response);
      }
    );
  });
}

/**
 * runs the map on a specific agent.
 * @param {*} map
 * @param {*} structure
 * @param {*} runId
 * @param {*} startNode
 * @param {*} agent
 * @return {Promise}
 */
function runMapOnAgent(map, structure, runId, startNode, agent) {
  return helper
    .validatePluginInstallation(executions[runId].plugins, agent.key)
    .then(() => {
      return runNodeSuccessors(map, structure, runId, agent, startNode.uuid);
    });
}

/**
 * find a process in a map structure by uuid.
 * @param uuid
 * @param structure
 * @return {KaholoProcess}
 */
function findProcessByUuid(uuid, structure) {
  return structure.processes.find(o => o.uuid === uuid);
}

/**
 * The function checks if the agent executing a process.
 * @param runId
 * @param agentKey
 * @return {boolean}
 */
function isThereProcessExecutingOnAgent(runId, agentKey) {
  let processes;
  try {
    processes = Object.keys(
      executions[runId].executionAgents[agentKey].context.processes
    );
  } catch (e) {
    return false;
  }
  for (let i = processes.length - 1; i >= 0; i--) {
    if (
      executions[runId].executionAgents[agentKey].context.processes[
        processes[i]
      ].findIndex(p => p.status === statusEnum.RUNNING) > -1
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if there is an agent that isn't labeled as done
 * @param runId
 * @return {boolean}
 */
async function areAllAgentsDone(runId) {
  const executionAgents = executions[runId].executionAgents;

  for (const key in executionAgents) {
    const agentsStatus = await agentsService.getAllAgentsStatus();
    if (!executionAgents[key].status && agentsStatus[key].alive) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if all agents have this process pending
 * @param runId
 * @param processKey
 * @param agentKey
 * @return {boolean} return false if there is an agent that didnt get to process
 */
function areAllAgentsWaitingToStartThis(runId, agent, process) {
  const executionAgents = executions[runId].executionAgents;
  for (const i in executionAgents) {
    if (
      i != agent.key &&
      !executionAgents[i].context.processes.hasOwnProperty(process.uuid)
    ) {
      return false;
    }
  }
  return true;
}

/**
 *
 * @param {String} runId
 * @param {String} agentKey
 * @param {String} text - the parallel param of action or process
 */
function _getParallelExecutionsNum(runId, agentKey, text) {
  if (!text) {
    return 1;
  }
  let numProcessParallel = 1;
  try {
    numProcessParallel = vm.runInNewContext(
      text,
      executions[runId].executionAgents[agentKey].context
    );
  } catch (e) {} // I dont care :)
  return numProcessParallel || 1;
}

/**
 * In case of wait condition, go over all agents and runs pending process
 * @param {*} runId
 * @param {*} map
 * @param {*} structure
 * @param {*} process
 */
async function runAgentsFlowControlPendingProcesses(
  runId,
  map,
  structure,
  process
) {
  const executionAgents = executions[runId].executionAgents;
  const agentsStatus = await agentsService.getAllAgentsStatus();
  for (const i in executionAgents) {
    for (const j in executionAgents[i].context.processes[process.uuid]) {
      let processToRun = executionAgents[i].context.processes[process.uuid][j];
      if (processToRun.status != statusEnum.PENDING) {
        return;
      } // e.g. 1 agent
      updateProcessContext(
        runId,
        agentsStatus[i],
        process.uuid,
        processToRun.iterationIndex,
        {
          status: statusEnum.RUNNING,
          startTime: new Date()
        }
      );
      process.iterationIndex = processToRun.iterationIndex;
      runProcess(map, structure, runId, agentsStatus[i], process);
    }
  }
}

/**
 * Returns true if agent pass all conditions.
 * Race - return true just for the first agent who got to process.
 * Wait - return true if all agent got to process.
 * @param {*} runId
 * @param {*} process
 * @param {*} map
 * @param {*} structure
 * @param {*} agent
 * @return {boolean}
 */
async function checkAgentFlowCondition(runId, process, map, structure, agent) {
  if (process.flowControl === "race") {
    return helper.isThisTheFirstAgentToGetToTheProcess(
      executions[runId].executionAgents,
      process.uuid,
      agent.key
    );
  }

  if (process.flowControl === "wait") {
    // TODO: check how to handle race condition between agents status and check
    const allAgentsAlive = await helper.areAllAgentsAlive(
      executions[runId].executionAgents
    );
    if (!allAgentsAlive) {
      // if not all agents are still alive, the wait condition will never be met, should stop the map execution
      stopExecution(runId);
      return false;
    }

    const agentProcesses =
      executions[runId].executionAgents[agent.key].context.processes;
    if (
      agentProcesses[process.uuid] &&
      agentProcesses[process.uuid][0].status != statusEnum.PENDING
    ) {
      return true; // means all agents was here and run.
    }

    // if there is a wait condition, checking if it is the last agent that got here and than run all the agents
    return areAllAgentsWaitingToStartThis(runId, agent, process);
  }
  return true;
}

/**
 * returns true if process pass conditions
 * wait - if all other proceses in the same agent are waiting to start this process.
 * race - just the first process path run the process
 * @param {*} process
 * @param {*} runId
 * @param {*} agent
 * @param {*} structure
 * @return {boolean}
 */
function checkProcessCoordination(process, runId, agent, structure) {
  let processes =
    executions[runId].executionAgents[agent.key].context.processes;
  if (process.coordination === "wait") {
    const ancestors = helper.findAncestors(process.uuid, structure);
    if (ancestors.length > 1) {
      for (let i = 0; i < ancestors.length; i++) {
        const ancestor = ancestors[i];
        if (
          !processes[ancestor] ||
          !(processes[ancestor][0].status == statusEnum.DONE)
        ) {
          // if ancestor status is running retun false
          return false;
        }
      }
    }
    return true;
  }

  if (process.coordination === "race") {
    return !(processes && processes.hasOwnProperty(process.uuid)); // if process.uuid exist in process => process executed (failed in race).
  }
  return true;
}

/**
 * Creates processes contex and run them
 * @param {*} runId
 * @param {*} agent
 * @param {*} process
 * @param {*} processUUID
 * @param {*} map
 * @param {*} structure
 * @param {*} startIndex - in case of pending/wait condition, startIndex=1. (because one process was created )
 */
function executeProcessParallel(
  runId,
  agent,
  process,
  processUUID,
  map,
  structure,
  startIndex = 0
) {
  let promises = [];
  let numToExecProcess = _getParallelExecutionsNum(
    runId,
    agent.key,
    process.numProcessParallel
  );
  for (let index = startIndex; index < numToExecProcess; index++) {
    let copyProcess = Object.assign({}, process);
    createProcessContext(runId, agent, processUUID, copyProcess);
    promises.push(runProcess(map, structure, runId, agent, copyProcess));
  }
  return promises;
}

/**
 * Finds all successors for node and runs them in parallel if meeting coordination criteria.
 * Also checks process coordination and agent flow control.
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param node
 * @return {Promise[]}
 */
async function runNodeSuccessors(map, structure, runId, agent, node) {
  if (
    !executions[runId] ||
    executions[runId].status == statusEnum.ERROR ||
    executions[runId].status == statusEnum.DONE
  ) {
    return Promise.resolve();
  } // status : 'Error' , 'Done'

  const successors = node ? helper.findSuccessors(node, structure) : [];
  if (successors.length === 0) {
    return await endRunPathResults(runId, agent, map);
  }
  const promises = [];
  for (
    let successorIdx = 0, length = successors.length;
    successorIdx < length;
    successorIdx++
  ) {
    let successor = successors[successorIdx];
    // go over all successors and checks if successor pass execution conditions
    let process = findProcessByUuid(successor, structure);
    process = Object.assign({}, process.toObject());

    const passProcessCoordination = checkProcessCoordination(
      process,
      runId,
      agent,
      structure
    );
    const passAgentFlowCondition = await checkAgentFlowCondition(
      runId,
      process,
      map,
      structure,
      agent
    );

    // if it is the last ancestoer of a process
    if (
      !passProcessCoordination &&
      process.coordination === "race" &&
      successors.length - 1 == successorIdx
    ) {
      await endRunPathResults(
        runId,
        agent,
        executions[runId].clientSocket,
        map
      );
    }

    // if there is an agent that already got to this process, the current agent should continue to the next process in the flow.
    if (passProcessCoordination && !passAgentFlowCondition) {
      if (process.flowControl === "race") {
        if (process.coordination == "race") {
          executions[runId].executionAgents[agent.key].context.processes[
            process.uuid
          ] = []; // indication that process uuid run (in case of race coordination)
        }
        await runNodeSuccessors(map, structure, runId, agent, process.uuid);
      }

      if (
        process.flowControl === "wait" &&
        !executions[runId].executionAgents[agent.key].context.processes[
          process.uuid
        ]
      ) {
        // if the process is already created.
        process.status = statusEnum.PENDING;
        createProcessContext(runId, agent, process.uuid, process);
      }
    }

    if (passProcessCoordination && passAgentFlowCondition) {
      if (process.flowControl === "wait") {
        runAgentsFlowControlPendingProcesses(runId, map, structure, process);
      }
      promises.push(
        executeProcessParallel(runId, agent, process, successor, map, structure)
      );
    }
  }
  Promise.all(promises)
    .then(processesRusult => {
      processesRusult.forEach(processPromiseArr => {
        processPromiseArr.forEach(p => {
          p.then(async res => {
            res.endPath ? await endRunPathResults(runId, agent, map) : null;
          });
        });
      });
    })
    .catch(err => {
      stopExecution(runId, null, err);
      console.log(err);
    });
}

function updateAgentContext(runId, agent, agentData) {
  executions[runId].executionAgents[agent.key] = Object.assign(
    executions[runId].executionAgents[agent.key],
    agentData
  );

  const options = {
    mapResultId: runId,
    agentId: agent.id,
    data: agentData
  };
  dbUpdates.updateAgent(options);
}

async function sendFinishTimeToClient(runId, data) {
  let nsp = await socketService.getNamespaceSocket(
    "execution-update-" + runId.toString()
  );
  nsp.emit("updateFinishTime", data);
}

/**
 * Checks if there is no more running processes and finishes execution.
 * @param {*} runId
 * @param {*} agent
 * @param {*} map
 */
async function endRunPathResults(runId, agent, map) {
  if (!executions[runId]) {
    return;
  }
  if (isThereProcessExecutingOnAgent(runId, agent.key)) {
    return;
  }

  updateAgentContext(runId, agent, { status: statusEnum.DONE });

  const allAgentsDone = await areAllAgentsDone(runId);
  if (!allAgentsDone) {
    return;
  }

  const finishTime = new Date();

  sendFinishTimeToClient(runId, { execution: finishTime });

  const data = {
    finishTime: finishTime,
    status: statusEnum.DONE
  };

  const options = {
    mapResultId: runId,
    data: data,
    socket: executions[runId].clientSocket
  };
  dbUpdates.updateMapResult(options);

  const socket = executions[runId].clientSocket;

  if (map.queue) {
    startPendingExecution(map.id, socket);
  }

  updateClientExecutions(socket, runId);
}

/**
 * Checks if process pass condition and save the result
 * Return false if process failed
 * @param {*} runId
 * @param {*} agent
 * @param {*} process
 * @return {boolean}
 */
function passProcessCondition(runId, agent, process) {
  if (!process.condition) {
    return true;
  }
  let isProcessPassCondition;
  let errMsg;
  try {
    isProcessPassCondition = vm.runInNewContext(
      process.condition,
      executions[runId].executionAgents[agent.key].context
    );
  } catch (e) {
    errMsg = `Error running process condition: ${e.message}`;
  }

  if (isProcessPassCondition) {
    return true;
  }

  updateProcessContext(runId, agent, process.uuid, process.iterationIndex, {
    message: errMsg || "Process didn't pass condition",
    status: statusEnum.ERROR,
    finishTime: new Date()
  });
  return false;
}

/**
 * Runs process pre/post function. Saves the result in DB and context
 */
function runProcessFunc(runId, agent, process, fieldName, funcToRun) {
  if (!funcToRun) {
    return;
  }
  let processData = {};
  try {
    processData[fieldName] = vm.runInNewContext(
      funcToRun,
      executions[runId].executionAgents[agent.key].context
    );
  } catch (e) {
    processData[fieldName] = "Error running preProcess function" + e;
  }
  updateProcessContext(
    runId,
    agent,
    process.uuid,
    process.iterationIndex,
    processData
  );
}

/**
 * returns array of actions to execute
 */
function _getProcessActionsToExec(runId, process, agent, map, structure) {
  let plugin = executions[runId].plugins.find(
    o => o.name.toString() == process.used_plugin.name
  );

  const actionsArray = [];

  process.actions.forEach((action, i) => {
    if (!action.isEnabled) {
      return;
    }
    action.name = action.name || `Action #${i + 1} `;

    let numToExecProcess = _getParallelExecutionsNum(
      runId,
      agent.key,
      action.numParallel
    );
    for (let index = 0; index < numToExecProcess; index++) {
      let copyAction = _.cloneDeep(action);

      actionsArray.push([
        map,
        structure,
        runId,
        agent,
        process,
        process.iterationIndex,
        copyAction,
        plugin.toJSON(),
        executions[runId].clientSocket
      ]);
    }
  });

  return process.actionsExecution == "series"
    ? runActionsInSeries(actionsArray)
    : runActionsInParallel(actionsArray, runId);
}

/**
 * Returns a function for async.each call. this function is adding the process to the context, running all condition, filter, pre and post and calling the action execution function
 *
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param socket
 * @return {Promise} - null resolve
 */
function runProcess(map, structure, runId, agent, process) {
  return new Promise(async (resolve, reject) => {
    const shouldContinue = await helper.isAgentShuldContinue(
      executions[runId].executionAgents[agent.key]
    );
    if (!shouldContinue) {
      return resolve();
    }

    if (!passProcessCondition(runId, agent, process)) {
      const res = {
        process: {
          process: process.uuid,
          index: process.iterationIndex,
          name: process.name,
          startTime: new Date(),
          finishTime: new Date(),
          message: "Process didn't pass condition"
        },
        agent: {
          _id: agent.id,
          name: agent.name
        }
      };
      let nsp = await socketService.getNamespaceSocket(
        "execution-update-" + runId.toString()
      );
      nsp.actions.push(res);
      nsp.emit("updateAction", res);
      executions[runId].processesDidntPassConditionUuid =
        executions[runId].processesDidntPassConditionUuid || [];
      executions[runId].processesDidntPassConditionUuid.push(process.uuid);
      if (map.processResponse == process.uuid) {
        const responseData = await runCode(map, runId, agent);
        executions[runId].subscription.next(responseData);
        const startNodeUuid = helper.findStartNode(structure).uuid;
        if (
          isProcessIsOnTheFlow(process.uuid, structure, map.processResponse) &&
          !isProcessIsOnTheFlow(
            startNodeUuid,
            structure,
            map.processResponse,
            executions[runId].processesDidntPassConditionUuid
          )
        ) {
          const responseData = await runCode(map, runId, agent);
          executions[runId].subscription.next(responseData);
        }
      }

      if (process.mandatory) {
        // mandatory process failed, stop executions
        executions[runId].executionAgents[agent.key].status = statusEnum.ERROR;
        return stopExecution(runId, null, "Mandatory process failed");
      }
      return resolve({ endPath: true });
    }

    runProcessFunc(runId, agent, process, "preRunResult", process.preRun);

    let actionExecutionPromises = _getProcessActionsToExec(
      runId,
      process,
      agent,
      map,
      structure
    );

    return actionExecutionPromises
      .then(actionsResults => {
        // all actions done
        return actionsExecutionCallback(map, structure, runId, agent, process, actionsResults);
      })
      .catch(error => {
        winston.log("error", error);
        console.error(error); // TODO: go over all console log and delete unnessasery
        updateProcessContext(
          runId,
          agent,
          process.uuid,
          process.iterationIndex,
          {
            status: statusEnum.ERROR,
            message: error.message,
            finishTime: new Date()
          }
        );
      });
  });
}

function runActionsInSeries(actionsArray) {
  const reduceFunc = (promiseChain, currentAction, index) => {
    // let actionId = (currentAction[6]._id).toString()
    currentAction[6].actionIndex = index;
    // executions[runId].executionAgents[agent.key].context.processes[process.uuid][process.iterationIndex].actions[actionId] = currentAction[6];

    return promiseChain.then(chainResults => {
      return executeAction.apply(null, currentAction).then(currentResult => {
        return [...chainResults, currentResult];
      });
    });
  };

  return actionsArray.reduce(reduceFunc, Promise.resolve([]));
}

function runActionsInParallel(actionsArray, runId) {
  const promises = [];
  executions[runId].index = 0;
  actionsArray.forEach((action, index) => {
    action[6].actionIndex = index;
    promises.push(executeAction.apply(null, action));
  });
  return Promise.all(promises);
}

/**
 * Last function of a process. After all actions are done runs the postRun function, finish execution
 * and continue to the next process
 * @param {*} map
 * @param {*} structure
 * @param {*} runId
 * @param {*} agent
 * @param {*} process
 */
async function actionsExecutionCallback(map, structure, runId, agent, process, actionsResults) {
  function markProcessAsDone(){
    updateProcessContext(runId, agent, process.uuid, process.iterationIndex, {
      status: statusEnum.DONE,
      finishTime: new Date()
    });
  }
  
  if (
    !executions[runId] ||
    executions[runId].executionAgents[agent.key].status
  ) {
    // status is just error or done
    return;
  }

  if (process.mandatory){
    for (let index = 0, length=actionsResults.length; index < length; index++) {
      //if any of the process's actions failed, stop execution
      if(actionsResults[index].status === statusEnum.ERROR){
        markProcessAsDone();
        return endRunPathResults(runId, agent, map);
      }
    }
  }


  if (map.processResponse && map.processResponse == process.uuid) {
    const responseData = await runCode(map, runId, agent);
    executions[runId].subscription.next(responseData);
  }
  runProcessFunc(runId, agent, process, "postRunResult", process.postRun);
  markProcessAsDone();
  
  await runNodeSuccessors(map, structure, runId, agent, process.uuid);
}

/**
 * Send action to agent via socket
 * @param socket
 * @param action
 * @param actionForm
 * @return {Promise<any>}
 */
function sendActionViaSocket(socket, uniqueRunId, actionForm) {
  socket.emit("add-task", actionForm);

  return new Promise((resolve, reject) => {
    socket.on(uniqueRunId, data => {
      resolve(data);
    });
  });
}

/**
 * Send action to agent via request
 * @param agent
 * @param action
 * @param actionForm
 * @return {Promise<any>}
 */
async function sendActionViaRequest(agent, actionForm) {
  const agentStatus = await agentsService.getAgentStatus(agent.key);
  return new Promise((resolve, reject) => {
    request.post(
      agentStatus.defaultUrl + "/api/task/add",
      {
        form: actionForm
      },
      function(error, response, body) {
        if (error) {
          if (!body) {
            body = { result: error };
          }
        } else {
          try {
            body = JSON.parse(body);
          } catch (e) {
            // statements
            body = {
              res: e
            };
          }
        }
        resolve(body);
      }
    );
  });
}

/**
 * Sends notifications to client.
 * @param {*} mapId
 * @param {*} runId
 * @param {*} msg
 * @param {*} status
 */
function _updateRawOutput(mapId, runId, msg, status) {
  const logMsg = {
    map: mapId,
    runId: runId,
    message: msg,
    status: status
  };

  clientSocket.emit("update", logMsg);
}

/**
 * return the method to use or throw error if not exist
 * @param {*} plugin
 * @param {*} action
 * @return {object}
 */
function getMethodAction(plugin, action) {
  if (!action.method) {
    throw new Error("No method was provided");
  }

  const method = plugin.methods.find(o => o.name === action.method);
  if (!method) {
    throw new Error("Method wasn't found");
  }
  return method;
}

/**
 * execute an action
 * @param {*} map
 * @param {*} structure
 * @param {*} runId
 * @param {*} agent
 * @param {*} process
 * @param {*} processIndex
 * @param {*} action
 * @param {*} plugin
 * @return {object} - action result
 */
async function executeAction(
  map,
  structure,
  runId,
  agent,
  process,
  processIndex,
  action,
  plugin
) {
  const actionData = {
    action: ObjectId(action._id),
    startTime: new Date(),
    retriesLeft: action.retries
  };

  createActionContect(
    runId,
    agent.key,
    process.uuid,
    processIndex,
    action,
    actionData
  );
  let actionString;

  const params = action.params || [];
  action.params = {};
  action.plugin = { name: plugin.name };

  try {
    action.method = getMethodAction(plugin, action); // can throw error

    actionString = `+ ${plugin.name} - ${action.method.name}: `;

    for (let i = 0; i < params.length; i++) {
      // handle wrong code
      action.params[params[i].name] = await evaluateParam(
        params[i],
        action.method.params[i].type,
        executions[runId].executionAgents[agent.key].context
      );
      if (action.method.params[i].type != "vault")
        actionString += `${params[i].name}: ${action.params[params[i].name]}${
          i != params.length - 1 ? ", " : ""
        }`;
    }
  } catch (err) {
    updateActionContext(runId, agent.key, process.uuid, processIndex, action, {
      status: statusEnum.ERROR,
      finishTime: new Date(),
      result: { stderr: err.message }
    });
    console.error(err);
    return err.message; // continue to next action if not mandatory
  }

  action.uniqueRunId = `${runId}|${processIndex}|${action._id}`;

  const settings = await getSettingsAction(plugin);

  const actionExecutionForm = {
    mapId: map.id,
    versionId: 0, // TODO: check if possible to remove
    executionId: 0, // TODO: check if possible to remove
    action: action,
    key: agent.key,
    settings: settings
  };

  let agentPromise;
  if (agent.socket) {
    // will send action to agent via socket or regular request
    agentPromise = sendActionViaSocket(
      agent.socket,
      action.uniqueRunId,
      actionExecutionForm
    );
  } else {
    agentPromise = sendActionViaRequest(agent, actionExecutionForm);
  }

  return runAction();

  /**
   * Declare a timeout function.
   * If there is timeout the action failed.
   * In case of retries- try again
   * @return {object} - action result
   */
  async function runAction() {
    const actionResult = actionData;
    let timeoutFunc = helper.generateTimeoutFun(action);

    return Promise.race([agentPromise, timeoutFunc.timeoutPromise])
      .then(result => {
        // race condition between agent action and action timeout
        clearTimeout(timeoutFunc.timeout);
        if (result === helper.IS_TIMEOUT) {
          return {
            result: "Timeout Error",
            status: statusEnum.ERROR,
            stdout: actionString
          };
        } else {
          if (result.status === statusEnum.SUCCESS) {
            if (result.stdout) {
              result.stdout = actionString + "\n" + result.stdout;
            } else {
              result.stdout = actionString;
            }
          }
          return result;
        }
      })
      .then(async result => {
        actionResult.status = result.status;
        actionResult.result = result;

        if (result.status == statusEnum.ERROR && action.retriesLeft > 0) {
          // retry handling
          actionResult.retriesLeft = --action.retriesLeft;
          updateActionContext(
            runId,
            agent.key,
            process.uuid,
            processIndex,
            action,
            actionResult
          );
          return runAction();
        }
        actionResult.finishTime = new Date();
        let msg = `'${process.name} ' - '${
          action.name
        }' result: ${JSON.stringify(result)} (${agent.name})`;
        _updateRawOutput(map._id, runId, msg, result.status);
        updateActionContext(
          runId,
          agent.key,
          process.uuid,
          processIndex,
          action,
          actionResult
        );
        const res = {
          action: actionResult,
          process: {
            uuid: process.uuid,
            index: process.iterationIndex,
            finishTime: null,
            name: process.name,
            startTime: process.startTime || actionResult.startTime
          },
          agent: {
            _id: agent.id,
            name: agent.name
          }
        };

        let nsp = await socketService.getNamespaceSocket(
          "execution-update-" + runId.toString()
        );
        nsp.actions.push(res);
        Object.keys(nsp.sockets).forEach(socket => {
          nsp.sockets[socket].emit("updateAction", res);
        });

        let mandatoryActionFailed = actionResult.status == statusEnum.ERROR &&
                              action.mandatory &&
                              (!actionResult.hasOwnProperty("retriesLeft") || !actionResult.retriesLeft);


        // mandatory action faild. stop execution (if no have retries)
        if (mandatoryActionFailed) {
            stopExecution(runId, null, result);
            throw `Execution ${runId}: Mandatory action failed. Stopping execution`;
        }

        return result;
      });
  }
}

/**
 * sending a kill action request to agent.
 * @param mapId
 * @param actionId
 * @param agentKey
 * @return {Promise<any>}
 */
async function sendKillRequest(mapId, actionId, agentKey) {
  const agentStatus = await agentsService.getAgentStatus(agentKey);
  return new Promise((resolve, reject) => {
    request.post(
      agentStatus.defaultUrl + "/api/task/cancel",
      {
        form: {
          mapId: mapId,
          actionId: actionId,
          key: agentKey
        }
      },
      function(error, response, body) {
        resolve();
      }
    );
  });
}

/**
 *  Stop and Update MapResult and running actions.
 * @param {*} runId
 * @param {*} mapId
 * @param {*} socket
 * @param {string} result - the cuase of stopping the execution
 */
async function stopExecution(runId, socket = null, result = "") {
  const d = new Date();
  let options, optionAction;

  if (!executions[runId]) {
    return updateClientExecutions(socket);
  }

  let executionAgents = executions[runId].executionAgents;
  Object.keys(executionAgents).forEach(agentKey => {
    const agent = executionAgents[agentKey];
    agent.key = agentKey;
    if (!agent) return;
    optionAction = [];
    for (const uuid in agent.context.processes) {
      const processArray = agent.context.processes[uuid];
      processArray.forEach(process => {
        if (process.startNode || process.finishTime) {
          return;
        }
        updateProcessContext(
          runId,
          agent,
          process.uuid,
          process.iterationIndex,
          {
            status: statusEnum.STOPPED,
            finishTime: d
          }
        );
        if (!process.actions) {
          return;
        }
        Object.keys(process.actions).forEach(actionKey => {
          const action = process.actions[actionKey];
          if (!action.finishTime) {
            const data = {
              status: statusEnum.STOPPED,
              finishTime: d
            };
            const option = {
              data: data,
              processIndex: process.processIndex,
              actionIndex: action.actionIndex
            };
            optionAction.push(option);
            sendKillRequest(runId, actionKey, agentKey);
          }
        });
      });
    }

    options = {
      data: optionAction,
      agentId: agent.id,
      mapResultId: runId
    };
    optionAction ? dbUpdates.updateActionsInAgent(options) : null;
  });

  updateMapResult(
    runId,
    { finishTime: d, status: statusEnum.STOPPED + " - " + result },
    executions[runId].clientSocket
  );

  startPendingExecution(
    executions[runId].mapId,
    executions[runId].clientSocket
  );
  updateClientExecutions(executions[runId].clientSocket, runId);
}

/**
 * get all pending execution from db and saves it globaly.
 * TODO: use to rebuild on system start
 */
async function rebuildPending() {
  let allPending = await MapResult.find({ status: statusEnum.PENDING });
  pending = {};
  allPending.map(pendingMap => {
    pending[pendingMap.map.toString()]
      ? pending[pendingMap.map.toString()].push(pendingMap._id)
      : (pending[pendingMap.map.toString()] = [pendingMap._id]);
  });
  updateClientPending(clientSocket);
}

/**
 * removes pending execution from pending object
 * @param mapId
 * @param runId
 * @param socket
 * @return {Promise<null>}
 */
function cancelPending(mapId, runId, socket) {
  return new Promise(async (resolve, reject) => {
    if (!mapId || !runId) {
      return reject({ message: "Not enough parameters" });
    }
    if (!pending.hasOwnProperty(mapId)) {
      return reject({ message: "No pending executions for this map" });
    }
    const runIndex = pending[mapId].findIndex(o => o === runId);
    if (runIndex === -1) {
      return reject({ message: "No such job" });
    }

    await MapResult.findOneAndUpdate(
      { _id: runId },
      { status: statusEnum.CANCELED }
    );
    pending[mapId].splice(runIndex, 1);
    updateClientPending(socket);
    resolve();
  });
}

module.exports = {
  cancelPending: cancelPending,
  /**
   * starting a map execution
   * @param mapId {string}
   * @param versionIndex {string}
   * @param cleanWorkspace {boolean}
   * @param req {request}
   * @returns {Promise|*|Promise<T>} return an error or a runId if run started
   */
  execute: execute,
  /**
   * returning all logs for certain run or a map
   * @param mapId {string}
   * @param resultId {string}
   * @return {Promise<object[]>}
   */
  logs: async resultId => {
    let q;

    if (resultId) q = { _id: resultId };

    let mapResult = (await MapResult.findOne(q)
      .populate({
        path: "agentsResults.agent",
        select: "name"
      })
      .exec()).toBSON();

    let logs = [];
    let structure = await mapsService.getMapStructure(
      mapResult.map,
      mapResult.structure
    ); // for process/actions names (populate on names didnt work)

    let processNames = {}; // a map <process.id, process name>
    let actionNames = {}; // same as above
    let fieldToMap = mapResult.status
      ? { name: "_id", val: "process" }
      : { name: "uuid", val: "uuid" }; // just to handle with old maps. maps with status are new.
    structure.processes.forEach((process, iProcess) => {
      processNames[process[fieldToMap.name]] =
        process.name ||
        (processNames[process[fieldToMap.val]]
          ? processNames[process[fieldToMap.name]]
          : `Process #${iProcess + 1}`); // extract process name
      if (!process.actions) {
        return;
      }
      process.actions.forEach((action, iAction) => {
        actionNames[action._id.toString()] =
          action.name || `Action #${iAction + 1}`; // extract action name
      });
    });

    // sort all actions results by finishTime
    mapResult.agentsResults.forEach(agentResult => {
      agentResult.processes.forEach(process => {
        process.actions.forEach(action => {
          logs.push({
            finishTime: action.finishTime,
            message: `'${
              processNames[process[fieldToMap.val].toString()]
            }' - '${
              actionNames[action.action.toString()]
            }' result: ${JSON.stringify(action.result)} (${
              agentResult.agent.name
            })`
          });
        });
      });
    });

    logs = logs.sort((a, b) => {
      return -(new Date(b.finishTime) - new Date(a.finishTime));
    });
    logs.forEach(log => delete log.finishTime);
    return Promise.resolve(logs);
  },

  /**
   * getting all results for a certain map (not populated)
   * @param mapId {string}
   */
  results: (mapId, page) => {
    const load_Results = 25;
    let index = page * load_Results - load_Results;
    return MapResult.find({ map: mapId }, null, { sort: { startTime: -1 } })
      .select("-agentsResults")
      .skip(index)
      .limit(load_Results);
  },
  /**
   * get an id of specific result and return populated object
   * @param resultId {string}
   * @return {Query} a result with structure and agent result populated
   */
  detail: params => {
    let query;
    if (params.resultId && params.resultId != "null") {
      query = MapResult.findById(params.resultId);
    } else {
      query = MapResult.findOne({ map: params.id })
        .sort("-startTime")
        .limit(1);
    }
    return query.populate("structure agentsResults.agent");
  },

  /**
   * returning all maps result
   * @return {Document|Promise|Query|*|void}
   */
  dashboard: () => {
    return shared.recentsMaps(16);
  },

  /**
   * get a map id and optional runId and removes the runId or all the execution of the map.
   * @param mapId {string}
   * @param runId {string}, optional
   * @returns {string[]} array of stopped runs.
   */
  stop: stopExecution,

  executions: executions
};
