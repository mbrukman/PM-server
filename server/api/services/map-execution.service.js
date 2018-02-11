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


let notify = function (socket) {
    return function (title, message, status) {
        socket.emit('notification', { title: title, message: message, status: (status || 'info') });
    };
};

function executeMap(mapId, versionIndex, cleanWorkspace, req) {
    const socket = req.io;

    function guidGenerator() {
        let S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + "-" + S4());
    }

    // TODO: add execution by sourceID
    let runId = guidGenerator();
    MapExecutionLog.create({
        map: mapId,
        runId: runId,
        message: "Starting map execution",
        status: "info"
    }).then((log) => {
        socket.emit('update', log);
    });

    let map;
    let mapStructure;
    let mapAgents;
    let executionContext;

    // adding to execution object

    return mapsService.get(mapId).then(mapobj => {
        map = mapobj;
        mapAgents = map.agents;
        if (map.archived) {
            throw new Error("Can't execute archived map");
        }
        return mapsService.getMapStructure(mapId)
    }).then(structure => {
        mapStructure = structure;
        if (!structure)
            throw new Error("No structure found");
        executionContext = {
            map: {
                name: map.name,
                agents: map.agents,
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
        let mapGraph = buildMapGraph(mapStructure); // builds a graph from the map
        let startNodes = mapGraph.sources(); // return all the nodes that dont have an in-link
        let sortedNodes = graphlib.alg.topsort(mapGraph);
        let agents = agentsService.agentsStatus();
        let liveAgents = _.filter(agents, (o) => {
            return o.alive === true
        }); // filter the live agents from all the agents in server;
        let executionAgents = {};

        for (let mapAgent of map.agents) { // filtering only the live agents of the map.
            if (mapAgent.key && agents[mapAgent.key] && agents[mapAgent.key].alive) {
                mapAgent.status = "available";
                mapAgent.executionContext = vm.createContext(_.cloneDeep(executionContext)); // cloning the execution context for each agent
                vm.runInNewContext(libpm + "\n" + mapStructure.code, mapAgent.executionContext);
                executionAgents[mapAgent.key] = mapAgent;
            }
        }
        if (Object.keys(executionAgents).length === 0) {
            winston.log('error', "No agents selected or no live agents");
            MapExecutionLog.create({
                map: mapId,
                runId: runId,
                message: "No agents selected or no live agents",
                status: "error"
            }).then((log) => {
                socket.emit('notification', {
                    title: "Oh no",
                    message: "No agents selected or no live agents",
                    type: "info"
                });
                socket.emit('update', log);
            });
            return;
        }
        executionContext.agents = executionAgents;
        executions[runId] = { map: mapId, executionContext: executionContext, executionAgents: executionAgents };
        let emitv = Object.keys(executions).reduce((total, current) => {
            total[current] = executions[current].map;
            return total;
        }, {});
        socket.emit('executions', emitv);
        let res = createContext(mapStructure, executionContext);
        if (res !== 0) {
            throw new Error("Error running map code", res);
        }
        const startNode = findStartNode(mapStructure);

        let mapResult;
        MapResult.create({
            map: mapId,
            runId: runId,
            structure: structure._id,
            startTime: new Date()
        }).then(result => {
            socket.emit('map-execution-result', result);
            mapResult = result;
            executions[runId].resultObj = result._id;
            const names = structure.used_plugins.map(plugin => plugin.name);
            return pluginsService.filterPlugins({ name: { $in: names } })
        }).then(plugins => {
            executionContext.plugins = plugins;
            Object.keys(agents).forEach(key => {
                // check if agents has the right version of the plugins.
                const filesPaths = plugins.reduce((total, current) => {
                    if (current.version !== agents[key].installed_plugins[current.name]) {
                        total.push(current.file);
                    }
                    return total;
                }, []);

                if (filesPaths && filesPaths.length > 0) {
                    async.each(filesPaths,
                        function (filePath, callback) {
                            agentsService.installPluginOnAgent(filePath, agents[key]).then(() => {
                            }).catch((e) => {
                                winston.log('error', "Error installing on agent", e);
                            });
                            callback();
                        },
                        function (error) {
                            if (error) {
                                winston.log('error', "Error installing plugins on agent, it may be a fatal error", error);
                            }
                            winston.log('success', "Done installing plugins");
                        });
                }
            });

            executeProcess(map, mapGraph, startNode, runId, socket, mapResult);
        });

        return runId
    }).catch(error => {
        winston.log('error', "Error: ", error);
        MapExecutionLog.create({
            map: mapId,
            runId: runId,
            message: error,
            status: "error"
        }).then((log) => {
            socket.emit('update', log);
        });
    })
}

function filterAgents(executionAgents) {
    let agents = _.filter(executionAgents, (o) => {
        return o.status === 'available';
    });
    return agents;
}

function updateProcessContext(runId, agentKey, processKey, processData) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }
    executions[runId].executionAgents[agentKey].processes[processKey] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey] || {}),
        processData
    );
}

function updateActionContext(runId, agentKey, processKey, actionKey, actionData) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }
    executions[runId].executionAgents[agentKey].processes[processKey].actions[actionKey] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey].actions[actionKey] || {}),
        actionData
    );
}

function updateExecutionContext(runId, agentKey) {
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
        return;
    }
    executions[runId].executionAgents[agentKey].executionContext['processes'] = executions[runId].executionAgents[agentKey].processes;
    Object.keys(executions[runId].executionAgents).forEach(agentK => {
        executions[runId].executionAgents[agentK].executionContext["globalContext"] = executions[runId].executionAgents;
    });
}

function executeProcess(map, mapGraph, node, runId, socket, mapResult) {
    if (!node) {
        winston.log('error', "No node provided");
        return;
    }
    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {

        return;
    }
    // executionContext.agents = executionAgents; // adding the context the latest agents result (so user could access them with the code);
    executions[runId].executionContext.agents = executions[runId].executionAgents;
    let successors = mapGraph.successors(node);

    if (node.type && node.type === 'start_node') {
        successors = mapGraph.successors(node.uuid);
        successors.forEach(successor => {
            executeProcess(map, mapGraph, successor, runId, socket, mapResult);
        });
        return;
    }

    let process = mapGraph.node(node);
    let plugin = executions[runId].executionContext.plugins
        .find((o) => (o.name.toString() === process.used_plugin.name) || (o.name === process.used_plugin.name));
    let agents = filterAgents(executions[runId].executionAgents); // get all available agents (not running or stopped);
    if (plugin.version !== process.used_plugin.version) {
        MapExecutionLog.create({
            map: map._id,
            runId: runId,
            message: `'${process.name}': Deprecated warning: Process used plugin version ${process.used_plugin.version} while ${plugin.version} is installed.`,
            status: 'info'
        }).then((log) => {
            socket.emit('update', log);
        });
    }
    async.each(executions[runId].executionAgents,
        (agent, agentCb) => {
            if (!executions[runId].executionAgents[agent.key].startTime)
                executions[runId].executionAgents[agent.key].startTime = new Date();

            if (executions[runId].executionAgents[agent.key].processes) {
                if (!executions[runId].executionAgents[agent.key].processes[node]) {
                    updateProcessContext(runId, agent.key, node, { name: process.name });
                }
                // check if this process is executing or was executed.
                if (executions[runId].executionAgents[agent.key].processes[node].status === "executing" || executions[runId].executionAgents[agent.key].processes[node].status === "error" || executions[runId].executionAgents[agent.key].processes[node].status === "success") {
                    agentCb();
                    return;
                } else {
                    winston.log('error', "not one of statuses: ", executions[runId].executionAgents[agent.key].processes[node].status);
                }
            } else {
                executions[runId].executionAgents[agent.key].processes = {};
            }
            updateProcessContext(runId, agent.key, node, {
                name: process.name,
                status: "executing",
                result: '',
                startTime: new Date(),
                plugin: { name: plugin.name, _id: plugin._id, version: plugin.version },
                _id: process.id
            });

            MapExecutionLog.create({
                map: map._id,
                runId: runId,
                message: `'${process.name}': executing process (${agent.name})`,
                status: "info"
            }).then((log) => {
                socket.emit('update', log);
            });

            executions[runId].executionAgents[agent.key].agent = agent._id;
            let agentStr = 'var currentAgent = ' + JSON.stringify(agent);

            updateExecutionContext(runId, agent.key);
            vm.runInNewContext(agentStr, executions[runId].executionAgents[agent.key].executionContext);
            executions[runId].executionAgents[agent.key].status = "executing";
            if (process.condition) {
                let res;
                try {
                    res = vm.runInNewContext(process.condition, executions[runId].executionAgents[agent.key].executionContext);
                } catch (e) {
                    winston.log('error', "Error running process condition", e);
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${process.name}': Error running process condition: ${JSON.stringify(e)}`,
                        status: "error"
                    }).then((log) => {
                        socket.emit('update', log);
                    });
                    agentCb();
                    executions[runId].executionAgents[agent.key].finishTime = new Date();
                    updateProcessContext(runId, agent.key, node, {
                        status: "error",
                        result: "Error running process condition" + e
                    });
                    if (process.mandatory) {
                        executions[runId].executionAgents[agent.key].status = "error";
                    } else {
                        executions[runId].executionAgents[agent.key].status = "available";
                    }
                    updateExecutionContext(runId, agent.key);
                    return;
                }

                if (!res) {
                    // if res is not true
                    winston.log('info', "Process didn't pass condition");
                    updateProcessContext(runId, agent.key, node, {
                        status: "error",
                        result: "Didn't passed condition"
                    });
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${process.name}': Process didn't pass condition`,
                        status: "error"
                    }).then((log) => {
                        socket.emit('update', log);
                    });
                    executions[runId].executionAgents[agent.key].finishTime = new Date();
                    agentCb();
                    if (process.mandatory) {
                        executions[runId].executionAgents[agent.key].status = "error";
                    } else {
                        executions[runId].executionAgents[agent.key].status = "available";
                    }
                    updateExecutionContext(runId, agent.key);
                    return;
                }


            }

            if (process.filterAgents) {
                let res;
                try {
                    res = vm.runInNewContext(process.filterAgents, executions[runId].executionAgents[agent.key].executionContext);

                } catch (e) {
                    winston.log('error', "Error trying to run filter agent function", e);
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${process.name}': Error running agent filter function: ${JSON.stringify(e)}`,
                        status: "error"
                    }).then((log) => {
                        socket.emit('update', log);
                    });

                    updateProcessContext(runId, agent.key, node, {
                        status: "error",
                        result: "Error running filter agent function" + e
                    });
                    if (process.mandatory) {
                        executions[runId].executionAgents[agent.key].status = "error";
                    } else {
                        executions[runId].executionAgents[agent.key].status = "available";
                    }
                    executions[runId].executionAgents[agent.key].finishTime = new Date();
                    agentCb();
                    updateExecutionContext(runId, agent.key);
                    return;
                }

                if (!res) {
                    winston.log('info', "Agent didn't pass filter agent condition");
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${process.name}': agent '${agent.name}' didn't pass filter function`,
                        status: "error"
                    }).then((log) => {
                        socket.emit('update', log);
                    });

                    updateProcessContext(runId, agent.key, node, {
                        status: "error",
                        result: "Agent didn't pass filter condition"
                    });
                    if (process.mandatory) {
                        executions[runId].executionAgents[agent.key].status = "error";
                    } else {
                        executions[runId].executionAgents[agent.key].status = "available";
                    }
                    executions[runId].executionAgents[agent.key].finishTime = new Date();
                    agentCb();
                    updateExecutionContext(runId, agent.key);
                    return;
                }

            }

            if (process.preRun) {
                // pre run hook for link (enables user to change context)
                let res;
                try {
                    res = vm.runInNewContext(process.preRun, executions[runId].executionAgents[agent.key].executionContext);
                    updateProcessContext(runId, agent.key, node, { preRun: res });
                    updateExecutionContext(runId, agent.key);
                } catch (e) {
                    winston.log('error', "Error running pre process function");
                    MapExecutionLog.create({
                        map: map._id,
                        runId: executionContext.runId,
                        message: `'${process.name}': error running pre-process function`,
                        status: "error"
                    }).then((log) => {
                        socket.emit('update', log);
                    });
                }
            }

            let actionExecutionFunctions = {};
            process.actions.forEach(action => {
                actionExecutionFunctions[action.name + "(" + action.id + ")"] = executeAction(map, runId, process, _.cloneDeep(action), plugin, agent, socket);
                // actionExecutionFunctions.push(executeAction(map, link, selectedProcess, _.cloneDeep(action), agent, executionAgents[agent.key].executionContext, executionAgents)); //other option is to pass it as an array, but result would be massy.
            });
            async.series(actionExecutionFunctions,
                (error, actionsResults) => {
                    if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
                        agentCb('Map stopped');
                        return;
                    }

                    executions[runId].executionAgents[agent.key].finishTime = new Date();
                    updateProcessContext(runId, agent.key, node, { result: actionsResults, finishTime: new Date() });
                    updateExecutionContext(runId, agent.key);

                    if (error) { // a mandatory action failed
                        winston.log('error', "Fatal error: ", error);
                        MapExecutionLog.create({
                            map: map._id,
                            runId: runId,
                            message: `'${process.name}': A mandatory action failed`,
                            status: "error"
                        }).then((log) => {
                            socket.emit('update', log);
                        });
                        updateProcessContext(runId, agent.key, node, { status: "error", finishTime: new Date() });

                        // executionAgents[agent.key].processes[node].status = "error";
                        executions[runId].executionAgents[agent.key].status = "error"; // stopping agent
                        if (process.mandatory) { // if the process is mandatory, should stop agent..
                            executions[runId].executionAgents[agent.key].status = "error";
                        } else {
                            executions[runId].executionAgents[agent.key].status = "available";
                        }
                        updateExecutionContext(runId, agent.key);

                    } else {
                        let actionStatuses = [];
                        if (executions[runId].executionAgents[agent.key].processes[node].actions) {
                            actionStatuses = Object.keys(executions[runId].executionAgents[agent.key].processes[node].actions)
                                .map((actionKey) => {
                                    return executions[runId].executionAgents[agent.key].processes[node].actions[actionKey].status;
                                });
                        }
                        let status;
                        if (actionStatuses.indexOf('error') > -1 && actionStatuses.indexOf('success') === -1) { // if only errors - process status is error
                            status = 'error';
                        } else if (actionStatuses.indexOf('error') > -1 && actionStatuses.indexOf('success') > -1) { // if error and success - process status is partial
                            status = 'partial';
                        } else { // if only success - process status is success
                            status = 'success';
                        }
                        updateProcessContext(runId, agent.key, node, { status: status });
                        executions[runId].executionAgents[agent.key].status = "available";
                        updateExecutionContext(runId, agent.key);
                    }
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${process.name}' results: ${JSON.stringify(actionsResults)}`,
                        status: executions[runId].executionAgents[agent.key].processes[node].status
                    }).then((log) => {
                        socket.emit('update', log);
                    });
                    if (!process.correlateAgents) {
                        successors.forEach(successor => {
                            executeProcess(map, mapGraph, successor, runId, socket, mapResult);
                        })
                    }

                    if (process.postRun) {
                        // post run hook for link (enables user to change context)
                        let res;
                        try {
                            res = vm.runInNewContext(process.postRun, executions[runId].executionAgents[agent.key].executionContext);
                            updateProcessContext(runId, agent.key, node, { postRun: res });
                            updateExecutionContext(runId, agent.key);

                        } catch (e) {
                            winston.log('error', "Error running post process function");
                            MapExecutionLog.create({
                                map: map._id,
                                runId: runId,
                                message: `'${process.name}': Error running post process function`,
                                status: "error"
                            }).then((log) => {
                                socket.emit('update', log);
                            });
                        }
                    }

                    agentCb();
                    return;
                });


        }, (error) => { //agentCb
            if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
                return;
            }

            if (error) {
                winston.log('error', "There was an error while running agents: ", error);
            }

            if (process.correlateAgents) {
                // if need to correlate agents, the next node will be called only after all agents are done;
                // due to the way we get live agents, we must check in the execution agents if this link finish in all agents that are still available.
                let agentsStats = _.filter(executions[runId].executionAgents, (o) => {
                    return o.status === 'executing';
                });

                if (agentsStats.length === 0) { // if there is an agent that is still executing, we shouldn't pass to the next node
                    successors.forEach(successor => {
                        executeProcess(map, mapGraph, successor, runId, socket, mapResult);
                    });
                }
            }

            let doneAgents = _.filter(executions[runId].executionAgents, (o) => {
                return o.status !== "executing" // return all the agents which are not executing
            });

            if (executions.hasOwnProperty(runId) && !executions[runId].stop && doneAgents.length === Object.keys(executions[runId].executionAgents).length) {
                let flag = true;
                let availableAgents = filterAgents(executions[runId].executionAgents);

                for (let i in availableAgents) {
                    // check if availble passed all processes.
                    let prStatus = Object.keys(availableAgents[i].processes).map((key) => {
                        return availableAgents[i].processes[key].status;
                    });
                    if ((Object.keys(availableAgents[i].processes).length !== (mapGraph.nodes().length - 1)) || prStatus.indexOf('executing') > -1) {
                        flag = false;
                        break;
                    }
                }
                if (flag && executions[runId].executionContext.status !== "done") {
                    // delete executions[runId]; // removing the run from executions

                    winston.log('info', ": map done :");
                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `Finish running map`,
                        status: 'success'
                    }).then((log) => {
                        socket.emit('update', log);
                    });
                    executions[runId].executionContext.status = "done";
                    executions[runId].executionContext.agents = executions[runId].executionAgents;
                    executions[runId].executionContext.finishTime = new Date();
                    summarizeExecution(_.cloneDeep(executions[runId].executionContext), mapResult).then(mapResult => {
                        socket.emit('map-execution-result', mapResult);

                    });
                    delete executions[runId];
                    let emitv = Object.keys(executions).reduce((total, current) => {
                        if (current === runId) {
                            return total;
                        }
                        total[current] = executions[current].map;
                        return total;
                    }, {});
                    socket.emit('executions', emitv);
                }
            }
        }
    )
}

function evaluateParam(param, context) {

    if (!param.code) {
        return param.value;
    }
    return vm.runInNewContext(param.value, context);

}

function executeAction(map, runId, process, action, plugin, agent, socket) {
    return (callback) => {
        sTime = new Date();
        let action_str = 'var currentAction = ' + JSON.stringify(action) + ";";
        vm.runInNewContext(action_str, executions[runId].executionAgents[agent.key].executionContext);
        let key = action._id;

        if (!executions[runId].executionAgents[agent.key].processes[process.uuid].actions) {
            updateProcessContext(runId, agent.key, process.uuid, { actions: {} });
        }
        plugin = JSON.parse(JSON.stringify(plugin));
        action = JSON.parse(JSON.stringify(action));

        let method = _.find(plugin.methods, (o) => {
            return o.name === action.method
        });
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
        updateActionContext(runId, agent.key, process.uuid, key, action);
        // executionAgents[agent.key].processes[process.uuid].actions[key] = action;
        MapExecutionLog.create({
            map: map._id,
            runId: runId,
            message: `'${action.name}': executing action (${agent.name})`,
            status: 'info'
        }).then((log) => {
            socket.emit('update', log);
        });

        let actionString = `+ ${plugin.name} - ${method.name}: `;
        for (let i in action.params) {
            actionString += `${i}: ${action.params[i]}`;
        }

        MapExecutionLog.create({
            map: map._id,
            runId: runId,
            message: actionString,
            status: 'info'
        }).then(log => {
            socket.emit('update', log);
        });

        if (!executions.hasOwnProperty(runId) || executions[runId].stop) {
            callback('Map stopped');
            return;
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
                // executionAgents[agent.key].processes[process.uuid].actions[key].finishTime = new Date();
                updateActionContext(runId, agent.key, process.uuid, key, { finishTime: new Date() });

                if (!error && response.statusCode === 200) {
                    body.stdout = actionString + '\n' + body.stdout;

                    updateActionContext(runId, agent.key, process.uuid, key, {
                        status: "success",
                        result: body,
                        startTime: sTime
                    });

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

                    callback(null, body);
                    return ;

                }
                else {
                    let res = body;
                    if (!res) {
                        res = { stdout: actionString, result: error };
                    } else {
                        res.stdout = actionString + '\n' + body.stdout;
                    }

                    MapExecutionLog.create({
                        map: map._id,
                        runId: runId,
                        message: `'${action.name}': Error running action on (${agent.name}): ${JSON.stringify(res)  }`,
                        status: 'success'
                    }).then((log) => {
                        socket.emit('update', log);
                    });

                    updateActionContext(runId, agent.key, process.uuid, key, {
                        status: "error",
                        result: res,
                        startTime: sTime
                    });

                    if (action.mandatory) {
                        callback("Action '" + action.name + "' failed: " + res);
                        return;
                    }
                    else {
                        callback(null, "Action '" + action.name + "' failed: " + res); // Action failed but it doesn't mater
                        return;
                    }
                }
            }
        );
    }
}

function summarizeExecution(executionContext, resultObj) {
    delete executionContext.currentAction;

    let result = {};
    result.map = executionContext.map.id;
    result.structure = executionContext.structure;
    result.startTime = executionContext.startTime;
    result.finishTime = executionContext.finishTime;
    result.runId = executionContext.runId;
    result.agentsResults = [];

    for (let i in executionContext.agents) {
        let agent = executionContext.agents[i];
        let agentsResult = {
            processes: [],
            agent: agent._id,
            status: agent.status === "available" ? 'success' : agent.status,
            startTime: agent.startTime,
            finishTime: agent.finishTime
        };
        let processResult;
        for (let j in agent.processes) {
            let process = agent.processes[j];

            processResult = {
                name: process.name,
                result: process.result,
                uuid: j,
                process: process._id,
                plugin: { name: String, _id: process.plugin._id },
                actions: [],
                status: process.status,
                startTime: process.startTime,
                finishTime: process.finishTime,
            };
            for (let k in process.actions) {
                let actionResult = {};
                let action = process.actions[k];
                actionResult.action = k;
                actionResult.name = action.name;
                actionResult.startTime = action.startTime;
                actionResult.finishTime = action.finishTime;
                actionResult.status = action.status;
                actionResult.result = action.result;
                actionResult.method = { name: action.method.name, _id: action.method._id };
                processResult.actions.push(actionResult);
            }
            agentsResult.processes.push(processResult);
        }
        result.agentsResults.push(agentsResult);
    }
    return MapResult.findByIdAndUpdate(executions[executionContext.runId].resultObj, result, { new: true });
}

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
            summarizeExecution(Object.assign({}, executions[runId].executionContext)).then(mapResult => {
                socket.emit('map-execution-result', mapResult);
            });
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