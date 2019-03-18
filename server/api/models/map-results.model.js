const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let actionResultSchema = new Schema({
    // name: String,
    action: { type: Schema.Types.ObjectId, ref: 'MapStructure.processes.actions' },
    method: { name: String, _id: { type: Schema.Types.ObjectId, ref: 'Plugin.method' } },
    status: String,
    startTime: Date,
    finishTime: Date,
    result: Schema.Types.Mixed
}, { _id: false });

let processResultSchema = new Schema({
    index: Number,
    // name: String,
    process: { type: Schema.Types.ObjectId, ref: 'MapStructure.processes' },
    uuid: String,
    plugin: String,
    actions: [actionResultSchema],
    status: String,
    startTime: Date,
    finishTime: Date,
    result: Schema.Types.Mixed
}, { _id: false });

let agentResultSchema = new Schema({
    // name: String,
    processes: [processResultSchema],
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    status: String,
    startTime: Date,
    finish: Date,
    result: Schema.Types.Mixed,
    done,
    pendingProcesses = {
        processKey : Date,
        successor

    },
    executionContext : executionContextSchema


}, { _id: false });

executionContextSchema =  new Schema({
    processes,
    globalContext, 
    plugins,
    visitedProcesses,                                       
    finishTime, 
    startTime, 
    structure, 
    executionId, // == runId 
    map = {id},  // sendKillRequest : 
})


let mapResultSchema = new Schema({
    map: { type: Schema.Types.ObjectId, ref: 'Map' },
    runId: { type: String, required: true },
    structure: { type: Schema.Types.ObjectId, ref: 'MapStructure' },
    configuration: Schema.Types.Mixed,
    agentsResults: [agentResultSchema],
    startAgentsNumber: Number,
    cleanFinish: Boolean,
    startTime: Date,
    finishTime: Date,
    trigger: String,
    stop,
});

mapResultSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let MapResult = mongoose.model('MapResult', mapResultSchema, 'mapResults');


module.exports = MapResult;


executions = {  //379
    runId,
    map: map._id,
    stop : boolean, // shouldContinueExecution
    executionContext: executionContext,  //copy from executionAgents 
    executionAgents: executionAgents,
    resultObj, // ===  mapResultSchema._id no need // just for.
    
    };


    executionContext = {
        processes,
        globalContext, // getProcessCrossAgent
        plugins,
        visitedProcesses, //processKey ==  agentKey =>  isThisTheFirstAgentToGetToTheProcess
        agentKey,
        finishTime, // summarizeExecution duplicate
        startTime,  // summarizeExecution duplicate
        structure, // summarizeExecution duplicate
        executionId, // == runId 
        map = {id},  // sendKillRequest : 
        agents // executionContext.agents = executionAgents;  // no need 
    }

    executionAgents = {
        processes[] : {processKey,  ancestor[0] = {
            result ,  // process.result = 'Process stopped'; 
            status,// 'executing' | 'stopped' /// executing - isThereProcessExecutingOnAgent // is the process still run ?
            actions = {
                status, // same as status
                finishTime,
                result = { // action.result
                    status,
                    result
                }
            }, 
            uuid   // .processes.hasOwnProperty(process.uuid)  // .executionAgents[agent.key].processes[processUUID][processIndex].actions
        }}, 
        agentKey,
        done, // go over all agent. check if all Agent done.  One place
        status, // maybe for front why and if stoped   'error' | 'stopped' |  available  // agent.status === 'available' ? 'success' : agent.status, // agent.status !== 'error' 
        //  available,stopped - no need 
        result,
        continue : boolean ,  //shouldContinueExecution // cam replace with => status = 'error'
        pendingProcesses = {
            processKey : Date,
            successor

        }, 
        finishTime, 
        executionContext // todo !! it is here double!  updateExecutionContext // copy from executionAgents 
    }


    process.coordination === 'race'
    executions[runId].executionAgents[agent.key].processes.hasOwnProperty(process.uuid))
    //43  executions[runId].


    pending = {
        map,
        structureId,
        runId,
        cleanWorkspace,
        socket,
        configurationName,
        triggerReason,
        agents
    }