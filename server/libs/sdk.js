var currentAgent = {
    name: "",
    url: "",
    attributes: [{ name: "", value: "" }]
};

var configuration = {};

/**
 * Returns a process execution by the process uuid
 * @param {string} processId
 * @returns {object}
 */
var getProcessById = function (processId) {
    return processes[processId];
};

/**
 * Get a specific iteration of process, defaults to first one
 * @param index
 * @param process
 */
var getProcessIteration = function (process, index = -1) {
    index = (index === -1 || index === 0) ? 0 : index - 1;
    return process[index];
};

/**
 * Return the first process with the specific name or undefined.
 * @param {string} name the name of the process
 */
var getProcessByName = function (name) {
    var processesKey = Object.keys(process);
    var processesName = processesKey.map(k => processes[k].name);
    return processes[processesKey[processesName.findIndex(o => o === name)]]
};

/**
 * Return the action in the {actionIndex} number in the process specified
 * @param {number} actionIndex the index number of the action.
 * @param process
 * @returns {*|Action}
 */
var getActionByIndex = function (actionIndex, process) {
    if (typeof process !== 'object') {
        throw new Error('invalid parameters: process should be an object');
    }
    var actionId = Object.keys(process.actions)[actionIndex];
    return process.actions[actionId];
};

/**
 * Returns an object containing the process from all the running agent.
 * @param {string} processId
 * @returns {object} all the process. the keys are the agents urls.
 */
var getProcessCrossAgent = function (processId) {
    var processes = {};
    Object.keys(globalContext).forEach(agentKey => {
        processes[globalContext[agentKey].url] = globalContext[agentKey].processes[processId];
    });
    return processes;
};


/**
 * Return the selected configuration or undefined
 * @returns {object | undefined}
 */
var getConfiguration = function () {
    return configuration;
};

/* represents the previous action that was running in this process
 when the action is the first one to run will be undefined */
var previousAction = {
    "server": {
        "type": "",
        "name": "",
        "id": ""
    },
    "method": {
        "params": [
            {
                "name": "",
                "type": "",
                "id": ""
            }
        ],
        "agent": {
            "type": "",
            "id": ""
        },
        "name": "",
        "actionString": "",
        "createdAt": "",
        "updatedAt": "",
        "id": ""
    },
    "params": {},
    "name": "",
    "timeout": 0,
    "timeunit": 0,
    "retries": 0,
    "mandatory": false,
    "suspend": false,
    "result": "",
    "status": 0,
    "id": 0,
    "order": 0,
    "lastUpdate": ""
};

// /* represents the current running action */
var currentAction = previousAction;

// /* represents the current running process */
var currentProcess = {
    "id": 0,
    "name": "",
    "description": "",
    "order": 0,
    "default_execution": false,
    "mandatory": false,
    "actions": [
        currentAction
    ],
    "result": ""
};

var previouseProcess = currentProcess;

/* represents the previous link result (not the prcess) */
var previousLink = {
    "id": "",
    "sourceId": "",
    "targetId": "",
    "processes": [
        currentProcess
    ],
    "result": "",
    "linkIndex": 0
};

/* represents the current Link */
var currentLink = previousLink;
