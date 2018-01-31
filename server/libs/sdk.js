var currentAgent = {
    name: "",
    url: "",
    dedicatedAgents: [{ type: "", url: "" }],
    attributes: [{ name: "", value: "" }]
};

var getProcessById = function (processId) {
    return processes[processId];
};

var getProcessByName = function (name) {
    return processes.find((o) => o.name === name);
};

var getActionByIndex = function (actionIndex, processId) {
    var process = getProcessById(processId);
    var actionId = Object.keys(process.actions)[actionIndex];
    return process.actions[actionId];
};

var getAttribute = function (attributeName) {
    return (map.attributes.find((o) => o.name === attributeName)).value;
};

var setAttribute = function (attributeName, value) {
    var atrIndex = map.attributes.findIndex((o) => o.name === attributeName);
    if (atrIndex > -1) {
        map.attributes.splice(atrIndex, 1);
    }
    map.attributes.push({ name: attributeName, value: value });
};

var getProcessCrossAgent = function(processId) {
    var processes = {};
    Object.keys(globalContext).forEach(agentKey => {
        processes[globalContext[agentKey].url] = globalContext[agentKey].processes[processId];
    });
    return processes;
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