const vm = require('vm');
const fs = require('fs');
const path = require('path');

const winston = require('winston');
const request = require('request');
const _ = require("lodash");
const ObjectId = require('mongoose').Types.ObjectId;

const models = require("../models");

const MapResult = models.MapResult;

const agentsService = require('./agents.service');
const mapsService = require('./maps.service');
const pluginsService = require('../services/plugins.service');
const vaultService = require('./vault.service')
const helper = require('./map-execution.helper')
const dbUpdates = require('./map-execution-updates')({ stopExecution })
const shared = require('../shared/recents-maps')


const statusEnum = models.statusEnum
let clientSocket
let executions = {};
let pending = {};

let libpm = ''; // all sdk code.
let libpmObjects = {}

fs.readFile(path.join(path.dirname(path.dirname(__dirname)), 'libs', 'sdk.js'), 'utf8', function (err, data) {
    // opens the lib_production file. this file is used for user to use overwrite custom function at map code
    if (err) {
        return winston.log('error', err);
    }
    libpm = data;
    eval(libpm)
    libpmObjects.currentAgent = currentAgent
});

/**
 * @param {*} agent
 * @returns {object} an agent object like with the sdk format 
 */
function getCurrentAgent(agent) {
    let obj = {};
    Object.keys(libpmObjects.currentAgent).forEach(field => {
        obj[field] = agent[field]
    })
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
        if (typeParam == 'vault' && param.value) {
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
    return Promise.all(plugin.settings.map(async (setting) => {
        if (setting.valueType == 'vault' && setting.value) {
            setting.value = await vaultService.getValueByKey(setting.value);
        }
        return setting;
    }));
}


/**
 * Send to client all runIds executions that still running.
 * @param socket
 */
function updateClientExecutions(socket, execToDelete = null) {
    execToDelete ? delete executions[execToDelete] : null
    let emitv = Object.keys(executions).reduce((total, current) => {
        total[current] = executions[current].mapId;
        return total;
    }, {});
    socket ? socket.emit('executions', emitv) : clientSocket.emit('executions', emitv);
}

/**
 * Update client what the pending executions.
 * mapId is keys and value is array of pending runIds
 * @param socket
 */
function updateClientPending(socket, pendingToRemove = null) {
    if (pendingToRemove && pending[pendingToRemove.mapId]) {
        const runIndex = pending[pendingToRemove.mapId].findIndex((o) => o === pendingToRemove.runId);
        runIndex < 0 ? null : pending[pendingToRemove.mapId].splice(runIndex, 1);
    }
    pending ? socket.emit('pending', pending) : null;
}

/**
 * Adds a new process to context and returns its index in the executions array.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param process
 * @returns {number}
 */
function createProcessContext(runId, agent, processUUID, process) {
    let executionAgent = executions[runId].executionAgents[agent.key]
    let processes = executionAgent.context.processes

    if (!executionAgent.numProcesses && executionAgent.numProcesses != 0) {
        executionAgent.numProcesses = 0
    } else {
        executionAgent.numProcesses++
    }
    if (!processes[processUUID]) {
        processes[processUUID] = [];
    }

    process.name = process.name || 'Process #' + (executionAgent.numProcesses + 1)

    const processData = {
        processId: process.id || process._id.toString(),
        iterationIndex: processes[processUUID].length,
        status: process.status || statusEnum.RUNNING,
        uuid: processUUID,
        actions: {},
        startTime: new Date(),
        processIndex: executionAgent.numProcesses  // numProcesses => represents the process in the DB.  
    };
    processes[processUUID].push(processData);

    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        processData: processData
    }
    dbUpdates.addProcess(options)

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
function updateProcessContext(runId, agent, processUUID, iterationIndex, processData) {

    if (!executions[runId]) {
        return;
    }
    executions[runId].executionAgents[agent.key].context.processes[processUUID][iterationIndex] = Object.assign(
        (executions[runId].executionAgents[agent.key].context.processes[processUUID][iterationIndex] || {}),
        processData
    );

    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        processIndex: executions[runId].executionAgents[agent.key].context.processes[processUUID][iterationIndex].processIndex,
        data: processData
    }

    dbUpdates.updateProcess(options)

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
function createActionContect(runId, agentKey, processKey, processIndex, action, actionData) {
    if (!executions[runId]) { return; }
    let process = executions[runId].executionAgents[agentKey].context.processes[processKey][processIndex]

    process.actions[action._id] = Object.assign(action, actionData);

    // set previousAction & currentAction
    executions[runId].executionAgents[agentKey].context.previousAction = executions[runId].executionAgents[agentKey].context.currentAction
    executions[runId].executionAgents[agentKey].context.currentAction = process.actions[action._id]

    let options = {
        data: actionData,
        mapResultId: executions[runId].mapResultId,
        agentId: executions[runId].executionAgents[agentKey].id,
        processIndex: process.processIndex,
        actionIndex: process.actions[action._id].actionIndex
    }

    return dbUpdates.addAction(options)

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
function updateActionContext(runId, agentKey, processKey, processIndex, action, actionData) {
    if (!executions[runId]) { return; }

    let curActionData = executions[runId].executionAgents[agentKey].context.processes[processKey][processIndex].actions[action._id]

    Object.assign(curActionData, actionData);

    // If action have a result (i.e. done) set to previous action;
    if (actionData.result)
        executions[runId].executionAgents[agentKey].context.previousAction = action;

    let result = ""
    if (actionData.status == statusEnum.ERROR && action.mandatory && !actionData.hasOwnProperty('retriesLeft')) {
        result = 'Mandatory Action Faild'
        actionData.result.result += (" - " + result)


        let msg = `result: ${JSON.stringify(result)}`
        _updateRawOutput(map._id, runId, msg, statusEnum.ERROR)
    }

    let options = {
        data: actionData,
        mapResultId: executions[runId].mapResultId,
        agentId: executions[runId].executionAgents[agentKey].id,
        processIndex: executions[runId].executionAgents[agentKey].context.processes[processKey][processIndex].processIndex,
        actionIndex: curActionData.actionIndex
    }

    dbUpdates.updateAction(options)

    // mandatory action faild. stop execution (if no have retries)
    if (actionData.status == statusEnum.ERROR && action.mandatory && !actionData.hasOwnProperty('retriesLeft')) {
        return stopExecution(runId, null, result)
    }
}



/**
 * Starting a pending execution
 * @param mapId
 */
async function startPendingExecution(mapId, socket) {

    let pendingExec = await dbUpdates.getAndUpdatePendingExecution(mapId)
    if (!pendingExec) { return }

    updateClientPending(socket, { mapId, runId: pendingExec.runId })
    socket.emit('map-execution-result', pendingExec)

    map = await mapsService.get(pendingExec.map)
    mapStructure = await mapsService.getMapStructure(map._id, pendingExec.structure)

    agents = helper.getRelevantAgent(map.groups, map.agents)
    if (agents.length == 0) { // If no living agents, stop execution with status error
        return updateMapResult(pendingExec.id, { reason: 'no agents alive', status: statusEnum.ERROR }, socket)
    }

    let context = createExecutionContext(pendingExec.runId, socket, pendingExec)
    executeMap(pendingExec.runId, map, mapStructure, agents, context);
}

function updateMapResult(mapResultId, updateData, socket) {
    let options = {
        mapResultId: mapResultId,
        data: updateData,
        socket: socket
    }
    dbUpdates.updateMapResult(options)
}

/**
 * 
 * @param {*} agent 
 * @param {*} runId 
 * @param {*} executionContext - general context to save on every agent
 * @param {*} startNode 
 * @param {*} mapCode - the code section of a map
 */
function createAgentContext(agent, runId, executionContext, startNode, mapCode) {

    let processes = {} // creates to every agent 'prcesses' object that saved in context
    processes[startNode.uuid] = [{  // in processes we save all the processes we got 
        status: statusEnum.DONE,
        startNode: true,
    }]

    executions[runId].executionAgents[agent.key] = {
        context: Object.assign({ processes }, executionContext, _addFuncsToCodeEnv()),
        id: agent.id
    }
    createCodeEnv(mapCode, runId, agent.key)
    executions[runId].executionAgents[agent.key].context.currentAgent = getCurrentAgent(agent)

    dbUpdates.addAgentResult(executions[runId].executionAgents[agent.key], executions[runId].mapResultId)
}

/**
 * Create code enviroment in context
 * @param {*} mapCode 
 * @param {*} runId 
 * @param {*} agentKey 
 */
function createCodeEnv(mapCode, runId, agentKey) {
    try {
        vm.runInNewContext(libpm + '\n' + mapCode, executions[runId].executionAgents[agentKey].context);
    } catch (err) {
        stopExecution(runId, executions[runId], "Error in code environment. " + err)
    }
}

/**
 * Add more functionalities in our code enviroment (monaco). e.g. using 'require'.
 */
function _addFuncsToCodeEnv() {
    return { require, console, Buffer }
}

/**
 * create general context and executions[runId]
 * @param {*} runId 
 * @param {*} socket 
 * @param {mapResult} mapResult
 * @return {object} - all the global context of an execution  
 */
function createExecutionContext(runId, socket, mapResult) {
    executions[runId] = {
        mapId: mapResult.map,
        status: mapResult.status,
        executionAgents: {},
        clientSocket: socket,
        mapResultId: mapResult.id
    }

    return executionContext = {
        executionId: runId,
        startTime: mapResult.startTime,
        // structure: structure.id,
        configuration: mapResult.configuration,
        trigger: {
            msg: mapResult.trigger,
            payload: mapResult.triggerPayload
        },
        vault: {
            getValueByKey: vaultService.getValueByKey
        }
    };
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
async function createMapResult(runId, socket, map, configurationName, structure, triggerReason, payload) {
    // get number of running executions
    const ongoingExecutions = helper.countMapExecutions(executions, map.id.toString());

    // if more running executions than map.queue them save map as pending
    const status = (map.queue && (ongoingExecutions >= map.queue)) ? statusEnum.PENDING : statusEnum.RUNNING;
    const configuration = helper.createConfiguration(structure, configurationName);
    const startTime = status == statusEnum.PENDING ? null : new Date()

    let mapResult = new MapResult({
        map: map._id,
        runId: runId,  // TODO: use map result id instead of runId (delete runId usage from everywhere)
        structure: structure.id,
        startTime: startTime,
        configuration: configuration,
        trigger: triggerReason,
        triggerPayload: payload,
        status: status,
        agentsResults: []
    });

    console.log("mapResultId : ", mapResult.id);
    status == statusEnum.PENDING ? null : socket.emit('map-execution-result', mapResult); // sending mapResult to client 
    await mapResult.save()

    return mapResult
}

/**
 * returns empty array if there is a plugin that isn`t installed on server. else returns the relevant plugins
 * @param {*} mapStructure 
 * @param {*} runId 
 * @returns {String[]} 
 */
async function getPluginsToExec(mapStructure, runId) {
    let pluginNames = {}
    mapStructure.used_plugins.forEach(plugin => pluginNames[plugin.name] = plugin.name);
    const names = Object.keys(pluginNames)
    let plugins = await pluginsService.filterPlugins({ name: { $in: names } })
    if (plugins.length != names.length) {
        return []
    }
    return plugins
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

    executions[runId].plugins = await getPluginsToExec(mapStructure, runId)
    if (!executions[runId].plugins.length) {
        return stopExecution(runId, clientSocket, 'not all plugins installed', executions[runId].mapResultId)
    }


    const startNode = helper.findStartNode(mapStructure);
    if(!startNode){
        stopExecution(runId, clientSocket, "link is missing to start execution")
    }
    let promises = []
    for (let i = 0, length = agents.length; i < length; i++) {
        try {
            createAgentContext(agents[i], runId, context, startNode, mapStructure.code)
        } catch (err) {
            return
        }
        promises.push(runMapOnAgent(map, mapStructure, runId, startNode, agents[i]))
    }
    Promise.all(promises).catch(err => {
        winston.log('error', "structureId: " + mapStructure.id + err);
    });
}

/**
 * create mapResult if all params are good and run it.  
 * @param {*} mapId 
 * @param {*} structureId 
 * @param {*} socket 
 * @param {*} configurationName 
 * @param {*} triggerReason 
 * @param {*} triggerPayload 
 * @returns {string} - the new runId
 */
async function execute(mapId, structureId, socket, configurationName, triggerReason, triggerPayload = null) {
    clientSocket = socket; // save socket in global 
    map = await mapsService.get(mapId)
    if (!map) { throw new Error(`Couldn't find map`); }
    if (map.archived) { throw new Error('Can\'t execute archived map'); }

    mapStructure = await mapsService.getMapStructure(map._id, structureId)
    if (!mapStructure) { throw new Error('No structure found.'); }

    let agents = helper.getRelevantAgent(map.groups, map.agents)

    if (agents.length == 0 && triggerReason == "Started manually by user") { throw new Error('No agents alive'); }
    let runId = helper.guidGenerator();
    let mapResult = await createMapResult(runId, socket, map, configurationName, mapStructure, triggerReason, triggerPayload)

    if (agents.length == 0) { // in case of trigger or schedules task we create mapResult and save the error. 
        await MapResult.findOneAndUpdate({ _id: ObjectId(mapResult.id) }, { $set: { 'reason': "No agents alive" } })
        return
    }

    if (mapResult.status == statusEnum.PENDING) {
        pending[mapResult.map] ? pending[mapResult.map].push(runId) : pending[mapResult.map] = [runId]
        updateClientPending(socket)
        return runId // exit if the map is pending
    }
    let context = createExecutionContext(runId, socket, mapResult)
    executeMap(runId, map, mapStructure, agents, context)
    return runId
}

/**
 * runs the map on a specific agent. 
 * @param {*} map 
 * @param {*} structure 
 * @param {*} runId 
 * @param {*} startNode 
 * @param {*} agent 
 * @returns {Promise}
 */
function runMapOnAgent(map, structure, runId, startNode, agent) {
    return helper.validate_plugin_installation(executions[runId].plugins, agent.key).then(() => {
        return runNodeSuccessors(map, structure, runId, agent, startNode.uuid)
    })
}



/**
 * find a process in a map structure by uuid.
 * @param uuid
 * @param structure
 * @returns {KaholoProcess}
 */
function findProcessByUuid(uuid, structure) {
    return structure.processes.find(o => o.uuid === uuid);
}

/**
 * The function checks if the agent executing a process.
 * @param runId
 * @param agentKey
 * @returns {boolean}
 */
function isThereProcessExecutingOnAgent(runId, agentKey) {
    let processes;
    try {
        processes = Object.keys(executions[runId].executionAgents[agentKey].context.processes);
    } catch (e) {
        return false;
    }
    for (let i = processes.length - 1; i >= 0; i--) {
        if (executions[runId].executionAgents[agentKey].context.processes[processes[i]].findIndex(p => p.status === statusEnum.RUNNING) > -1) {
            return true;
        }
    }
    return false;
}

/**
 * Check if there is an agent that isn't labeled as done
 * @param runId
 * @returns {boolean}
 */
function areAllAgentsDone(runId) {
    const executionAgents = executions[runId].executionAgents;

    for (let i in executionAgents) {
        if (!executionAgents[i].status && agentsService.agentsStatus()[i].alive) {
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
 * @returns {boolean} return false if there is an agent that didnt get to process
 */
function areAllAgentsWaitingToStartThis(runId, agent, process) {
    const executionAgents = executions[runId].executionAgents;
    for (let i in executionAgents) {
        if (i != agent.key && !executionAgents[i].context.processes.hasOwnProperty(process.uuid)) {
            return false;
        }
    }
    return true;
}

/**
 * In case of wait condition, go over all agents and runs pending process   
 * @param {*} runId 
 * @param {*} map 
 * @param {*} structure 
 * @param {*} process 
 */
function runAgentsFlowControlPendingProcesses(runId, map, structure, process) {
    const executionAgents = executions[runId].executionAgents
    let agentsStatus = agentsService.agentsStatus()
    for (let i in executionAgents) {
        for (let j in executionAgents[i].context.processes[process.uuid]) {
            let processToRun = executionAgents[i].context.processes[process.uuid][j]
            if (processToRun.status != statusEnum.PENDING) { return } // e.g. 1 agent
            updateProcessContext(runId, agentsStatus[i], process.uuid, processToRun.iterationIndex, { status: statusEnum.RUNNING, startTime: new Date() })
            process.iterationIndex = processToRun.iterationIndex
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
 * @returns {boolean}
 */
function checkAgentFlowCondition(runId, process, map, structure, agent) {
    if (process.flowControl === 'race') {
        return helper.isThisTheFirstAgentToGetToTheProcess(executions[runId].executionAgents, process.uuid, agent.key)
    }

    if (process.flowControl === 'wait') {
        //TODO: check how to handle race condition between agents status and check
        if (!helper.areAllAgentsAlive(executions[runId].executionAgents)) { // if not all agents are still alive, the wait condition will never be met, should stop the map execution
            stopExecution(runId);
            return false;
        }


        const agentProcesses = executions[runId].executionAgents[agent.key].context.processes
        if (agentProcesses[process.uuid] && agentProcesses[process.uuid][0].status != statusEnum.PENDING) {
            return true // means all agents was here and run. 
        }

        // if there is a wait condition, checking if it is the last agent that got here and than run all the agents
        return areAllAgentsWaitingToStartThis(runId, agent, process)
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
 * @returns {boolean}
 */
function checkProcessCoordination(process, runId, agent, structure) {
    let processes = executions[runId].executionAgents[agent.key].context.processes
    if (process.coordination === 'wait') {
        let ancestors = helper.findAncestors(process.uuid, structure);
        if (ancestors.length > 1) {
            for (let i = 0; i < ancestors.length; i++) {
                const ancestor = ancestors[i];
                if (!processes[ancestor] || processes[ancestor][0].status == statusEnum.RUNNING) { // if ancestor status is running retun false 
                    return false;
                }
            }
        }
        return true
    }

    if (process.coordination === 'race') {
        return !(processes && processes.hasOwnProperty(process.uuid)) // if process.uuid exist in process => process executed (failed in race). 
    }
    return true;

}



/**
 * Finds all successors for node and runs them in parallel if meeting coordination criteria.
 * Also checks process coordination and agent flow control.
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param node
 * @returns {Promise[]}
 */
function runNodeSuccessors(map, structure, runId, agent, node) {
    if (!executions[runId] || executions[runId].status == statusEnum.ERROR || executions[runId].status == statusEnum.DONE) { return Promise.resolve() } // status : 'Error' , 'Done'

    const successors = node ? helper.findSuccessors(node, structure) : [];
    if (successors.length === 0) {
        return endRunPathResults(runId, agent, map);
    }
    let promises = []
    successors.forEach((successor, successorIdx) => { // go over all successors and checks if successor pass execution conditions
        let process = findProcessByUuid(successor, structure);
        process = Object.assign({}, process.toObject())

        let passProcessCoordination = checkProcessCoordination(process, runId, agent, structure)
        let passAgentFlowCondition = checkAgentFlowCondition(runId, process, map, structure, agent)

        // if it is the last ancestoer of a process
        if (!passProcessCoordination && process.coordination === 'race' &&
            (successors.length - 1 == successorIdx)) {
            endRunPathResults(runId, agent, executions[runId].clientSocket, map);
        }

        // if there is an agent that already got to this process, the current agent should continue to the next process in the flow.
        if (passProcessCoordination && !passAgentFlowCondition) {
            if (process.flowControl === 'race') {
                if(process.coordination == 'race'){
                    executions[runId].executionAgents[agent.key].context.processes[process.uuid] = [] // indication that process uuid run (in case of race coordination) 
                }
                runNodeSuccessors(map, structure, runId, agent, process.uuid);
            }

            if (process.flowControl === 'wait' && !executions[runId].executionAgents[agent.key].context.processes[process.uuid]) { // if the process is already created. 
                process.status = statusEnum.PENDING
                createProcessContext(runId, agent, process.uuid, process)
            }
        }

        if (passProcessCoordination && passAgentFlowCondition) {
            if (process.flowControl === 'wait') {
                runAgentsFlowControlPendingProcesses(runId, map, structure, process)
            }

            createProcessContext(runId, agent, successor, process)
            promises.push(runProcess(map, structure, runId, agent, process))
        }
    })

    return Promise.all(promises)
}

function updateAgentContext(runId, agent, agentData) {
    executions[runId].executionAgents[agent.key] = Object.assign(executions[runId].executionAgents[agent.key], agentData)

    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        data: agentData
    }
    dbUpdates.updateAgent(options)
}

/**
 * Checks if there is no more running processes and finishes execution. 
 * @param {*} runId 
 * @param {*} agent 
 * @param {*} map 
 */
function endRunPathResults(runId, agent, map) {
    if (isThereProcessExecutingOnAgent(runId, agent.key)) { return }

    updateAgentContext(runId, agent, { status: statusEnum.DONE })

    if (!areAllAgentsDone(runId)) { return }

    let data = {
        finishTime: new Date(),
        status: statusEnum.DONE
    }

    let options = {
        mapResultId: executions[runId].mapResultId,
        data: data,
        socket: executions[runId].clientSocket
    }
    dbUpdates.updateMapResult(options)

    let socket = executions[runId].clientSocket

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
 * @returns {boolean} 
 */
function passProcessCondition(runId, agent, process) {
    if (!process.condition) {
        return true
    }
    let isProcessPassCondition, errMsg;
    try {
        isProcessPassCondition = vm.runInNewContext(process.condition, executions[runId].executionAgents[agent.key].context);
    } catch (e) {
        errMsg = `Error running process condition: ${e.message}`;
    }

    if (isProcessPassCondition) { return true }

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
    if (!process.preRun) { return }
    let processData = {}
    try {
        processData[fieldName] = vm.runInNewContext(funcToRun, executions[runId].executionAgents[agent.key].context);
    } catch (e) {
        processData[fieldName] = 'Error running preProcess function' + res
    }
    updateProcessContext(runId, agent, process.uuid, process.iterationIndex, processData);
}


/**
 * Returns a function for async.each call. this function is adding the process to the context, running all condition, filter, pre and post and calling the action execution function
 *
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param socket
 * @returns {Promise} - null resolve
 */
function runProcess(map, structure, runId, agent, process) {
    return new Promise((resolve, reject) => {
        if (!helper.isAgentShuldContinue(executions[runId].executionAgents[agent.key])) {
            return resolve()
        }

        if (!passProcessCondition(runId, agent, process)) {
            if (process.mandatory) { // mandatory process failed, stop executions
                executions[runId].executionAgents[agent.key].status = statusEnum.ERROR;
                return stopExecution(runId, null, "Mandatory process failed" );
            }
           endRunPathResults(runId, agent, map)
            return resolve()
        }

        runProcessFunc(runId, agent, process, 'preRunResult', process.preRun)

        let plugin = executions[runId].plugins.find(o => o.name.toString() == process.used_plugin.name)

        let actionsArray = [];

        process.actions.forEach((action, i) => {
            action.name = (action.name || `Action #${i + 1} `);
            actionsArray.push([
                map,
                structure,
                runId,
                agent,
                process,
                process.iterationIndex,
                _.cloneDeep(action),
                plugin.toJSON(),
                executions[runId].clientSocket
            ])
        });

        let reduceFunc = (promiseChain, currentAction, index) => {
            // let actionId = (currentAction[6]._id).toString()
            currentAction[6].actionIndex = index;
            // executions[runId].executionAgents[agent.key].context.processes[process.uuid][process.iterationIndex].actions[actionId] = currentAction[6];

            return promiseChain.then(chainResults => {
                return executeAction.apply(null, currentAction).then(currentResult => {
                    return [...chainResults, currentResult]
                })
            });
        }

        actionsArray.reduce(reduceFunc, Promise.resolve([])).then((actionsResults) => { // runs all actions of a process
            return actionsExecutionCallback(map, structure, runId, agent, process)
        }).catch((error) => {
            winston.log('error', error);
            console.error(error); //TODO: go over all console log and delete unnessasery
            updateProcessContext(runId, agent, process.uuid, process.iterationIndex, { status: statusEnum.ERROR, message: error.message, finishTime: new Date() });
        })
    })
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
function actionsExecutionCallback(map, structure, runId, agent, process) {
    if (!executions[runId] || executions[runId].executionAgents[agent.key].status) { // status is just error or done
        return;
    }
    runProcessFunc(runId, agent, process, 'postRunResult', process.postRun)
    updateProcessContext(runId, agent, process.uuid, process.iterationIndex, { status: statusEnum.DONE, finishTime: new Date() });
    runNodeSuccessors(map, structure, runId, agent, process.uuid);
}
/**
 * Send action to agent via socket
 * @param socket
 * @param action
 * @param actionForm
 * @returns {Promise<any>}
 */
function sendActionViaSocket(socket, uniqueRunId, actionForm) {
    socket.emit('add-task', actionForm);

    return new Promise((resolve, reject) => {
        socket.on(uniqueRunId, (data) => {
            resolve(data);
        });
    });
}


/**
 * Send action to agent via request
 * @param agent
 * @param action
 * @param actionForm
 * @returns {Promise<any>}
 */
function sendActionViaRequest(agent, actionForm) {

    return new Promise((resolve, reject) => {
        request.post(
            agentsService.agentsStatus()[agent.key].defaultUrl + '/api/task/add',
            {
                form: actionForm
            },
            function (error, response, body) {
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
            });
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

    let logMsg = {
        map: mapId,
        runId: runId,
        message: msg,
        status: status
    }

    clientSocket.emit('update', logMsg);
}

/**
 * return the method to use or throw error if not exist
 * @param {*} plugin 
 * @param {*} action 
 * @returns {object}
 */
function getMethodAction(plugin, action) {
    if (!action.method) {
        throw new Error('No method was provided');
    }

    let method = plugin.methods.find(o => o.name === action.method);
    if (!method) {
        throw new Error('Method wasn\'t found');
    }
    return method
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
 * @returns {object} - action result
 */
async function executeAction(map, structure, runId, agent, process, processIndex, action, plugin) {
    let actionData = {
        action: ObjectId(action._id),
        startTime: new Date(),
        retriesLeft: action.retries
    }

    createActionContect(runId, agent.key, process.uuid, processIndex, action, actionData)
    let actionString

    let params = action.params || [];
    action.params = {}
    action.plugin = { name: plugin.name };

    try {
        action.method = getMethodAction(plugin, action) // can throw error

        actionString = `+ ${plugin.name} - ${action.method.name}: `;

        for (let i = 0; i < params.length; i++) { // handle wrong code
            action.params[params[i].name] = await evaluateParam(params[i], action.method.params[i].type, executions[runId].executionAgents[agent.key].context);
            if (action.method.params[i].type != 'vault')
                actionString += `${params[i].name}: ${action.params[params[i].name]}${i != params.length - 1 ? ', ' : ''}`;
        }

    } catch (err) {
        updateActionContext(runId, agent.key, process.uuid, processIndex, action, {
            status: statusEnum.ERROR,
            finishTime: new Date(),
            result: { stderr: err.message }
        });
        console.error(err);
        return err.message // continue to next action if not mandatory 
    }

    action.uniqueRunId = `${runId}|${processIndex}|${action._id}`;


    let settings = await getSettingsAction(plugin);

    const actionExecutionForm = {
        mapId: map.id,
        versionId: 0, // TODO: check if possible to remove
        executionId: 0, //TODO: check if possible to remove
        action: action,
        key: agent.key,
        settings: settings
    };

    let agentPromise;
    if (agent.socket) {  // will send action to agent via socket or regular request
        agentPromise = sendActionViaSocket(agent.socket, action.uniqueRunId, actionExecutionForm);
    } else {
        agentPromise = sendActionViaRequest(agent, actionExecutionForm);
    }

    return runAction();

    /**
     * Declare a timeout function. 
     * If there is timeout the action failed.
     * In case of retries- try again
     * @returns {object} - action result
     */
    function runAction() {

        let timeoutFunc = helper.generateTimeoutFun(action)

        return Promise.race([agentPromise, timeoutFunc.timeoutPromise]).then((result) => { // race condition between agent action and action timeout
            clearTimeout(timeoutFunc.timeout);
            if (result === helper.IS_TIMEOUT) {
                return { result: 'Timeout Error', status: statusEnum.ERROR, stdout: actionString };
            }
            else {
                if (result.status === statusEnum.SUCCESS) {
                    if (result.stdout) {
                        result.stdout = actionString + '\n' + result.stdout;
                    } else {
                        result.stdout = actionString;
                    }
                }
                return result
            }
        }).then((result) => {
            let actionData = {
                status: result.status,
                result: result
            }
            if (result.status == statusEnum.ERROR && action.retriesLeft > 0) { // retry handling
                actionData.retriesLeft = --action.retriesLeft
                updateActionContext(runId, agent.key, process.uuid, processIndex, action, actionData)
                return runAction();
            }
            actionData.finishTime = new Date();
            let msg = `'${process.name} ' - '${action.name}' result: ${JSON.stringify(result)} (${agent.name})`
            _updateRawOutput(map._id, runId, msg, result.status)
            updateActionContext(runId, agent.key, process.uuid, processIndex, action, actionData);
            return result;
        });
    }
}


/**
 * sending a kill action request to agent.
 * @param mapId
 * @param actionId
 * @param agentKey
 * @returns {Promise<any>}
 */
function sendKillRequest(mapId, actionId, agentKey) {
    return new Promise((resolve, reject) => {
        request.post(
            agentsService.agentsStatus()[agentKey].defaultUrl + '/api/task/cancel',
            {
                form: {
                    mapId: mapId,
                    actionId: actionId,
                    key: agentKey
                }
            },
            function (error, response, body) {
                resolve();
            });
    });
}

/**
 *  Stop and Update MapResult and running actions. 
 * @param {*} runId 
 * @param {*} mapId 
 * @param {*} socket 
 * @param {string} result - the cuase of stopping the execution  
 */
async function stopExecution(runId, socket = null, result = "", mapResultId = null) {
    if (!runId && mapResultId) {
        runId = (await MapResult.findOne({ _id: ObjectId(mapResultId) })).runId
    }
    const d = new Date();
    let options, optionAction

    if (!executions[runId]) { return updateClientExecutions(socket); }

    let executionAgents = executions[runId].executionAgents
    Object.keys(executionAgents).forEach(agentKey => {
        let agent = executionAgents[agentKey];
        agent.key = agentKey
        if (!agent) return;
        optionAction = []
        for (let uuid in agent.context.processes) {
            let processArray = agent.context.processes[uuid];
            processArray.forEach(process => {
                if(process.startNode|| process.finishTime){return}
                updateProcessContext(runId,agent,process.uuid,process.iterationIndex, {status:statusEnum.STOPPED,finishTime:d})
                if (!process.actions) {
                    return
                }
                Object.keys(process.actions).forEach(actionKey => {
                    let action = process.actions[actionKey];
                    if (!action.finishTime) {
                        let data = {
                            status: statusEnum.STOPPED,
                            finishTime: d
                        }
                        let option = {
                            data: data,
                            processIndex: process.processIndex,
                            actionIndex: action.actionIndex
                        }
                        optionAction.push(option)
                        sendKillRequest(executions[runId].mapResultId, actionKey, agentKey);
                    }
                });
            });
        } 2
        options = {
            data: optionAction,
            agentId: agent.id,
            mapResultId: executions[runId].mapResultId

        }
        optionAction ? dbUpdates.updateActionsInAgent(options) : null
    });

    updateMapResult(executions[runId].mapResultId, { finishTime: d, status: statusEnum.STOPPED + " - " + result }, executions[runId].clientSocket)

    startPendingExecution(executions[runId].mapId, executions[runId].clientSocket)
    updateClientExecutions(executions[runId].clientSocket, runId);

}

/**
 * get all pending execution from db and saves it globaly.
 */
async function rebuildPending() {
    let allPending = await MapResult.find({ status: statusEnum.PENDING })
    pending = {}
    allPending.map(pendingMap => {
        pending[pendingMap.map.toString()] ? pending[pendingMap.map.toString()].push(pendingMap.runId) : pending[pendingMap.map.toString()] = [pendingMap.runId]
    })
    updateClientPending(clientSocket)

}

/**
 * removes pending execution from pending object
 * @param mapId
 * @param runId
 * @param socket
 * @returns {Promise<null>}
 */
function cancelPending(mapId, runId, socket) {
    return new Promise(async (resolve, reject) => {
        if (!mapId || !runId) {
            throw new Error('Not enough parameters');

        }
        if (!pending.hasOwnProperty(mapId)) {
            throw new Error('No pending executions for this map');
        }
        const runIndex = pending[mapId].findIndex((o) => o === runId);
        if (runIndex === -1) {
            throw new Error('No such job');
        }

        await MapResult.findOneAndUpdate({ runId: runId }, { status: statusEnum.CANCELED })
        pending[mapId].splice(runIndex, 1);
        updateClientPending(socket);
        resolve();
    });


}

function sortDatabyFinishTime(data) {
    return data.sort((a, b) => {
      return -(new Date(b.finishTime) - new Date(a.finishTime));
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
     * @returns {Promise<object[]>}
     */
    logs: async (resultId) => {
        let q = { runId: resultId };
        let mapResult = await MapResult.findOne(q).populate({path:'agentsResults.agent', select:'name'}).exec() 
        let logs = []
        let structure = await mapsService.getMapStructure(mapResult.map, mapResult.structure) // for process/actions names (populate on names didnt work)
        let processNames = {} // a map <process.id, process name>  
        let actionNames = {} // same as above 
        structure.processes.forEach((process,iProcess) => {
            processNames[process.id] = process.name || (processNames[process.id]? processNames[process.id] :`Process #${iProcess+1}`) // extract process name
            if(!process.actions){return}
            process.actions.forEach((action, iAction)=>{
                actionNames[action.id] = action.name || `Action #${iAction+1}` // extract action name 
            })
        });
        
        // sort all actions results by finishTime 
        mapResult.agentsResults.forEach((agentResult) => {
            agentResult.processes.forEach((process) => {
                process.actions.forEach((action) => {
                    logs.push({finishTime:action.finishTime,  message: `'${processNames[process.process.toString()]}' - '${actionNames[action.action.toString()]}' result: ${JSON.stringify(action.result)} (${agentResult.agent.name})`})
                })
            });
        })
        logs = sortDatabyFinishTime(logs)
        logs.forEach(log=>delete log.finishTime)
        return Promise.resolve(logs)
    },


    /**
     * getting all results for a certain map (not populated)
     * @param mapId {string}
     */
    results: (mapId, page) => {
        const load_Results = 25;
        let index = (page * load_Results) - load_Results;
        return MapResult.find({ map: mapId }, null, { sort: { startTime: -1 } }).select('-agentsResults').skip(index).limit(load_Results)
    },
    /**
     * get an id of specific result and return populated object
     * @param resultId {string}
     * @returns {Query} a result with structure and agent result populated
     */
    detail: (resultId) => {
        return MapResult.findById(resultId).populate('structure agentsResults.agent');
    },

    /**
     * returning all maps result
     * @returns {Document|Promise|Query|*|void}
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