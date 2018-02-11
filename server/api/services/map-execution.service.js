const vm = require("vm");
const fs = require("fs");
const path = require("path");

const winston = require("winston");
const graphlib = require('graphlib');
const _ = require("lodash");
const async = require("async");
const request = require("request");

const MapResult = require("../models/map-results.model");
const MapExecutionLog = require("../models/map-execution-log.model");
const agentsService = require("./agents.service");
const mapsService = require("./maps.service");
const pluginsService = require("../services/plugins.service");

let executions = {};


let libpm = '';
fs.readFile(path.join(path.dirname(path.dirname(__dirname)), 'libs', 'sdk.js'), 'utf8', function (err, data) {
    // opens the lib_production file. this file is used for user to use overwrite custom function at map code
    if (err) {
        return winston.log('error', err);
    }
    libpm = data;
});

function evaluateParam(param, context) {

    if (!param.code) {
        return param.value;
    }
    return vm.runInNewContext(param.value, context);

}

function createContext(mapObj, context) {
    try {
        vm.createContext(context);
        vm.runInNewContext(libpm + "\n" + mapObj.code, context);
        return 0;
    } catch (error) {
        return error;
    }
}

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

function buildMapGraph(map) {
    const startNode = findStartNode(map);
    // creating a directed graph from the map.
    let map_graph = new graphlib.Graph({ directed: true });
    map_graph.setNode(startNode.uuid, startNode);

    map.processes.forEach(node => {
        // for each process, check if there is a link who's targeted to it. if no, it isn't part of the flow and shouldn't be in the graph.
        let linkIndex = map.links.findIndex((o) => {
            return o.targetId === node.uuid;
        });
        if (linkIndex > -1) {
            map_graph.setNode(node.uuid, node);
        }
    });
    for (let i = map.links.length - 1; i >= 0; i--) {
        let link = map.links[i];
        link.linkIndex = i;
        map_graph.setEdge(link.sourceId, link.targetId, link);
    }

    return map_graph;
}

function buildMapGraphFromStructure(structure) {
    const startNode = findStartNode(structure);
    let mapGraph = new graphlib.Graph({ directed: false });
    mapGraph.setNode(startNode.uuid, startNode);
    structure.processes.forEach(node => {
        if (!node.uuid) {
            return;
        }
        // for each process, check if there is a link who's targeted to it. if no, it isn't part of the flow and shouldn't be in the graph.
        let linkIndex = structure.links.findIndex((o) => {
            return o.targetId === node.uuid;
        });
        if (linkIndex > -1) {
            mapGraph.setNode(node.uuid, node);
        }
    });

    structure.links.forEach((link, i) => {
        if (link.hasOwnProperty("sourceId") || link.hasOwnProperty('targetId')) {
            return;
        }
        mapGraph.setEdge(link.sourceId, link.targetId, link);
    });
    return mapGraph;

}

let notify = function (socket) {
    return function (title, message, status) {
        socket.emit('notification', { title: title, message: message, status: (status || 'info') });
    };
};

function createLog(log, socket) {
    MapExecutionLog.create(log).then((newLog) => {
        socket.emit('notification', newLog);
        socket.emit('update', newLog);
    });
}

function updateExecutions(socket) {
    let emitv = Object.keys(executions).reduce((total, current) => {
        total[current] = executions[current].map;
        return total;
    }, {});
    socket.emit('executions', emitv);
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
    const processData = {
        startTime: new Date(),
        status: '',
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
 * @param processData
 */
function updateProcessContext(runId, agentKey, processKey, processIndex, processData) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }

    executions[runId].executionAgents[agentKey].processes[processKey][processIndex] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey][processIndex] || {}),
        processData
    );
}

/**
 * assigning data to action execution.
 * @param runId
 * @param agentKey
 * @param processKey
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
        executions[runId].executionAgents[agentK].executionContext["globalContext"] = executions[runId].executionAgents;
    });
}

/**
 * Returns if agent should continue execution
 * @param runId
 * @param agentKey
 * @returns {boolean}
 */
function shouldContinueExecution(runId, agentKey) {
    return (!executions[runId].stop) && executions[runId].executionAgents[agentKey].continue;
}

function executeMap(mapId, structureId, cleanWorkspace, req) {
    const socket = req.io;

    function guidGenerator() {
        let S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + "-" + S4());
    }

    // TODO: add execution by sourceID
    let runId = guidGenerator();
    createLog({
        map: mapId,
        runId: runId,
        message: "Starting map execution",
        status: "info"
    }, socket);

    let map;
    let mapResult;
    let mapStructure;
    let mapAgents;
    let executionContext;
    return mapsService.get(mapId).then(mapobj => {
        if (mapobj.archived) {
            throw new Error("Can't execute archived map");
        }
        map = mapobj;
        mapAgents = map.agents;
        return mapsService.getMapStructure(mapId, structureId);
    }).then(structure => {
        if (!structure) {
            throw new Error("No structure found.");
        }
        mapStructure = structure;
        executionContext = {
            map: {
                name: map.name,
                agents: mapAgents,
                id: map.id,
                nodes: mapStructure.processes,
                links: mapStructure.links,
                attributes: mapStructure.attributes,
                code: mapStructure.code,
                version: 0,
                structure: structure._id
            },
            runId: runId,
            startTime: new Date(),
            structure: structure._id,
        };

        let agents = agentsService.agentsStatus();
        let executionAgents = {};

        for (let mapAgent of map.agents) { // filtering only the live agents of the map.
            if (mapAgent.key && agents.hasOwnProperty(mapAgent.key) && agents[mapAgent.key].alive) {
                mapAgent.status = "available";
                mapAgent.continue = true;
                mapAgent.executionContext = vm.createContext(Object.assign({}, executionContext)); // cloning the execution context for each agent
                vm.runInNewContext(libpm + "\n" + mapStructure.code, mapAgent.executionContext);
                executionAgents[mapAgent.key] = mapAgent;
            }
        }

        if (Object.keys(executionAgents).length === 0) { // exit if no live agents for this map
            winston.log('error', "No agents selected or no live agents");
            createLog({
                map: mapId,
                runId: runId,
                message: "No agents selected or no live agents",
                status: "error"
            }, socket);
            throw new Error("No agents selected or no live agents");
        }

        executionContext.agents = executionAgents;
        executions[runId] = { map: mapId, executionContext: executionContext, executionAgents: executionAgents };
        updateExecutions(socket);
        let res = createContext(mapStructure, executionContext);
        if (res !== 0) {
            throw new Error("Error running map code" + res);
        }

        return MapResult.create({
            map: mapId,
            runId: runId,
            structure: structure._id,
            startTime: new Date()
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
        return runId;
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
    let ancestors = links.reduce((total, current) => {
        total.push(current.sourceId);
        return total;
    }, []);
    return ancestors;
}

/**
 * returns successors uuids for certain node
 * @param nodeUuid
 * @param structure
 * @returns {Array}
 */
function findSuccessors(nodeUuid, structure) {
    let links = structure.links.filter((o) => o.sourceId === nodeUuid);
    let successors = links.reduce((total, current) => {
        total.push(current.targetId);
        return total;
    }, []);
    return successors;
}

function startMapExecution(map, structure, runId, socket) {
    let agents = executions[runId].executionAgents;
    const startNode = findStartNode(structure);

    async.each(agents, runMapFromAgent(map, structure, runId, startNode.uuid, socket), function (error) {})
}

function runMapFromAgent(map, structure, runId, node, socket) {
    return (agent, callback) => {
        console.log("run map from agent");
        runNodeSuccessors(map, structure, runId, agent, node, socket);
    }
}

/**
 * finds all successors for node and run them in parallel if meeting coordination criteria.
 * @param map
 * @param structure
 * @param runId
 * @param agent
 * @param node
 * @param socket
 */
function runNodeSuccessors(map, structure, runId, agent, node, socket) {
    if (!shouldContinueExecution(runId, agent.key)) {
        console.log("Should not continue");
        return;
    }
    const successors = findSuccessors(node, structure);
    let nodesToRun = [];
    successors.forEach(successor => {
        let ancestors = findAncestors(successor, structure);
        if (ancestors.length > 1) {
            let process = findProcessByUuid(successor, structure);
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
                if (executions[runId].executionAgents[agent.key].processes.hasOwnProperty(process.uuid)) {
                    return;
                }
            }
        }
        nodesToRun.push(successor);
    });
    async.each(nodesToRun, runProcess(map, structure, runId, agent, socket), (error) => {
        console.log("all successors finished");
    });
}


function runProcess(map, structure, runId, agent, socket) {
    return (processUUID, callback) => {
        if (!shouldContinueExecution(runId, agent.key)) {
            console.log("Should not continue");
            return callback();
        }
        let process = findProcessByUuid(processUUID, structure);

        const processIndex = addProcessToContext(runId, agent.key, processUUID, process); // adding the process to execution context and storing index in the execution context.

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
                winston.log('error', (errorMsg || "Agent didn't pass filter agent condition"));
                createLog({
                    map: map._id,
                    runId: runId,
                    message: (errorMsg || `'${process.name}': agent '${agent.name}' didn't pass filter function`),
                    status: "error"
                }, socket);

                updateProcessContext(runId, agent.key, processUUID, processIndex, {
                    status: "error",
                    result: "Agent didn't pass filter condition"
                });
                if (process.mandatory) {
                    executions[runId].executionAgents[agent.key].status = "error";
                } else {
                    executions[runId].executionAgents[agent.key].status = "available";
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
            try {
                res = vm.runInNewContext(process.condition, executions[runId].executionAgents[agent.key].executionContext);
            } catch (e) {
                createLog({
                    map: map._id,
                    runId: runId,
                    message: `'${process.name}': Error running process condition: ${JSON.stringify(e)}`,
                    status: "error"
                }, socket);
            }

            if (!res) { // process didn't pass condition
                winston.log('info', "Process didn't pass condition");
                if (process.mandatory) {
                    return callback('Mandatory process failed');
                }
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
                winston.log('error', "Error running pre process function");
                createLog({
                    map: map._id,
                    runId: runId,
                    message: `'${process.name}': error running pre-process function`,
                    status: "error"
                }, socket);
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
            status: "executing"
        });

        // executing actions
        async.series(actionExecutionFunctions, (error, actionsResults) => {
            if (!shouldContinueExecution(runId, agent.key)) {
                console.log("Should not continue");
                return callback();
            }
            console.log("All action finished");
            let status;

            if (error) {
                winston.log('error', "Fatal error: ", error);
                createLog({
                    map: map._id,
                    runId: runId,
                    message: `'${process.name}': A mandatory action failed`,
                    status: "error"
                });
                status = 'error';
                executions[runId].executionAgents["continue"] = (error && process.mandatory);
                updateExecutionContext(runId, agent.key);

            } else {
                let actionStatuses = [];
                if (executions[runId].executionAgents[agent.key].processes[processUUID].actions) {
                    actionStatuses = Object.keys(executions[runId].executionAgents[agent.key].processes[processUUID].actions)
                        .map((actionKey) => {
                            return executions[runId].executionAgents[agent.key].processes[processUUID].actions[actionKey].status;
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

            // updating context
            updateProcessContext(runId, agent.key, processUUID, {
                status: status,
                result: actionsResults,
                finishTime: new Date()
            });
            updateExecutionContext(runId, agent.key);

            if (!(error && process.mandatory)) { // if the process was mandatory agent should not call other process.
                executions[runId].executionAgents[agent.key].status = 'error';
                runNodeSuccessors(map, structure, runId, agent, processUUID, socket);
            }
            callback();
        });
    }
}

function executeAction(map, structure, runId, agent, process, processIndex, action, plugin, socket) {
    return (callback) => {
        console.log("execute action");
        let startTime = new Date();
        let key = action._id;

        plugin = JSON.parse(JSON.stringify(plugin));
        action = JSON.parse(JSON.stringify(action));

        let method = plugin.methods.find(o => o.name === action.method);
        action.method = method;
        let params = action.params ? [...action.params] : [];
        action.params = {};
        for (let i = 0; i < params.length; i++) {
            let param = _.find(method.params, (o) => {
                return o.name === params[i].name
            });

            action.params[param.name] = evaluateParam(params[i], executions[runId].executionAgents[agent.key].executionContext);
        }

        action.plugin = {
            name: plugin.name
        };

        updateActionContext(runId, agent.key, process.uuid, processIndex, key, action);

        createLog({
            map: map._id,
            runId: runId,
            message: `'${action.name}': executing action (${agent.name})`,
            status: 'info'
        }, socket);

        if (!shouldContinueExecution(runId, agent.key)) {
            console.log("Should not continue");
            return callback();
        }

        request.post(
            agentsService.agentsStatus()[agent.key].defaultUrl + '/api/task/add',
            {
                form: {
                    mapId: map.id,
                    versionId: 0,
                    executionId: 0,
                    action: action,
                    key: agent.key
                }
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

                let actionString = `+ ${plugin.name} - ${method.name}: `;
                for (let i in action.params) {
                    actionString += `${i}: ${action.params[i]}`;
                }

                createLog({
                    map: map._id,
                    runId: runId,
                    message: actionString,
                    status: 'info'
                }, socket);

                if (!error && response.statusCode === 200) {
                    body.stdout = actionString + '\n' + body.stdout;

                    callback(null, body);

                    let actionExecutionLogs = [];
                    if (body.stdout) {
                        actionExecutionLogs.push(
                            {
                                map: map._id,
                                runId: runId,
                                message: `'${action.name}' output: ${JSON.stringify(body.stdout)} (${agent.name})`,
                                status: 'success'
                            }
                        );
                    }
                    if (body.stderr) {
                        actionExecutionLogs.push(
                            {
                                map: map._id,
                                runId: runId,
                                message: `'${action.name}' errors: ${JSON.stringify(body.stderr)} (${agent.name})`,
                                status: 'success'
                            }
                        );
                    }
                    actionExecutionLogs.push(
                        {
                            map: map._id,
                            runId: runId,
                            message: `'${action.name}' result: ${JSON.stringify(body.result)} (${agent.name})`,
                            status: 'success'
                        }
                    );

                    MapExecutionLog.create(actionExecutionLogs).then(logs => {
                        logs.forEach(log => {
                            socket.emit('update', log);
                        });
                    });
                }
                else {
                    let res = body;
                    if (!res) {
                        res = { stdout: actionString, result: error };
                    } else {
                        res.stdout = actionString + '\n' + body.stdout;
                    }

                    createLog({
                        map: map._id,
                        runId: runId,
                        message: `'${action.name}': Error running action on (${agent.name}): ${JSON.stringify(res)  }`,
                        status: 'success'
                    }, socket);


                    if (action.mandatory) {
                        callback("Action '" + action.name + "' failed: " + res);
                        return;
                    }
                    else {
                        callback(null, "Action '" + action.name + "' failed: " + res); // Action failed but it doesn't mater
                        return;
                    }
                }
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

module.exports = {
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
        return MapResult.find({ map: mapId }, null, { sort: { startTime: -1 } }).select("-agentsResults")
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
    list: () => {
        return MapResult.find({}, null, { sort: { startTime: -1 } }).populate({ path: 'map', select: 'name' });
    },

    /**
     * get a map id and optional runId and removes the runId or all the execution of the map.
     * @param mapId {string}
     * @param runId {string}, optional
     * @returns {string[]} array of stopped runs.
     */
    stop: (socket, mapId, runId) => {

        /* putting stop sign on executions */
        let stoppedRuns = [];
        if (runId) {
            if (executions.hasOwnProperty(runId)) {
                executions[runId].stop = true;
                stoppedRuns.push(runId);
            }

        } else {
            Object.keys(executions).map(key => {
                if (executions[key].map === mapId) {
                    executions[key].stop = true;
                    stoppedRuns.push(key);
                }
            });
        }

        /* clean data */
        const d = new Date();
        stoppedRuns.forEach(runId => {
            MapExecutionLog.create({
                map: mapId,
                runId: runId,
                message: "Got stop signal. Stopping execution",
                status: "info"
            }).then((log) => {
                socket.emit('update', log);
            });
            executions[runId].executionContext.finishTime = d;
            Object.keys(executions[runId].executionContext.agents).map(agentKey => {
                if (executions[runId].executionContext.agents[agentKey].status !== 'error') {
                    executions[runId].executionContext.agents[agentKey].status = 'stopped';
                    executions[runId].executionContext.agents[agentKey].finishTime = d;
                    Object.keys(executions[runId].executionContext.agents[agentKey].processes).map(processId => {
                        if (
                            !executions[runId].executionContext.agents[agentKey].processes[processId].status ||
                            executions[runId].executionContext.agents[agentKey].processes[processId].status === 'executing'
                        ) {
                            executions[runId].executionContext.agents[agentKey].processes[processId].status = 'stopped';
                            executions[runId].executionContext.agents[agentKey].processes[processId].finishTime = d;
                        }
                        Object.keys(executions[runId].executionContext.agents[agentKey].processes[processId].actions).map(actionId => {
                            if (
                                !executions[runId].executionContext.agents[agentKey].processes[processId].actions[actionId].status ||
                                executions[runId].executionContext.agents[agentKey].processes[processId].actions[actionId].status === 'executing'
                            ) {
                                executions[runId].executionContext.agents[agentKey].processes[processId].actions[actionId].status = 'stopped';
                                executions[runId].executionContext.agents[agentKey].processes[processId].actions[actionId].finishTime = d;
                                executions[runId].executionContext.agents[agentKey].processes[processId].actions[actionId].result = {
                                    status: 'stopped',
                                    result: 'The action was stopped'
                                };
                                sendKillRequest(executions[runId].executionContext.map.id, actionId, agentKey);
                            }
                        });
                    })
                }
            });
            // summarizeExecution(Object.assign({}, executions[runId].executionContext)).then(mapResult => {
            //     socket.emit('map-execution-result', mapResult);
            // });
            delete executions[runId];
            let emitv = Object.keys(executions).reduce((total, current) => {
                total[current] = executions[current].map;
                return total;
            }, {});
            socket.emit('executions', emitv);
        });
        return stoppedRuns;
    },

    executions: executions
}
;