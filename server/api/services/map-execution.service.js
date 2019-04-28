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
const dbUpdates = require('./map-execution-updates')
const shared = require('../shared/recents-maps')


const statusEnum = models.statusEnum
let clientSocket
let executions = {};
let pending = {};

let libpm = '';


fs.readFile(path.join(path.dirname(path.dirname(__dirname)), 'libs', 'sdk.js'), 'utf8', function (err, data) {
    // opens the lib_production file. this file is used for user to use overwrite custom function at map code
    if (err) {
        return winston.log('error', err);
    }
    libpm = data;
    eval(libpm)
});


async function evaluateParam(param, typeParam, context) {
    if (!param.code) {
        if (typeParam == 'vault' && param.value) {
            return await vaultService.getValueByKey(param.value);
        }
        return param.value;
    }
    return vm.runInNewContext(param.value, context);
}

async function getSettingsAction(plugin){ //sharbat check if works!
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
function updateClientExecutions(socket) {
    let emitv = Object.keys(executions).reduce((total, current) => {
        total[current] = executions[current].mapId;
        return total;
    }, {});
    socket.emit('executions', emitv);
}

/**
 * Update client what the pending executions.
 * mapId is keys and value is array of pending runIds
 * @param socket
 */
function updateClientPending(socket) {
    socket.emit('pending', pending);
}

/**
 * Adding a new process to context and returning its index in the executions array.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param process
 * @returns {number}
 */
function createProcessContext(runId, agent, processUUID, process) {
    let processes = executions[runId].executionAgents[agent.key].processes

    if(!processes.numProcesses && processes.numProcesses!= 0){
        processes.numProcesses = 0
    }else{
        processes.numProcesses++
    }
    if (!processes[processUUID]) {
        processes[processUUID] = [];
    }

    const processData = {
        processId: process.id,
        iterationIndex: processes[processUUID].length,
        status: process.status || statusEnum.RUNNING,
        uuid: processUUID,
        actions: {},
        processIndex: processes.numProcesses  // numProcesses => represents the process in the DB.  
    };
    processes[processUUID].push(processData);
    executions[runId].executionAgents[agent.key].context.processes = processes 
    // sharbat !! change in every place? for sdk. @matan? Move all to the context to keep once

    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        processData: processData
    }
    dbUpdates.addProcess(options)
    

    return processData.iterationIndex;
}

/**
 * Assigning data to process execution.
 * @param runId
 * @param agentKey
 * @param processKey
 * @param processIndex
 * @param processData
 */
function updateProcessContext(runId, agent, processUUID, iterationIndex, processData, updateDB = true) { 

    if (!executions[runId]) {
        return;
    }
    executions[runId].executionAgents[agent.key].processes[processUUID][iterationIndex] = Object.assign(
        (executions[runId].executionAgents[agent.key].processes[processUUID][iterationIndex] || {}),
        processData  
    );

    let field = Object.keys(processData)[0] // sharbat generic? yes
    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        processIndex: executions[runId].executionAgents[agent.key].processes[processUUID][iterationIndex].processIndex,
        field: field,
        value: processData[field]
    }

    updateDB ? dbUpdates.updateProcess(options) : null

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
    if (!executions[runId]) {
        return;
    }
    executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[action._id] = Object.assign(
        (executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[action._id] || {}),
        actionData
    );
    let curActionData  = executions[runId].executionAgents[agentKey].processes[processKey][processIndex].actions[action._id]

    // If action have a result (i.e. done) set to previous action;
    if (actionData.result)
        executions[runId].executionAgents[agentKey].context.previousAction = action;

    let result = ""
    if(actionData.status == statusEnum.ERROR && action.mandatory && !actionData.hasOwnProperty('retriesLeft')){ 
        result = ' - Mandatory Action Faild'
    }

    let options = {
        data: actionData,
        mapResultId: executions[runId].mapResultId,
        agentId: executions[runId].executionAgents[agentKey].id,
        processIndex: executions[runId].executionAgents[agentKey].processes[processKey][processIndex].processIndex,
        actionIndex: curActionData.actionIndex
    }
    if(actionData.startTime){
        executions[runId].executionAgents[agentKey].context.previousAction = executions[runId].executionAgents[agentKey].context.currentAction
        executions[runId].executionAgents[agentKey].context.currentAction = curActionData
        
        return dbUpdates.addAction(options)
    }

    dbUpdates.updateAction(options)
        
    // mandatory action faild. stop execution (if no have retries)
    if(actionData.status == statusEnum.ERROR && action.mandatory && !actionData.hasOwnProperty('retriesLeft')){ 
        return stopExecution(runId, null, null, result) 
    }
}



/**
 * Starting a pending execution
 * @param mapId
 */
async function startPendingExecution(mapId, socket) {

    let pendingExec = await dbUpdates.getAndUpdatePendingExecution(mapId) 
    if(!pendingExec){return}
    
    cancelPending(mapId, pendingExec.id, socket , false); //sharbat do not call cancel pending on start pending
    socket.emit('map-execution-result', pendingExec)
    if(!executions[pendingExec.runId]){
        executions[pendingExec.runId] = {
            clientSocket : socket,
            mapId: mapId,
            status: statusEnum.RUNNING,
            executionAgents: {},
            mapResultId: pendingExec.id
        }
    }else{
        executions[pendingExec.runId].status = statusEnum.RUNNING
    }


    // sharbat!! use the same create context method
    let context = { 
        executionId: pendingExec.runId, 
        startTime: pendingExec.startTime,
        // structure: structureId, 
        configuration: pendingExec.configuration,
        trigger:{
            msg: pendingExec.triggerReason,
            payload:pendingExec.triggerPayload
        },
        vault : {
            getValueByKey : vaultService.getValueByKey
        }
    }
    map = await mapsService.get(pendingExec.map)
    mapStructure = await mapsService.getMapStructure(map._id, pendingExec.structure)

    agents = helper.getRelevantAgent(map.groups, map.agents)

    // If no living agents, stop execution with status error
    if (agents.length == 0) {
        exitExecutionAndUpdateMapResult(runId, { reason: 'no agents alive', status: 'Error' } )
    }

    executeMap(pendingExec.runId, 
        map,
        mapStructure,
        agents,
        context
    );
}

function exitExecutionAndUpdateMapResult(runId, updateData){
    let options = {
        mapResultId: executions[runId].mapResultId,
        data:updateData,
        socket: executions[runId].clientSocket
    }
    dbUpdates.updateMapReasult(options)
    MapResult.findByIdAndUpdate(executions[runId].mapResultId, updateData )
    startPendingExecution(executions[runId].mapId, executions[runId].clientSocket)
    let socket  = executions[runId].clientSocket
    delete executions[runId]
    updateClientExecutions(socket);
}


function createAgentContext(agent, runId, executionContext, startNode, mapCode) {

    let processes = {}
    processes[startNode.uuid] = [{
        status: statusEnum.DONE,
        startNode: true,
    }] 

    let agentContext = {currentAgent: {
        name: agent.name,
        url: agent.url,
        attributes: agent.attributes
    }
}
   
    executions[runId].executionAgents[agent.key] = {
        processes: processes,
        context: Object.assign(agentContext, executionContext, _addFuncsToCodeEnv()),
        id: agent.id,
    }
    createCodeEnv(mapCode, runId, agent.key)

    dbUpdates.addAgentResult(executions[runId].executionAgents[agent.key],  executions[runId].mapResultId)
}

/**
 * Create code enviroment in context
 * @param {*} mapCode 
 * @param {*} runId 
 * @param {*} agentKey 
 */
function createCodeEnv(mapCode, runId, agentKey) {
    vm.runInNewContext(libpm + '\n' + mapCode, executions[runId].executionAgents[agentKey].context); 
}

/**
 * Add more functionalities in our code enviroment. e.g. using 'require'.
 */
function _addFuncsToCodeEnv() { 
    return {
        require,
        console,
        Buffer
    }
}

/**
 *  create general context and new MapResult
 * @param {*} runId 
 * @param {*} socket 
 * @param {*} map 
 * @param {*} configurationName 
 * @param {*} structureId 
 * @param {*} triggerReason 
 */
function createExecutionContext(runId, socket, map, configurationName, structure, triggerReason, payload) {
    //sharbat 2 func - one for exec start (for both pending and not) and second to create the exec context

    // get number of running executions
    const ongoingExecutions = helper.countMapExecutions(executions, map.id, statusEnum.RUNNING);

    // check if more running executions than map.queue
    const status = (map.queue && (ongoingExecutions >= map.queue)) ? statusEnum.PENDING : statusEnum.RUNNING; 
    const configuration = helper.createConfiguration(structure, configurationName);

    const startTime =  status == statusEnum.PENDING? null : new Date()
    
    let mapResult = new MapResult({
        map: map._id,
        runId: runId, // use map result id instead of runId (delete runId usage from everywhere)!!!!! sharbat
        structure: structure.id,
        startTime: startTime,
        configuration: configuration,
        trigger: triggerReason,
        triggerPayload:payload,
        status: status,
        agentsResults: []
    });
    
    console.log("mapResultId : ", mapResult.id );
    
    mapResult.save().then(result => {
        status == statusEnum.PENDING? null :  socket.emit('map-execution-result', result); // sharbat : verify same behavior as before
    }).catch(err => {
        throw new Error('error occurred while creating MapResult' + err)
    })

    if(status == statusEnum.PENDING){
        pending[map.id]? pending[map.id].push(runId) : pending[map.id] = [runId]
        updateClientPending(socket)
        return 
    }
    
    executions[runId] = {
        mapId: map._id,
        status: status,
        executionAgents: {},
        clientSocket: socket,
        mapResultId:  mapResult.id
    }
    
    return executionContext = {
        executionId: runId, 
        startTime: startTime,
        // structure: structure.id,
        configuration: configuration,
        trigger:{
            msg:triggerReason,
            payload:payload
        },
        vault : {
            getValueByKey : vaultService.getValueByKey
        }
    };
}
function savePlugins(mapStructure, runId) {// sharbat change name addFunc.. 
    const names = mapStructure.used_plugins.map(plugin => plugin.name);
    executions[runId].plugins = names
    return pluginsService.filterPlugins({ name: { $in: names } }).then(plugins => {
        executions[runId].plugins = plugins
    })
}



async function executeMap(runId, map, mapStructure, agents, context){
    updateClientExecutions(executions[runId].clientSocket);

    await savePlugins(mapStructure, runId)

    const startNode = helper.findStartNode(mapStructure);
    let promises = []
    for (let i = 0, length = agents.length; i < length; i++) {
        createAgentContext(agents[i], runId, context, startNode, mapStructure.code)
        promises.push(runMapOnAgent(map, mapStructure, runId, startNode, agents[i]))
    }
    Promise.all(promises)
}


async function execute(mapId, structureId, socket, configurationName, triggerReason, triggerPayload=null) {
    clientSocket = socket;
    map = await mapsService.get(mapId)
    if (!map) { throw new Error(`Couldn't find map`); }
    if (map.archived) {throw new Error('Can\'t execute archived map'); }
    
    let agents = helper.getRelevantAgent(map.groups, map.agents)
    if(agents.length == 0){ throw new Error('No agents alive'); }
    
    mapStructure = await mapsService.getMapStructure(map._id, structureId)
    if (!mapStructure) { throw new Error('No structure found.');}

    const runId = helper.guidGenerator();

   
    let context = createExecutionContext(runId, socket, map, configurationName, mapStructure, triggerReason, triggerPayload)
    if(context){ // context exist if the execution is not pending
        executeMap(runId, map, mapStructure, agents, context) 
    }
    return runId
}

function runMapOnAgent(map, structure, runId, startNode, agent) {
    return helper.validate_plugin_installation(executions[runId].plugins, agent.key).then(() => {
        return runNodeSuccessors(map, structure, runId, agent, startNode.uuid).catch(err=>{
            // sharbat remove all inner empty catches and verify it gets here
            console.error(err) // winston sharbat 
            // save the info like structure +mapId 
        });
    })
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
    for (let i = processes.length - 1; i >= 2; i--) {
        if (executions[runId].executionAgents[agentKey].processes[processes[i]].findIndex(p => p.status === statusEnum.RUNNING) > -1) {
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
        if (!executionAgents[i].status && agentsService.agentsStatus()[i].alive) { //sharbat check if works
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
 * @returns {boolean} return false if there is an agent that didnt get to process
 */
function areAllAgentsWaitingToStartThis(runId, processUUID, agent, processId) {
    const executionAgents = executions[runId].executionAgents;


    if(!executions[runId].executionAgents[agent.key].processes[processUUID][0]){ // if the process is already created.   
        createProcessContext(runId, agent, processUUID, {id: processId, status: statusEnum.PENDING}) // sharbat ! think on one place to createProcessContext   
    }
    
    for (let i in executionAgents) {
        if (!executionAgents[i].processes.hasOwnProperty(processUUID)) {
            return false;
        }
    }
    return true;
}

function runAgentsFlowControlPendingProcesses(runId, map, structure, process){
    const executionAgents = executions[runId].executionAgents
    let agentsStatus = agentsService.agentsStatus()
    for (let i in executionAgents) {
        for(let j in executionAgents[i].processes[process.uuid]){
            let processToRun = executionAgents[i].processes[process.uuid][j]
            //sharbat - check if all properties necessary or exists in the process
            let nodeToRun = {
                index: processToRun.iterationIndex,
                uuid: processToRun.uuid, // sharbat duplicate?? in process the uuid!!
                process: process
            }
            updateProcessContext(runId, agentsStatus[i], process.uuid, processToRun.iterationIndex, {status: statusEnum.RUNNING}, false)
            runProcess(map, structure, runId, agentsStatus[i], nodeToRun);
        }
    }
}


function checkAgentFlowCondition(runId, process, map, structure, agent) {
    if (process.flowControl === 'race') {
        if (!helper.isThisTheFirstAgentToGetToTheProcess(executions[runId].executionAgents, process.uuid, agent.key)) {
            // if there is an agent that already got to this process, the current agent should continue to the next process in the flow.
            runNodeSuccessors(map, structure, runId, agent, process.uuid);
            return false
        }
        return true
    }
    if (process.flowControl === 'wait') { // if not all agents are still alive, the wait condition will never be met, should stop the map execution
        //TODO: check how to handle race condition between agents status and check
        if (!helper.areAllAgentsAlive(executions[runId].executionAgents)) {
            stopExecution(runId); 
            return false;
        }


        const agentProcesses = executions[runId].executionAgents[agent.key].processes
        if(agentProcesses[process.uuid] && agentProcesses[process.uuid][0].status != statusEnum.PENDING){
            return true // means all agents was here and run. (in case 2 ancestors)
        }
        
        // if there is a wait condition, checking if it is the last agent that got here and than run all the agents
        if (areAllAgentsWaitingToStartThis(runId, process.uuid, agent, process.id)) {
            //sharbat should return true (check only) and handle this in the run method
            runAgentsFlowControlPendingProcesses(runId, map, structure, process)
        }
        return false
    }
    return true;
}

function checkProcessCoordination(process,runId , agent, successorIdx, structure, numSuccessors) { 
   let processes = executions[runId].executionAgents[agent.key].processes
    if (process.coordination === 'wait') {
        let res = true
        let ancestors = helper.findAncestors(process.uuid, structure);
        if (ancestors.length > 1) {
            ancestors.forEach(ancestor => {
                // sharbat check if process iteration or action, if action , add status to process and use the process
                if (!processes[ancestor] || processes[ancestor][0].status == statusEnum.RUNNING) {
                    // sharbat not needed if all checks happen
                    if(process.flowControl == 'wait' && !executions[runId].executionAgents[agent.key].processes[process.uuid]){ // create pending process if we the first.    
                        createProcessContext(runId, agent, process.uuid, {id: process.id, status: statusEnum.PENDING})
                    }
                    return res = false;
                }
            });

        }
        return res
    }

    if (process.coordination === 'race') {
        if (processes && processes.hasOwnProperty(process.uuid)) {
            // sharbat move this check to the run function instead of the check
            if (numSuccessors - 1 == successorIdx) {
                endRunPathResults(runId, agent, socket, map);
            }
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
 */
function runNodeSuccessors(map, structure, runId, agent, node) {
    if (!executions[runId] || executions[runId].status == statusEnum.ERROR || executions[runId].status == statusEnum.DONE) { return Promise.resolve() } // status : 'Error' , 'Done'

    const successors = node ? helper.findSuccessors(node, structure) : [];
    if (successors.length === 0) {
        return endRunPathResults(runId, agent, map);
    }

    let nodesToRun = [];
    successors.forEach((successor, successorIdx) => {
        const process = findProcessByUuid(successor, structure);

        // sharbat move checks to variables to allow both checks to run.
        if (checkProcessCoordination(process, runId, agent , successorIdx,structure, successors.length) &&
            checkAgentFlowCondition(runId, process, map, structure, agent)) {
                
                nodesToRun.push({
                index: createProcessContext(runId, agent, successor, process),
                uuid: successor,
                process: process
            });

        }
    })

    promises = []
    for (let i = 0, length = nodesToRun.length; i < length; i++) {
        promises.push(runProcess(map, structure, runId, agent, nodesToRun[i]))
    }
    return Promise.all(promises).catch(error => {
        console.error(error);
        winston.log('error', error)
    });
}

function updateAgentContext(runId, agent,agentData){
    executions[runId].executionAgents[agent.key] = Object.assign(executions[runId].executionAgents[agent.key], agentData )

    let options = {
        mapResultId: executions[runId].mapResultId,
        agentId: agent.id,
        data: agentData
    }
    dbUpdates.updateAgent(options)
}

function endRunPathResults(runId, agent, map) {
    if (isThereProcessExecutingOnAgent(runId, agent.key)) { return }
  
    updateAgentContext(runId, agent,{status: statusEnum.DONE})

    if (!areAllAgentsDone(runId)) { return }

    let data = {
        finishTime : new Date(),
        status: statusEnum.DONE
    }

    let options = {
        mapResultId: executions[runId].mapResultId,
        data:data,
        socket: executions[runId].clientSocket
    }
    dbUpdates.updateMapReasult(options)

    let socket = executions[runId].clientSocket
    delete executions[runId];

    if (map.queue) {
        startPendingExecution(map.id, socket);
    }

    updateClientExecutions(socket);
}

// testing process condition
function passProcessCondition(runId, agent, execProcess, mapCode) {
    let process = execProcess.process
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

    winston.log('info', errMsg || "Process didn't pass condition");
    updateProcessContext(runId, agent, execProcess.uuid, execProcess.index, { 
        status: errMsg || "Process didn't pass condition",
    });
    if (process.mandatory) { // mandatory process failed, stop executions
        winston.log('info', "Mandatory process failed");
        executions[runId].executionAgents[agent.key].status = statusEnum.ERROR;
        return false;
    }
    return true;
}

// running process preRun function and storing it in the context
function runProcessPreRunFunc(runId, agent, execProcess, mapCode) {
    if (!execProcess.process.preRun) { return }
    let res;
    try { 
        res = vm.runInNewContext(execProcess.process.preRun, executions[runId].executionAgents[agent.key].context);
    } catch (e) {
        winston.log('error', 'Error running pre process function');
        res = 'Error running preProcess function' + res
    }
    updateProcessContext(runId, agent, execProcess.uuid,execProcess.index, { preRunResult: res });

}

// running process postRun function and storing it in the context
function runProcessPostRunFunc(runId, agent, execProcess, mapCode) {
    if (!execProcess.process.postRun) {return null}
    let res;
    try {
        res = vm.runInNewContext(execProcess.process.postRun, executions[runId].executionAgents[agent.key].context);
    } catch (e) {
        winston.log('error', 'Error running post process function');
        res = 'Error running postProcess function' + res
    }
    updateProcessContext(runId, agent, execProcess.uuid, execProcess.index, { postRunResult: res});
    
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
function runProcess(map, structure, runId, agent, execProcess) {
    return new Promise((resolve, reject) => {
        if (!helper.isAgentShuldContinue(agent.key, executions[runId].executionAgents)) {
            return resolve()
        }

        if (!passProcessCondition(runId, agent, execProcess, structure.code)) {
            return stopExecution(runId);
        }

        runProcessPreRunFunc(runId, agent, execProcess, structure.code)

        let process = execProcess.process;
        const processIndex = execProcess.index; // adding the process to execution context and storing index in the execution context.

        let plugin = executions[runId].plugins.find(o => o.name.toString() == process.used_plugin.name || o.name == process.used_plugin.name)
        let actionsArray = [];

        process.actions.forEach((action, i) => {
            actionsArray.push([
                map,
                structure,
                runId,
                agent,
                process,
                processIndex,
                _.cloneDeep(action).toJSON(),
                plugin.toJSON(),
                executions[runId].clientSocket
            ])
        });

        let reduceFunc = (promiseChain, currentAction, index) => {
            let actionId = (currentAction[6]._id).toString() //sharbat!! add actionIndex. or here or in updateAction
            currentAction[6].actionIndex = index;
            executions[runId].executionAgents[agent.key].processes[execProcess.uuid][processIndex].actions[actionId] = currentAction[6];
            
            return promiseChain.then(chainResults =>{
                return executeAction.apply(null, currentAction).then(currentResult => { 
                    return [...chainResults, currentResult]
                })
            });
        }

        actionsArray.reduce(reduceFunc, Promise.resolve([])).then((actionsResults) => {
            return actionsExecutionCallback(map, structure, runId, agent,execProcess)
        }).catch((error) => {
                console.error(error); //sharbat go over all console log and delete unnessasery
                let status = statusEnum.ERROR + error // sharbat do not keep error msg on the status, keep it on reason
                updateProcessContext(runId, agent, execProcess.uuid, execProcess.index, {status: status});
            })
    }).catch((error) => {console.error(error);}) 
}


function actionsExecutionCallback(map, structure, runId, agent,execProcess) {
    if (!executions[runId] || executions[runId].executionAgents[agent.key].status) { // status is just error or done
        return ;
    }
    runProcessPostRunFunc(runId, agent, execProcess, structure.code)
    updateProcessContext(runId, agent, execProcess.uuid, execProcess.index, {status: statusEnum.DONE}); // to add false if we dont want to save to db 

    executions[runId].executionAgents[agent.key].processes[execProcess.uuid][execProcess.index].status = statusEnum.DONE // we need to update process status cause we cant know how much actions we have. 
   
    runNodeSuccessors(map, structure, runId, agent, execProcess.uuid);
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
 * return the method to use or throw error if not exist
 * @param {*} plugin 
 * @param {*} action 
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

async function executeAction(map, structure, runId, agent, process, processIndex, action, plugin) {
    let actionData = {
        action: ObjectId(action._id),
        startTime: new Date(),
        retriesLeft: action.retries
    }

    updateActionContext(runId, agent.key, process.uuid, processIndex, action, actionData)
    let actionString

    let params = action.params || [];
    action.params = {}
    action.plugin = {name: plugin.name};
    
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
            result: { stderr: err.message}
        }); 
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

    let timeout;
    let timeoutPromise;
    return runAction();

    function runAction() {
        const IS_TIMEOUT = "Agent Timeout";

        if (action.timeout || (!action.timeout && action.timeout !== 0)) { // if there is a timeout or no timeout
            timeoutPromise = new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    resolve(IS_TIMEOUT);
                }, (action.timeout || 600000));
            });
        } else {
            timeoutPromise = new Promise(() => { });
        }


        return Promise.race([agentPromise, timeoutPromise]).then((result) => { // race condition between agent action and action timeout
            clearTimeout(timeout);
            if (result === IS_TIMEOUT){
                return { result: 'Timeout Error', status: 'error', stdout: actionString };
            } 
            else {
                if (result.status === 'success') {
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
                status :  result.status,
                result : result 
            }
            if (result.status == 'error' && action.retriesLeft > 0) { // retry handling
                actionData.retriesLeft = --action.retriesLeft
                updateActionContext(runId, agent.key, process.uuid, processIndex, action, actionData)
                return runAction();
            }
            actionData.finishTime =  new Date(),
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
 * @param {string} result - the cuase to stop the execution  
 */
function stopExecution(runId, socket=null, result="") {
    const d = new Date();
    let options, optionAction
    
    if(!executions[runId]){return  updateClientExecutions(socket);}

    let executionAgents = executions[runId].executionAgents
    Object.keys(executionAgents).forEach(agentKey => {
        let agent = executionAgents[agentKey];
        if (!agent) return;
        optionAction = [] 
        let processkeys = Object.keys(agent.processes)
        for (let indexKey = 2 ; indexKey <processkeys.length; indexKey++) {
            let processArray = agent.processes[processkeys[indexKey]];
            processArray.forEach(process => {
                Object.keys(process.actions).forEach(actionKey => {
                    let action = process.actions[actionKey];
                    if (!action.finishTime) {
                        let data = {
                            status :  statusEnum.STOPPED,
                            finishTime : d
                        }
                        let option = {
                            data:data, 
                            processIndex:process.processIndex,
                            actionIndex:action.actionIndex
                        }
                       optionAction.push(option)
                        sendKillRequest(executions[runId].mapResultId, actionKey, agentKey);
                    }
                });
            });
        }
        options = {
            data:optionAction,
            agentId:agent.id,
            mapResultId:executions[runId].mapResultId

        }
        optionAction ? dbUpdates.updateActionsInAgent(options): null 
    });
    exitExecutionAndUpdateMapResult(runId, {finishTime : d,  status: statusEnum.STOPPED + result } )
}

/**
 * get all pending execution from db and saves it globaly.
 */
async function rebuildPending(){
    let allPending  = await MapResult.find({ status: statusEnum.PENDING})
    pending = {}
    allPending.map(pendingMap=>{
        pending[pendingMap.map.toString()] ? pending[pendingMap.map.toString()].push(pendingMap.runId) : pending[pendingMap.map.toString()] =[pendingMap.runId]  
    })
    updateClientPending(clientSocket)

}

    /**
     * removes pending execution from pending object
     * @param mapId
     * @param runId
     * @param socket
     */
function cancelPending(mapId, runId, socket, updateDb = true){
    return new Promise((resolve, reject) => {
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
        // sharbat do not remove EVER any data, just change the status to canceled
        updateDb ? MapResult.findOneAndUpdate({map: ObjectId(mapId), status: statusEnum.PENDING}, {status: statusEnum.STOPPED}) : null
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
     */
    logs: async(resultId) => {
        let q = { runId: resultId };
        let mapResult = await MapResult.findOne(q)
        let logs = []
        mapResult.agentsResults.forEach((agentResult,iAgent) => {
            logs.push({message:"Agent #" +  iAgent + ": "})
                agentResult.processes.forEach((process,iProcess)=>{
                    logs.push({message:"Process #" +  iProcess + ": " + process.status})
                    process.preRunResult ?   logs.push({message: "preRun result:" + process.preRunResult}):null
                    process.postRunResult ?   logs.push({message: "postRun result:" + process.postRunResult}):null
                    process.actions.forEach((action, iAction)=>{
                        logs.push({message: "Action #" +  iAction + ": " + action.status})
                        let keys  = Object.keys((action.result||{}))
                        keys.forEach(k=>{
                            action.result[k]? logs.push({message: k + ':' + action.result[k]}): null
                        })
                        logs.push({message: " ---  "})
                })
                logs.push({message: " ---  "})
            });
            logs.push({message: "   "})

        })
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