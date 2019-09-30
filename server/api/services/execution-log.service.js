const models = require('../models');
const MapExecutionLog = models.ExecutionLog;
const socketService = require('./socket.service');

function _createLogObject(runId, mapId, message, level) {
  return {
    map: mapId,
    runId: runId,
    message: message,
    status: level,
  };
}

function _createLog(log) {
  return MapExecutionLog.create(log).then((newLog) => {
    if (Array.isArray(newLog)) {
      newLog.forEach( (l)=> emitLog(l));
    } else {
      emitLog(newLog);
    }

    function emitLog(logToEmit) {
      if (!socketService.socket) return;
      socketService.socket.emit('notification', logToEmit);
      socketService.socket.emit('update', logToEmit);
    }
  });
}

const exportedMethods = {
  create: _createLog,
};

MapExecutionLog.schema.tree.status.enum.forEach((level)=>{
  exportedMethods[level] = (runId, mapId, message) => {
    const log = _createLogObject(runId, mapId, message, level);
    return _createLog(log);
  };
});


module.exports = exportedMethods;
