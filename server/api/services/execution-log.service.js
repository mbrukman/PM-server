const models = require("../models");
const MapExecutionLog = models.ExecutionLog;

function _createLogObject(runId, mapId, message, level){
    return {
        map: mapId,
        runId: runId,
        message: message,
        status: level
    };
}

function _createLog(log, socket){
    return MapExecutionLog.create(log).then((newLog) => {
        if(Array.isArray(newLog))
            newLog.forEach( l=> emitLog(l));
        else
            emitLog(newLog);

        function emitLog(logToEmit){
            socket.emit('notification', logToEmit);
            socket.emit('update', logToEmit);
        }
    });
}

let exportedMethods = {
    create : _createLog
};

MapExecutionLog.schema.tree.status.enum.forEach((level)=>{
    exportedMethods[level] = (runId, mapId, message, socket) => {
        let log = _createLogObject(runId, mapId, message, level)
        return _createLog(log, socket)
    }
})


module.exports = exportedMethods;
