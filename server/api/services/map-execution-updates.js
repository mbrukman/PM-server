const models = require("../models");
const MapResult = models.MapResult;
const AgentResult = models.AgentResult;

let dbQueue = []

const ObjectId = require('mongoose').Types.ObjectId;


const statusEnum = models.statusEnum


var funcs = {
    updateMapReasult: _updateMapReasult,
    addProcess: _addProcess,
    updateProcess: _updateProcess,
    addAction: _addAction,
    updateAction: _updateAction,
    addAgent: _addAgent,
    updateAgent: _updateAgent,
    updateActionsInAgent: _updateActionsInAgent
}

function _runDbFunc() {
    if (!dbQueue.length) {
        return
    }
    const lastElement = dbQueue[dbQueue.length - 1]
    funcs[lastElement.func](lastElement.data).then(res => {
        console.log(`func ${lastElement.func} res:`, res)
        dbQueue.pop();
        _runDbFunc()
    }).catch(err => {
        console.error('error in ' + lastElement.func +" - "+ err);
        dbQueue = []
        //todo stop exec 
        
    })
}


function _insertToDB(options) {
    dbQueue.unshift(options)
    if (dbQueue.length == 1) { // todo if error continue saving
        _runDbFunc()
    }
    console.log('new insert', options.func);
}

function _updateMapReasult(options) {
    return MapResult.findByIdAndUpdate(options.mapResultId, { $set: options.data }, { new: true }) 
        .then((mapResult) => {
            return options.socket.emit('map-execution-result', mapResult);
        });
}

function _addAgent(options) {
    return MapResult.findByIdAndUpdate(ObjectId(options.mapResultId),
        { $push: { "agentsResults": options.data } }
    )
}

function _updateAgent(options) {
    let pathToSet = "agentsResults.$."
    let toUpdate = {}
    Object.keys(options.data).forEach(k=>{
        let x = pathToSet + k
        toUpdate[x] = options.data[k]
    })
 
    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $set: toUpdate }
    )
}

function _addProcess(options) {
    processReasult = {
        iterationIndex: options.processData.iterationIndex,
        process: options.processData.processId,
        actions: []
    }
    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $push: { "agentsResults.$.processes": processReasult } }  // "agentsResults.$.processes.0"
    )
}

function _updateProcess(options) {

    let pathToSet = "agentsResults.$.processes." + options.processIndex + "." + options.field
    let toUpdate = {}
    toUpdate[pathToSet] = options.value
    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $set: toUpdate }
    )
}

function _addAction(options) {

    let pathToSet = "agentsResults.$.processes." + options.processIndex + ".actions" //todo! add to same process??! shuld be process.lengt!! Object.keys(process) 
    let toUpdate = {}
    toUpdate[pathToSet] = options.data

    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $push: toUpdate }
    )
}


function _updateAction(options) {
    
    let pathToSet = "agentsResults.$.processes." + options.processIndex + ".actions." + options.actionIndex
    let toUpdate = {}
    toUpdate[pathToSet] = options.data
    
    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $set: toUpdate }
        )
    }
    

function _updateActionsInAgent(options){  

    let toUpdate = {}
    options.data.forEach(p=>{
        let pathToSet = "agentsResults.$.processes." + p.processIndex + ".actions." + p.actionIndex + "."
        Object.keys(p.data).forEach(k=>{
            let x = pathToSet + k
            toUpdate[x] = p.data[k]
        })
    })
    
    return MapResult.findOneAndUpdate(
        {
            '_id': ObjectId(options.mapResultId),
            'agentsResults.agent': ObjectId(options.agentId)
        },
        { $set: toUpdate }
        )
        
}


module.exports = {
    statusEnum:statusEnum,

    updateMapReasult(optionsData) {
        let options = {
            func: "updateMapReasult",
            data: optionsData
        }
        _insertToDB(options)
    },



    addAgentResult(agentData, mapResultId) {
        let data = {
            processes: [],
            agent: ObjectId(agentData.id),
            startTime: agentData.startTime
        };

        let optionsData = {
            data: data,
            mapResultId: mapResultId
        }

        let options = {
            func: "addAgent",
            data: optionsData
        }
        _insertToDB(options)

    },

    updateAgent(optionsData){
        let options = {
            func: "updateAgent",
            data: optionsData
        }
        _insertToDB(options)
    },


    updateProcess(optionsData) {
        let options = {
            func: "updateProcess",
            data: optionsData
        }
        _insertToDB(options)

    },

    addProcess(optionsData) {
        let options = {
            func: "addProcess",
            data: optionsData
        }
        _insertToDB(options)
    },


    addAction(optionsData) {
        let options = {
            func: "addAction",
            data: optionsData
        }
        _insertToDB(options)
    },

    updateAction(optionsData) {

        let options = {
            func: "updateAction",
            data: optionsData
        }
        _insertToDB(options)
    },

    updateActionsInAgent(optionsData){
        
        let options = {
            func: "updateActionsInAgent",
            data: optionsData
        }
        _insertToDB(options)
    },

    async getPendingExecution(mapId){
        return await MapResult.findOne({map: ObjectId(mapId), status: statusEnum.PENDING})

    }

}




