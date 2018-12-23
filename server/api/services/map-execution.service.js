const vm = require('vm');
const fs = require('fs');
const path = require('path');

const winston = require('winston');
const async = require('async');
const request = require('request');
const _ = require("lodash");
const ObjectId = require('mongoose').Types.ObjectId;

const models = require("../models");

const MapResult = models.Result;
const MapExecutionLog = models.ExecutionLog;
const Map = models.Map;

const executionLogService = require('./execution-log.service');
const agentsService = require('./agents.service');
const mapsService = require('./maps.service');
const pluginsService = require('../services/plugins.service');

let executions = {};
let pending = {};

let libpm = '';
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

function evaluateParam(param, context) {
    if (!param.code) {
        return param.value;
    }
    return vm.runInNewContext(param.value, context);

}

function _createContext(context) {
    return {
        ...context,
        require,
        console,
        Buffer
    }
}

function createContext(mapObj, context) {
    try {
        vm.runInNewContext(libpm + '\n' + mapObj.code, _createContext(context));
        return 0;
    } catch (error) {
        return error;
    }
}

/**
 * returning start node for a structure
 * @param structure
 * @returns {*}
 */
function findStartNode(structure) {
    let node;
    const links = structure.links;
    for (let i = 0; i < links.length; i++) {
        let source = links[i].sourceId;
        let index = structure.processes.findIndex((o) => {
            return o.uuid === source;
        });
        if (index === -1) {
            node = { type: 'start_node', uuid: source };
            return node;
        }
    }
    return node
}

/**
 * Emitting executions values.
 * @param socket
 */
function updateExecutions(socket) {
    let emitv = Object.keys(executions).reduce((total, current) => {
        total[current] = executions[current].map;
        return total;
    }, {});
    socket.emit('executions', emitv);
}

/**
 * Emmiting pending executions where mapId is keys and value is array of pending runIds
 * @param socket
 */
function updatePending(socket) {
    let emitv = {};
    Object.keys(pending).forEach((mapId) => {
        emitv[mapId] = pending[mapId].map(o => o.runId);
    });

    socket.emit('pending', emitv);
}

/**
 * Adding a new process to context and returning its index in the executions array.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param process
 * @returns {number}
 */
function addProcessToContext(runId, agentKey, processKey, process) {
    executions[runId].executionContext.visitedProcesses.add(processKey);
    const processData = {
        startTime: new Date(),
        status: 'executing',
        uuid: processKey,
        name: process.name,
        actions: {},
        plugin: process.used_plugin.name
    };
    if (!executions[runId].executionAgents[agentKey].processes) {
        executions[runId].executionAgents[agentKey].processes = {};
    }
    if (!executions[runId].executionAgents[agentKey].processes[processKey]) {
        executions[runId].executionAgents[agentKey].processes[processKey] = [];
    }

    executions[runId].executionAgents[agentKey].processes[processKey].push(processData);
    return executions[runId].executionAgents[agentKey].processes[processKey].length - 1;
}

/**
 * Assigning data to process execution.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param processIndex
 * @param processData
 */
function updateProcessContext(runId, agentKey, processKey, processIndex, processData) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        // console.log('out out out out out out');
        return;
    }
    executions[runId].executionAgents[agentKey].processes[processKey][processIndex] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey][processIndex] || {}),
        processData
    );

    executions[runId].executionAgents[agentKey].executionContext.processes = executions[runId].executionAgents[agentKey].processes;
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
function updateActionContext(runId, agentKey, processKey, processIndex, actionKey, actionData) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }
    executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[actionKey] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[actionKey] || {}),
        actionData
    );

    executions[runId].executionAgents[agentKey].executionContext.processes = executions[runId].executionAgents[agentKey].processes;

    // If action have a result (i.e. done) set to previous action;
    if (actionData.result)
        executions[runId].executionAgents[agentKey].executionContext.previousAction = executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[actionKey];
        updatecurrentAgentContext(runId,agentKey);
}


function updatecurrentAgentContext(runId,agentKey){
    Object.keys(libpmObjects.currentAgent).forEach(field =>{
        executions[runId].executionAgents[agentKey].executionContext.currentAgent[field] = executions[runId].executionAgents[agentKey][field]    
    })
}

/**
 * updating executions data with agents data.
 * @param runId
 * @param agentKey
 */
function updateExecutionContext(runId, agentKey) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }
    executions[runId].executionAgents[agentKey].executionContext['processes'] = executions[runId].executionAgents[agentKey].processes;
    Object.keys(executions[runId].executionAgents).forEach(agentK => {
        executions[runId].executionAgents[agentK].executionContext['globalContext'] = executions[runId].executionAgents;
    });
}

/**
 * Returns if agent should continue execution
 * @param runId
 * @param agentKey
 * @returns {boolean}
 */
function shouldContinueExecution(runId, agentKey) {
    return executions.hasOwnProperty(runId) && !executions[runId].stop && executions[runId].executionAgents[agentKey].continue;
}

/**
 * returns how many executions exists for map
 * @param mapId
 * @returns {number}
 */
function countOngoingMapExecutions(mapId) {
    if (typeof (mapId) !== 'string') {
        mapId = mapId.toString();
    }
    return Object.keys(executions).filter(runId => {
        return executions[runId].map.toString() === mapId
    }).length;
}

/**
 * Starting a pending execution
 * @param mapId
 */
function startPendingExecution(mapId) {
    if (!pending.hasOwnProperty(mapId) || !pending[mapId].length) {
        return;
    }
    const pendingToExecute = pending[mapId].splice(0, 1)[0];
    executeFromMapStructure(
        pendingToExecute.map,
        pendingToExecute.structureId,
        pendingToExecute.runId,
        pendingToExecute.cleanWorkspace,
        pendingToExecute.socket,
        pendingToExecute.configurationName,
        pendingToExecute.triggerReason,
        pendingToExecute.agents
    );
}

/**
 * filter agents for execution
 * @param mapCode
 * @param executionContext
 * @param groups
 * @param mapAgents
 * @param executionAgents
 * @returns {*}
 */
function filterExecutionAgents(mapCode, executionContext, groups, mapAgents, executionAgents) {
    function filterLiveAgents(agents) {
        let agentsStatus = Object.assign({}, agentsService.agentsStatus());
        let executionAgents = {};
        agents.forEach((agentObj) => {
            const agentStatus = _.find(agentsStatus, (agent) => agent.id === agentObj.id);
            if (!agentStatus) {
                return;
            }
            agentObj.status = 'available';
            agentObj.key = agentStatus.key;
            agentObj.continue = true;
            agentObj.pendingProcesses = {};
            agentObj.socket = agentsStatus[agentStatus.key].socket;
            agentObj.executionContext = _createContext(executionContext);
            vm.runInNewContext(libpm + '\n' + mapCode, agentObj.executionContext);
            executionAgents[agentStatus.key] = agentObj;
        });
        return executionAgents;

    }

    if (!executionAgents) {
        let groupsAgents = {};

        return new Promise((resolve, reject) => {
            async.each(groups,
                (group, callback) => {
                    groupsAgents = Object.assign(groupsAgents, agentsService.evaluateGroupAgents(group));
                    callback();
                }, (error) => {
                    resolve(Object.keys(groupsAgents).map(key => groupsAgents[key]));
                })
        }).then((groupsAgents) => {
            let totalAgents = [...JSON.parse(JSON.stringify(mapAgents)), ...JSON.parse(JSON.stringify(groupsAgents))];
            return filterLiveAgents(totalAgents);

        });
    }

    return agentsService.filter({
        $or: [
            { _id: { $in: executionAgents.filter((id) => ObjectId.isValid(id)) } },
            { name: { $in: executionAgents } }
        ]
    }).then((agents) => {
        return filterLiveAgents(agents);
    });
}


/**
 * executes a map from a structure
 * @param map - the map object to execute
 * @param structureId - the id of the structure that is to be executed
 * @param runId - the unique runId
 * @param cleanWorkspace
 * @param socket - the socket to update
 * @param configurationName - configuration name to use
 * @param triggerReason - trigger message
 * @param agents - object of agents to run, if none will run on selected agents. should be name or id
 */
function executeFromMapStructure(map, structureId, runId, cleanWorkspace, socket, configuration, triggerReason, agents) {
    let mapResult;
    let mapStructure;
    let executionContext;
    let selectedConfiguration;
    let mapAgents = map.agents;

    return mapsService.getMapStructure(map._id, structureId).then(structure => {
        if (!structure) {
            throw new Error('No structure found.');
        }
        mapStructure = structure;

        if (configuration && typeof configuration != 'string') {
            selectedConfiguration = {
                name: 'custom',
                value: configuration
            }
        } else if (mapStructure.configurations && mapStructure.configurations.length) {
            if (configuration)
                selectedConfiguration = configuration ? mapStructure.configurations.find(o => o.name === configuration) : mapStructure.configurations.find(o => o.selected);
            if (!selectedConfiguration) {
                selectedConfiguration = mapStructure.configurations[0];
            }
        }

        if (selectedConfiguration)
            executionLogService.error(runId, map._id, `Using '${selectedConfiguration.name}' as configuration`, socket);
        else
            selectedConfiguration = {};

        executionContext = {
            map: {
                name: map.name,
                agents: mapAgents,
                id: map.id,
                nodes: mapStructure.processes,
                links: mapStructure.links,
                code: mapStructure.code,
                version: 0,
                structure: structure._id
            },
            runId: runId,
            startTime: new Date(),
            structure: structure._id,
            configuration: selectedConfiguration ? selectedConfiguration.value : '',
            visitedProcesses: new Set() // saving uuid of process ran by all the agents (used in flow control)
        };

        return filterExecutionAgents(mapStructure.code, executionContext, map.groups, map.agents, agents);

    }).then((executionAgents) => {
        if (Object.keys(executionAgents).length === 0) { // exit if no live agents for this map
            winston.log('error', 'No agents selected or no live agents');
            executionLogService.error(runId, map._id, 'No agents selected or no live agents', socket);
            throw new Error('No agents selected or no live agents');
        }
        executionContext.agents = executionAgents;
        executions[runId] = { map: map._id, executionContext: executionContext, executionAgents: executionAgents };
        let res = createContext(mapStructure, executionContext);
        if (res !== 0) {
            throw new Error('Error running map code' + res);
        }

        return MapResult.create({
            map: map._id,
            runId: runId,
            structure: mapStructure._id,
            startTime: new Date(),
            configuration: selectedConfiguration,
            trigger: triggerReason
        });
    }).then(result => {
        socket.emit('map-execution-result', result);
        mapResult = result;
        executions[runId].resultObj = result._id;
        const names = mapStructure.used_plugins.map(plugin => plugin.name);
        return pluginsService.filterPlugins({ name: { $in: names } })
    }).then((plugins) => {
        executionContext.plugins = plugins;
        startMapExecution(map, mapStructure, runId, socket);
        updateExecutions(socket);
        return runId;
    }).catch((error) => {
        winston.log('error', error);
        if (pending.hasOwnProperty(map.id) && pending[map.id].length) {
            startPendingExecution(map.id);
            updatePending(socket);
        }
    });

}


function executeMap(mapId, structureId, cleanWorkspace, req, configurationName, triggerReason, agents) {
    const socket = req.io;

    function guidGenerator() {
        let S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + '-' + S4());
    }

    // TODO: add execution by sourceID
    let runId = guidGenerator();
    executionLogService.info(runId, mapId, triggerReason || 'Starting map execution', socket);

    let map;

    return mapsService.get(mapId).then((mapobj) => {
        if(!mapobj){
            throw new Error(`Couldn't find map`);
        }
        if (mapobj.archived) {
            throw new Error('Can\'t execute archived map');
        }
        map = mapobj;
        const ongoingExecutions = countOngoingMapExecutions(mapId);
        if (map.queue && (ongoingExecutions >= map.queue || (pending.hasOwnProperty(mapId) && pending[mapId].length))) {
            // check if there is a queue and running maps or a pending queue for this map
            if (!pending.hasOwnProperty(mapId)) {
                pending[mapId] = [];
            }
            pending[mapId].push({
                map,
                structureId,
                runId,
                cleanWorkspace,
                socket,
                configurationName,
                triggerReason,
                agents
            });
            updatePending(socket);
            return;
        }
        return executeFromMapStructure(map, structureId, runId, cleanWorkspace, socket, configurationName, triggerReason, agents);
    });
}

/**
 * find a process in a map structure by uuid.
 * @param uuid
 * @param structure
 * @returns {Process}
 */
function findProcessByUuid(uuid, structure) {
    return structure.processes.find(o => o.uuid === uuid);
}

/**
 * return ancestors for a certain node
 * @param nodeUuid
 * @param structure
 * @returns {Array} - uuid of ancestors
 */
function findAncestors(nodeUuid, structure) {
    let links = structure.links.filter((o) => o.targetId === nodeUuid);
    return links.reduce((total, current) => {
        total.push(current.sourceId);
        return total;
    }, []);
}

/**
 * returns successors uuids for certain node
 * @param nodeUuid
 * @param structure
 * @returns {Array}
 */
function findSuccessors(nodeUuid, structure) {
    let links = structure.links.filter((o) => o.sourceId === nodeUuid);
    return links.reduce((total, current) => {
        total.push(current.targetId);
        return total;
    }, []);
}

/**
 * Checks if agents have correct plugins versions, if not install them
 * @param map
 * @param structure
 * @param runId
 * @param agentKey
 */
function validate_plugin_installation(map, structure, runId, agentKey) {
    const agents = agentsService.agentsStatus();
    return new Promise((resolve, reject) => {
        let plugins = executions[runId].executionContext.plugins;
        // check if agents has the right version of the plugins.
        const filesPaths = plugins.reduce((total, current) => {
            if (current.version !== agents[agentKey].installed_plugins[current.name]) {
                total.push(current.file);
            }
            return total;
        }, []);

        if (filesPaths && filesPaths.length > 0) {
            async.each(filesPaths,
                function (filePath, callback) {
                    agentsService.installPluginOnAgent(filePath, agents[agentKey]).then(() => {
                    }).catch((e) => {
                        winston.log('error', 'Error installing on agent', e);
                    });
                    callback();
                },
                function (error) {
                    if (error) {
                        winston.log('error', 'Error installing plugins on agent, it may be a fatal error', error);
                    }
                    winston.log('success', 'Done installing plugins');
                    resolve();
                });
        } else {
            resolve();
        }
    });
}

function startMapExecution(map, structure, runId, socket) {
    let agents = executions[runId].executionAgents;
    const startNode = findStartNode(structure);

    async.each(agents, runMapFromAgent(map, structure, runId, startNode.uuid, socket), function (error) {
    })
}

function runMapFromAgent(map, structure, runId, node, socket) {
    return (agent, callback) => {
        validate_plugin_installation(map, structure, runId, agent.key).then(() => {
            runNodeSuccessors(map, structure, runId, agent, node, socket);
            callback();
        });
    }
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
        processes = Object.keys(executions[runId].executionAgents[agentKey].processes);
    } catch (e) {
        return false;
    }
    for (let i = processes.length - 1; i >= 0; i--) {
        if (executions[runId].executionAgents[agentKey].processes[processes[i]].findIndex(p => p.status === 'executing') > -1) {
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
        if (!executionAgents[i].done) {
            return false;
        }
    }
    return true;
}

/**
 *
 * @param runId
 * @param processKey
 * @returns {boolean}
 */
function isThisTheFirstAgentToGetToTheProcess(runId, processKey, agentKey) {
    if (executions.hasOwnProperty(runId) && executions[runId].executionContext.visitedProcesses[processKey]) {
        return executions[runId].executionContext.visitedProcesses[processKey] == agentKey;
    }
    executions[runId].executionContext.visitedProcesses[processKey] = agentKey;
    return true;
}

/**
 * Check if there is an agent that stopped
 * @param runId
 * @returns {boolean}
 */
function areAllAgentsAlive(runId) {
    const executionAgents = executions[runId].executionAgents;
    for (let i in executionAgents) {
        if (!executionAgents[i].continue) {
            return false;
        }
    }
    return true;
}

/**
 * Checking if all agents has this process pending
 * @param runId
 * @param processKey
 * @param agentKey
 * @returns {boolean}
 */
function areAllAgentsWaitingToStartThis(runId, processKey, agentKey) {
    const executionAgents = executions[runId].executionAgents;

    executionAgents[agentKey].pendingProcesses[processKey] = new Date();

    for (let i in executionAgents) {
        if (!executionAgents[i].pendingProcesses.hasOwnProperty(processKey)) {
            return false;
        }
    }
    return true;
}

/**
 * Finds all successors for node and run them in parallel if meeting coordination criteria.
 * Also check flow control condition and correlating agents.
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param node
 * @param socket
 */
function runNodeSuccessors(map, structure, runId, agent, node, socket) {
    if (!shouldContinueExecution(runId, agent.key)) {
        return;
    }
    const successors = node ? findSuccessors(node, structure) : [];
    if (successors.length === 0) {
        endRunPathResults(runId, agent, socket, map);

    }
    let nodesToRun = [];
    successors.forEach((successor, successorIdx) => {
        let ancestors = findAncestors(successor, structure);
        const process = findProcessByUuid(successor, structure);
        if (ancestors.length > 1) {
            // checking merge conditions
            if (process.coordination === 'wait') {
                let flag = true;
                ancestors.forEach(ancestor => {
                    if (!executions[runId].executionAgents[agent.key].processes.hasOwnProperty(ancestor) ||
                        ['error', 'success', 'partial'].indexOf(executions[runId].executionAgents[agent.key].processes[ancestor][0].status) === -1) {
                        flag = false;
                    }
                });
                if (!flag) {
                    return;
                }
            } else if (process.coordination === 'race') {
                if (executions[runId].executionAgents[agent.key].processes && executions[runId].executionAgents[agent.key].processes.hasOwnProperty(process.uuid)) {
                    if (successors.length - 1 == successorIdx) {
                        endRunPathResults(runId, agent, socket, map);
                    }
                    return;
                }
            }
        }

        // checking agent flow condition
        if (process.flowControl === 'race') {
            // if there is an agent that already got to this process, the current agent should continue to the next process in the flow.
            if (!isThisTheFirstAgentToGetToTheProcess(runId, successor, agent.key)) {
                return runNodeSuccessors(map, structure, runId, agent, successor, socket);
            }
        } else if (process.flowControl === 'wait') {
            // if not all agents are still alive, the wait condition will never be met, should stop the map execution
            if (!areAllAgentsAlive) {
                return stopExecution(map.id, runId, socket);
            }
            // if there is a wait condition, checking if it is the last agent that got here and than run all the agents
            if (areAllAgentsWaitingToStartThis(runId, successor, agent.key)) {
                const executionAgents = executions[runId].executionAgents;
                for (let i in executionAgents) {
                    if (i === agent.key) {
                        continue;
                    }
                    runNode(map, structure, runId, executionAgents[i], successor, socket);
                    delete executionAgents[i].pendingProcesses[successor] // Remove the pending process from the object.
                }
            }
        }
        nodesToRun.push({
            index: addProcessToContext(runId, agent.key, successor, process),
            uuid: successor,
            process: process
        });
    });
    async.each(nodesToRun, runProcess(map, structure, runId, agent, socket), (error) => {
        if (error) {
            winston.log('error', error);
        }
    });
}


function endRunPathResults(runId, agent, socket, map) {
    if (isThereProcessExecutingOnAgent(runId, agent.key)) { return }
    executions[runId].executionAgents[agent.key].done = true;
    if (!areAllAgentsDone(runId)) { return }
    executions[runId].executionContext.finishTime = new Date();
    summarizeExecution(executions[runId].executionContext.map, runId, _.cloneDeep(executions[runId].executionContext), _.cloneDeep(executions[runId].executionAgents)).then((mapResult) => {
        socket.emit('map-execution-result', mapResult);
    });
    MapResult.findByIdAndUpdate(executions[runId].resultObj, { $set: { finishTime: new Date(), cleanFinish: true } }, { new: true })
        .then((mapResult) => {
            socket.emit('map-execution-result', mapResult);
        });
    delete executions[runId];
    if (map.queue && pending.hasOwnProperty(map.id)) {
        startPendingExecution(map.id); // starting pending execution if necessary
        updatePending(socket);
    }
    updateExecutions(socket);
}

/**
 * running a certain node (without condition)
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param node
 * @param socket
 */
function runNode(map, structure, runId, agent, node, socket) {
    if (!shouldContinueExecution(runId, agent.key)) {
        return;
    }


    async.each([node], runProcess(map, structure, runId, agent, socket), (error) => {
        if (error) {
            winston.log("error", error);
        }
    });
}

/**
 * returns a function for async.each call. this function is adding the process to the context, running all condition, filter, pre and post and calling the action execution function
 *
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param socket
 * @returns {function(*=, *)}
 */
function runProcess(map, structure, runId, agent, socket) {
    return (execProcess, callback) => {
        const processUUID = execProcess.uuid;
        if (!shouldContinueExecution(runId, agent.key)) {
            return callback();
        }
        let process = execProcess.process;

        const processIndex = execProcess.index; // adding the process to execution context and storing index in the execution context.

        // testing filter agents condition.
        if (process.filterAgents) {
            let res;
            let errorMsg;
            try {
                res = vm.runInNewContext(process.filterAgents, executions[runId].executionAgents[agent.key].executionContext);

            } catch (e) {
                errorMsg = `'${process.name}': Error running agent filter function: ${JSON.stringify(e)}`;
            }

            if (!res) {
                winston.log('error', (errorMsg || 'Agent didn\'t pass filter agent condition'));
                executionLogService.error(runId, map._id, (errorMsg || `'${process.name}': agent '${agent.name}' didn't pass filter function`), socket);

                updateProcessContext(runId, agent.key, processUUID, processIndex, {
                    status: 'error',
                    result: 'Agent didn\'t pass filter condition'
                });
                if (process.mandatory) {
                    executions[runId].executionAgents[agent.key].status = 'error';
                    executions[runId].executionAgents[agent.key].continue = false;
                    stopExecution(map._id, runId, socket);
                }

                executions[runId].executionAgents[agent.key].finishTime = new Date();
                callback();
                updateExecutionContext(runId, agent.key);
                return;
            }

        }

        // testing process condition
        if (process.condition) {
            let res;
            let errMsg;
            try {
                res = vm.runInNewContext(process.condition, executions[runId].executionAgents[agent.key].executionContext);
            } catch (e) {
                errMsg = `Error running process condition: ${e.message}`;
                executionLogService.error(runId, map._id, `'${process.name}': Error running process condition: ${JSON.stringify(e)}`, socket);
            }

            if (!res) { // process didn't pass condition or failed run condition function
                winston.log('info', errMsg || "Process didn't pass condition");
                executions[runId].executionAgents[agent.key].finishTime = new Date();
                updateProcessContext(runId, agent.key, processUUID, processIndex, {
                    status: "error",
                    result: errMsg || "Process didn't pass condition",
                    finishTime: new Date()

                });
                if (process.mandatory) { // mandatory process failed, agent should not execute more processes
                    winston.log('info', "Mandatory process failed");
                    executions[runId].executionAgents[agent.key].continue = false;
                    executions[runId].executionAgents[agent.key].status = 'error';
                    stopExecution(map._id, runId, socket);
                    updateExecutionContext(runId, agent.key);
                    callback();
                    return;
                }
                updateExecutionContext(runId, agent.key);
                runNodeSuccessors(map, structure, runId, agent, false, socket); // by passing false, no successors would be called
                callback();
                return;
            }
        }

        // running process preRun function and storing it in the context
        if (process.preRun) {
            let res;
            try {
                res = vm.runInNewContext(process.preRun, executions[runId].executionAgents[agent.key].executionContext);
                updateProcessContext(runId, agent.key, processUUID, { preRun: res });
                updateExecutionContext(runId, agent.key);
            } catch (e) {
                winston.log('error', 'Error running pre process function');
                executionLogService.error(runId, map._id, `'${process.name}': error running pre-process function`, socket);
            }
        }

        let plugin = executions[runId].executionContext.plugins
            .find((o) => (o.name.toString() === process.used_plugin.name) || (o.name === process.used_plugin.name));
        let actionExecutionFunctions = {};

        process.actions.forEach((action, i) => {
            action.name = (action.name || `Action #${i + 1} `);
            actionExecutionFunctions[`${action.name} ("${action.id}")`] =
                executeAction(
                    map,
                    structure,
                    runId,
                    agent,
                    process,
                    processIndex,
                    _.cloneDeep(action),
                    plugin,
                    socket);
        });

        // updating context
        updateProcessContext(runId, agent.key, processUUID, processIndex, {
            startTime: new Date(),
            status: 'executing'
        });

        // executing actions
        async.series(actionExecutionFunctions, (error, actionsResults) => {
            if (!shouldContinueExecution(runId, agent.key)) {
                return callback();
            }
            let status;

            if (error) {
                winston.log('error', 'Fatal error: ', error);
                executionLogService.error(runId, map._id, `'${process.name}': A mandatory action failed`, socket);
                status = 'error';
                executions[runId].executionAgents['continue'] = (error && process.mandatory);
                updateExecutionContext(runId, agent.key);

            } else {
                let actionStatuses = [];
                if (executions[runId].executionAgents[agent.key].processes[processUUID][processIndex].actions) {
                    actionStatuses = Object.keys(executions[runId].executionAgents[agent.key].processes[processUUID][processIndex].actions)
                        .map((actionKey) => {
                            return executions[runId].executionAgents[agent.key].processes[processUUID][processIndex].actions[actionKey].status;
                        });
                }
                if (actionStatuses.indexOf('error') > -1 && actionStatuses.indexOf('success') === -1) { // if only errors - process status is error
                    status = 'error';
                } else if (actionStatuses.indexOf('error') > -1 && actionStatuses.indexOf('success') > -1) { // if error and success - process status is partial
                    status = 'partial';
                } else { // if only success - process status is success
                    status = 'success';
                }
            }

            if (process.postRun) {
                executionLogService.error(runId, map._id, `'${process.name}': Running post process function`, socket);

                // post run hook for link (enables user to change context)
                let res;
                try {
                    res = vm.runInNewContext(process.postRun, executions[runId].executionAgents[agent.key].executionContext);
                    updateProcessContext(runId, agent.key, processUUID, processIndex, { postRun: res });
                    updateExecutionContext(runId, agent.key);

                } catch (e) {
                    winston.log('error', 'Error running post process function');
                    executionLogService.error(runId, map._id, `'${process.name}': Error running post process function`, socket);
                }
            }

            updateProcessContext(runId, agent.key, processUUID, processIndex, {
                status: status,
                result: actionsResults,
                finishTime: new Date()
            });
            updateResultsObj(runId, _.cloneDeep(executions[runId].executionAgents));
            updateExecutionContext(runId, agent.key);

            if (!(error && process.mandatory)) { // if the process was mandatory agent should not call other process.
                executions[runId].executionAgents[agent.key].status = 'available';
                setTimeout(() => {
                    runNodeSuccessors(map, structure, runId, agent, processUUID, socket);
                }, 0);
            }
            callback();
        });
    }
}

/**
 * Send action to agent via socket
 * @param socket
 * @param action
 * @param actionForm
 * @returns {Promise<any>}
 */
function sendActionViaSocket(socket, action, actionForm) {
    socket.emit('add-task', actionForm);

    return new Promise((resolve, reject) => {
        socket.on(action.uniqueRunId, (data) => {
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
function sendActionViaRequest(agent, action, actionForm) {

    return new Promise((resolve, reject) => {
        request.post(
            agentsService.agentsStatus()[agent.key].defaultUrl + '/api/task/add',
            {
                form: actionForm
            },
            function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    // statements
                    body = {
                        res: e
                    };
                }

                if (error || response.statusCode !== 200) {
                    if (!body) {
                        body = { result: error };
                    }
                }
                resolve(body);
            });
    });
}

function executeAction(map, structure, runId, agent, process, processIndex, action, plugin, socket) {
    return (callback) => {
        let key = action._id;

        plugin = JSON.parse(JSON.stringify(plugin));
        action = JSON.parse(JSON.stringify(action));
        action.startTime = new Date();
        if (!action.hasOwnProperty('method') || !action.method) {
            const result = 'No method was provided';
            updateActionContext(runId, agent.key, process.uuid, processIndex, key, Object.assign(action, {
                status: 'error',
                finishTime: new Date(),
                result: { result, status: 'error' }

            }));
            updateResultsObj(runId, _.cloneDeep(executions[runId].executionAgents));
            executionLogService.success(runId, map._id, `'${action.name}': ${result}`, socket);
            callback(null, { result });
            return;
        }

        let method = plugin.methods.find(o => o.name === action.method);
        if (!method) {
            const result = 'Method wasn\'t found';
            updateActionContext(runId, agent.key, process.uuid, processIndex, key, Object.assign(action, {
                status: 'error',
                finishTime: new Date(),
                result: { result, status: 'error' }
            }));
            updateResultsObj(runId, _.cloneDeep(executions[runId].executionAgents));
            executionLogService.success(runId, map._id, `'${action.name}': ${result}`, socket);
            callback(null, { result });
            return;
        }
        action.method = method;
        let params = action.params ? [...action.params] : [];
        action.params = {};
        action.plugin = {
            name: plugin.name
        };

        updateActionContext(runId, agent.key, process.uuid, processIndex, key, action);

        executionLogService.info(runId, map._id, `'${action.name}': executing action (${agent.name})`, socket);
        if (!shouldContinueExecution(runId, agent.key)) {
            console.log('Should not continue');
            return callback();
        }

        action.uniqueRunId = `${runId}|${processIndex}|${key}`;

        const actionExecutionForm = {
            mapId: map.id,
            versionId: 0,
            executionId: 0,
            action: action,
            key: agent.key
        };

        let actionString = `+ ${plugin.name} - ${method.name}: `;
        for (let i = 0; i < params.length; i++) {
            let param = _.find(method.params, (o) => {
                return o.name === params[i].name
            });

            // handle wrong code
            try {
                action.params[param.name] = evaluateParam(params[i], executions[runId].executionAgents[agent.key].executionContext);
            } catch (e) {
                return _handleActionError({
                    stdout: actionString + '\n' + e.message
                }, undefined, callback)
            }

            actionString += `${param.name}: ${action.params[param.name]}${i != params.length - 1 ? ', ' : ''}`;
        }
        executionLogService.info(runId, map._id, actionString, socket);

        // will send action to agent via socket or regular request
        let p;
        if (agent.socket) {
            p = sendActionViaSocket(agent.socket, action, actionExecutionForm);
        } else {
            p = sendActionViaRequest(agent, action, actionExecutionForm);
        }

        let timeout;
        let timeoutPromise;
        runAction();

        function _handleActionError(result, message, cb) {
            let res = result || { stdout: actionString, result: 'Error running action on agent' };
            updateActionContext(runId, agent.key, process.uuid, processIndex, key, {
                status: 'error',
                result: res,
                finishTime: new Date()
            });
            updateResultsObj(runId, _.cloneDeep(executions[runId].executionAgents));
            executionLogService.error(runId, map._id, `'${action.name}': Error running action on (${agent.name}): ${message || JSON.stringify(res)}`, socket);

            if (action.mandatory) {
                cb(res);
            } else {
                cb(null, res); // Action failed but it doesn't mater
            }
        }

        function runAction() {
            if (action.timeout || (!action.timeout && action.timeout !== 0)) { // if there is a timeout or no timeout
                timeoutPromise = new Promise((resolve, reject) => {
                    timeout = setTimeout(() => {
                        resolve(-1);
                    }, (action.timeout || 600000));
                });
            } else {
                timeoutPromise = new Promise(() => { });
            }
            Promise.race([p, timeoutPromise]).then((result) => { // race condition between agent action and action timeout
                clearTimeout(timeout);
                if (result !== -1) {
                    if (result.status === 'error' && action.retries > 1) { return ['retry', result]; }
                    updateActionContext(runId, agent.key, process.uuid, processIndex, key, { finishTime: new Date() });
                    if (result.status === 'success') {
                        if (result.hasOwnProperty('stdout')) {
                            result.stdout = actionString + '\n' + result.stdout;
                        } else {
                            result.stdout = actionString;
                        }
                        updateActionContext(runId, agent.key, process.uuid, processIndex, key, {
                            status: 'success',
                            result: result
                        });

                        updateResultsObj(runId, _.cloneDeep(executions[runId].executionAgents));

                        let actionExecutionLogs = [];
                        if (result.stdout) {
                            actionExecutionLogs.push(
                                {
                                    map: map._id,
                                    runId: runId,
                                    message: `'${action.name}' output: ${JSON.stringify(result.stdout)} (${agent.name})`,
                                    status: 'success'
                                }
                            );
                        }
                        if (result.stderr) {
                            actionExecutionLogs.push(
                                {
                                    map: map._id,
                                    runId: runId,
                                    message: `'${action.name}' errors: ${JSON.stringify(result.stderr)} (${agent.name})`,
                                    status: 'success'
                                }
                            );
                        }
                        actionExecutionLogs.push(
                            {
                                map: map._id,
                                runId: runId,
                                message: `'${action.name}' result: ${JSON.stringify(result.result)} (${agent.name})`,
                                status: 'success'
                            }
                        );

                        executionLogService.create(actionExecutionLogs, socket);
                        callback(null, result);
                    } else {
                        _handleActionError(result, undefined, callback);
                    }
                } else {
                    let result = { result: 'Timeout Error', status: 'error', stdout: actionString };
                    if (action.retries > 1) { return ['retry', result]; }

                    _handleActionError(result, 'timeout error', callback);
                }
            })
                .then((res) => {
                    if (Array.isArray(res) && res[0] === 'retry') { // retry handling
                        action.retries--;
                        executionLogService.success(runId, map._id, `'${action.name}': Error running action on '${agent.name}'. \nRetries left: ${action.retries}`, socket);
                        runAction();
                    }
                })
                .catch((error) => {
                    console.log("Error occurred: ", error);
                });
        }


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
 * Formatting the agents results and returns the formatted array
 * @param agentsResults
 */
function formatAgentsResults(agentsResults) {
    const results = [];
    let agentKeys = Object.keys(agentsResults);
    for (let i of agentKeys) {
        let agent = agentsResults[i];
        let agentResult = {
            processes: [],
            agent: agent._id || agent.id,
            status: agent.status === 'available' ? 'success' : agent.status,
            startTime: agent.startTime,
            finishTime: agent.finishTime
        };
        for (let j in agent.processes) {
            let process = agent.processes[j];

            process.forEach((instance, index) => {
                let processResult = {
                    index: index,
                    name: instance.name,
                    result: instance.result,
                    uuid: instance.uuid,
                    plugin: instance.plugin,
                    actions: [],
                    status: instance.status,
                    startTime: instance.startTime,
                    finishTime: instance.finishTime
                };

                for (let k in instance.actions) {
                    let action = instance.actions[k];

                    let actionResult = {
                        action: k,
                        name: action.name,
                        startTime: action.startTime,
                        finishTime: action.finishTime,
                        status: action.status,
                        result: action.result,
                        method: action.method ? action.method.name : null
                    };
                    processResult.actions.push(actionResult);
                }
                agentResult.processes.push(processResult);
            });
        }
        results.push(agentResult);
    }

    return results;
}

/**
 * Updating the result object.
 * @param runId
 * @param agentsResults
 */
function updateResultsObj(runId, agentsResults) {
    const results = formatAgentsResults(agentsResults);
    MapResult.findByIdAndUpdate(executions[runId].resultObj, { $set: { agentsResults: results } }, { new: true }).then(() => {
    });
}

/**
 * Updating the execution object with results and updating the model in the db.
 * @param map
 * @param runId
 * @param executionContext
 * @param agentsResults
 * @returns {Query} - updated result model
 */
function summarizeExecution(map, runId, executionContext, agentsResults) {
    let result = {};
    result.map = map._id || map.id;
    result.structure = executionContext.structure;
    result.startTime = executionContext.startTime;
    result.finishTime = executionContext.finishTime;
    result.runId = runId;
    result.cleanFinish = true;
    result.agentsResults = formatAgentsResults(agentsResults);
    return MapResult.findByIdAndUpdate(executions[executionContext.runId].resultObj, result, { new: true });
}

/**
 * get a map id and optional runId and removes the runId or all the execution of the map.
 * @param mapId {string}
 * @param runId {string}, optional
 * @param socket
 * @returns {string[]} array of stopped runs.
 */
function stopExecution(mapId, runId, socket) {
    /* putting stop sign on executions */
    let stoppedRuns = [];
    if (runId) {
        if (executions.hasOwnProperty(runId)) {
            executions[runId].stop = true;
            stoppedRuns.push(runId);
        }

    } else {
        Object.keys(executions).forEach(key => {
            if (executions[key].map === mapId) {
                executions[key].stop = true;
                stoppedRuns.push(key);
            }
        });
    }

    /* clean data */
    const d = new Date();
    stoppedRuns.forEach(runId => {
        executionLogService.info(runId, mapId, "Got stop signal. Stopping execution", socket);
        let executionAgents = executions[runId].executionAgents;
        executions[runId].executionContext.finishTime = d;

        Object.keys(executionAgents).forEach(agentKey => {
            let agent = executionAgents[agentKey];
            if (agent.status !== 'error') {
                agent.status = 'stopped';
                agent.finishTime = d;
            }

            if (!agent.hasOwnProperty('processes')) {
                return;
            }
            Object.keys(agent.processes).forEach(processKey => {
                let processArray = agent.processes[processKey];
                processArray.forEach(process => {
                    if (!process.status || process.status === 'executing') {
                        process.status = 'stopped';
                        process.result = 'Process stopped';
                        process.finishTime = d;
                    }
                    if (process.hasOwnProperty('actions')) {
                        Object.keys(process.actions).forEach(actionKey => {
                            let action = process.actions[actionKey];
                            if (!action.status || action.status === 'executing') {
                                action.status = 'stopped';
                                action.finishTime = d;
                                action.result = {
                                    status: 'stopped',
                                    result: 'Action stopped'
                                };
                                sendKillRequest(executions[runId].executionContext.map.id, actionKey, agentKey);
                            }
                        });
                    }
                });
            })
        });

        summarizeExecution(
            executions[runId].executionContext.map,
            runId,
            Object.assign({}, executions[runId].executionContext),
            Object.assign({}, executions[runId].executionAgents)
        )
            .then((mapResult) => {
                socket.emit('map-execution-result', mapResult);
            });
        delete executions[runId];
        updateExecutions(socket);
        if (pending.hasOwnProperty(mapId) && pending[mapId].length) {
            startPendingExecution(mapId);
            updatePending(socket);
        }
    }
    );
    return stoppedRuns;
}


module.exports = {
    /**
     * removes pending execution from pending object
     * @param mapId
     * @param runId
     * @param socket
     */
    cancelPending: (mapId, runId, socket) => {
        return new Promise((resolve, reject) => {
            if (!mapId || !runId) {
                throw new Error('Not enough parameters');

            }
            if (!pending.hasOwnProperty(mapId)) {
                throw new Error('No pending executions for this map');
            }
            const runIndex = pending[mapId].findIndex((o) => o.runId === runId);
            if (runIndex === -1) {
                throw new Error('No such job');

            }
            pending[mapId].splice(runIndex, 1);
            updatePending(socket);
            resolve();
        });

    },
    /**
     * starting a map execution
     * @param mapId {string}
     * @param versionIndex {string}
     * @param cleanWorkspace {boolean}
     * @param req {request}
     * @returns {Promise|*|Promise<T>} return an error or a runId if run started
     */
    execute: executeMap,
    /**
     * returning all logs for certain run or a map
     * @param mapId {string}
     * @param resultId {string}
     */
    logs: (mapId, resultId) => {
        let q = resultId ? { runId: resultId } : { map: mapId };
        return MapExecutionLog.find(q)
    },
    /**
     * getting all results for a certain map (not populated)
     * @param mapId {string}
     */
    results: (mapId) => {
        return MapResult.find({ map: mapId }, null, { sort: { startTime: -1 } }).select('-agentsResults')
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
        return MapResult.aggregate([
            { $sort: { "startTime": -1 } },
            {
                "$group":
                {
                    _id: "$map", count: { $sum: 1 },
                    exec: { $first: "$$CURRENT" },
                    map: { $first: "$map" },
                }
            },
            { $sort: { "exec.startTime": -1 } },
            { $limit: 16 }
        ]).then(res => {
            return Map.populate(res, { path: 'map' })
        })
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