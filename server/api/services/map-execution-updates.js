const models = require('../models');
const MapResult = models.MapResult;
let dbQueue = [];

const ObjectId = require('mongoose').Types.ObjectId;


const statusEnum = models.statusEnum;


const funcs = {
  updateMapResult: _updateMapResult,
  addProcess: _addProcess,
  updateProcess: _updateProcess,
  addAction: _addAction,
  updateAction: _updateAction,
  addAgent: _addAgent,
  updateAgent: _updateAgent,
  updateActionsInAgent: _updateActionsInAgent,
};
let mapExecMethods;
let dbRetries = 3;

function _runDbFunc() {
  if (!dbQueue.length) {
    return;
  }
  const lastElement = dbQueue[dbQueue.length - 1];
  funcs[lastElement.func](lastElement.data).then((res) => {
    dbRetries = 3;
    // console.log(`func ${lastElement.func} res:`, res)
    dbQueue.pop();
    _runDbFunc();
  }).catch((err) => {
    console.error('error in ' + lastElement.func + ' - ' + err);
    if (dbRetries) {
      dbRetries--;
      return _runDbFunc();
    }
    dbQueue = [];
    mapExecMethods.stopExecution(null, null, ' - MongoError', lastElement.data.mapResultId);
  });
}


function _insertToDB(options) {
  dbQueue.unshift(options);
  if (dbQueue.length == 1) {
    _runDbFunc();
  }
}

function _getPathFiledsToUpdate(pathToSet, data) {
  const toUpdate = {};
  Object.keys(data).forEach((field) => {
    const x = pathToSet + field;
    toUpdate[x] = data[field];
  });
  return toUpdate;
}

function _updateMapResult(options) {
  return MapResult.findByIdAndUpdate(options.mapResultId, {$set: options.data}, {new: true})
      .then((mapResult) => {
        return mapResult;
      });
}

function _addAgent(options) {
  return MapResult.findByIdAndUpdate(ObjectId(options.mapResultId),
      {$push: {'agentsResults': options.data}}
  );
}

function _updateAgent(options) {
  const pathToSet = 'agentsResults.$.';
  const toUpdate = _getPathFiledsToUpdate(pathToSet, options.data);

  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$set: toUpdate}
  );
}

function _addProcess(options) {
  processReasult = {
    iterationIndex: options.processData.iterationIndex,
    process: options.processData.processId,
    startTime: options.processData.startTime,
    actions: [],
  };
  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$push: {'agentsResults.$.processes': processReasult}} // "agentsResults.$.processes.0"
  );
}

function _updateProcess(options) {
  const pathToSet = 'agentsResults.$.processes.' + options.processIndex + '.';
  const toUpdate = _getPathFiledsToUpdate(pathToSet, options.data);
  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$set: toUpdate}
  );
}

function _addAction(options) {
  const pathToSet = 'agentsResults.$.processes.' + options.processIndex + '.actions';
  const toUpdate = {};
  toUpdate[pathToSet] = options.data;

  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$push: toUpdate}
  );
}


function _updateAction(options) {
  const pathToSet = 'agentsResults.$.processes.' + options.processIndex + '.actions.' + options.actionIndex + '.';
  const toUpdate = _getPathFiledsToUpdate(pathToSet, options.data);
  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$set: toUpdate}
  );
}


function _updateActionsInAgent(options) {
  const toUpdate = {};
  options.data.forEach((p) => {
    const pathToSet = 'agentsResults.$.processes.' + p.processIndex + '.actions.' + p.actionIndex + '.';
    Object.assign(toUpdate, _getPathFiledsToUpdate(pathToSet, p.data));
  });

  return MapResult.findOneAndUpdate(
      {
        '_id': ObjectId(options.mapResultId),
        'agentsResults.agent': ObjectId(options.agentId),
      },
      {$set: toUpdate}
  );
}


module.exports = function(methods) {
  mapExecMethods = methods;
  return {
    statusEnum: statusEnum,

    updateMapResult(optionsData) {
      const options = {
        func: 'updateMapResult',
        data: optionsData,
      };
      _insertToDB(options);
    },


    addAgentResult(agentData, mapResultId) {
      const data = {
        processes: [],
        agent: ObjectId(agentData.id),
        startTime: agentData.startTime,
      };

      const optionsData = {
        data: data,
        mapResultId: mapResultId,
      };

      const options = {
        func: 'addAgent',
        data: optionsData,
      };
      _insertToDB(options);
    },

    updateAgent(optionsData) {
      const options = {
        func: 'updateAgent',
        data: optionsData,
      };
      _insertToDB(options);
    },


    updateProcess(optionsData) {
      const options = {
        func: 'updateProcess',
        data: optionsData,
      };
      _insertToDB(options);
    },

    addProcess(optionsData) {
      const options = {
        func: 'addProcess',
        data: optionsData,
      };
      _insertToDB(options);
    },


    addAction(optionsData) {
      const options = {
        func: 'addAction',
        data: optionsData,
      };
      _insertToDB(options);
    },

    updateAction(optionsData) {
      const options = {
        func: 'updateAction',
        data: optionsData,
      };
      _insertToDB(options);
    },

    updateActionsInAgent(optionsData) {
      const options = {
        func: 'updateActionsInAgent',
        data: optionsData,
      };
      _insertToDB(options);
    },

    getAndUpdatePendingExecution(mapId) { // returnNewDocument: true,
      return MapResult.findOneAndUpdate({map: ObjectId(mapId), status: statusEnum.PENDING}, {status: statusEnum.RUNNING, startTime: new Date()},
          {new: true, sort: {'createdAt': 1}});
    },

  };
};


