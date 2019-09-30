/**
 * @type {MapsService}
 */
let MapService;

/**
 * Represents the execution Id
 */
/** @type {KaholoAgent} */
var currentAgent = {
  name: "",
  url: "",
  attributes: [{ name: "" }]
};

/**
 * Represents the execution Id
 */
/** @type {KaholoAgent} */
var currentAgent;
let executionId;

/** @type {KaholoTrigger} */
let trigger;

/**
 * Represents the selected configuration
 */
/** @type {KaholoConfiguration} */
let configuration;

/**
 * Returns a process execution by the process uuid
 * @param {string} processId
 * @return {object}
 */
const getProcessById = function(processId) {
  return processes[processId];
};

/**
 * Get a specific iteration of process, defaults to first one
 * @param index
 * @param process
 */
const getProcessIteration = function(process, index = -1) {
  index = index === -1 || index === 0 ? 0 : index - 1;
  return process[index];
};

/**
 * Return the first process with the specific name or undefined.
 * @param {string} name the name of the process
 */
const getProcessByName = function(name) {
  const processesKey = Object.keys(process);
  const processesName = processesKey.map(k => processes[k].name);
  return processes[processesKey[processesName.findIndex(o => o === name)]];
};

/**
 * Return the action in the {actionIndex} number in the process specified
 * @param {number} actionIndex the index number of the action.
 * @param process
 * @return {*|Action}
 */
const getActionByIndex = function(actionIndex, process) {
  if (typeof process !== "object") {
    throw new Error("invalid parameters: process should be an object");
  }
  const actionId = Object.keys(process.actions)[actionIndex];
  return process.actions[actionId];
};

/**
 * Returns an object containing the process from all the running agent.
 * @param {string} processId
 * @return {object} all the process. the keys are the agents urls.
 */
const getProcessCrossAgent = function(processId) {
  const processes = {};
  Object.keys(globalContext).forEach(agentKey => {
    processes[globalContext[agentKey].url] =
      globalContext[agentKey].processes[processId];
  });
  return processes;
};

/**
 * Return the selected configuration or undefined
 * @return {object | undefined}
 */
const getConfiguration = function() {
  return configuration;
};

/** @type {KaholoVault} */
let vault;

/* represents the previous action that was running in this process
 when the action is the first one to run will be undefined */

// /* represents the current running action */
/** @type {KaholoAction} */
let currentAction;

/** @type {KaholoAction} */
let previousAction;

/* represents the previous running process */
/** @type {KaholoProcess} */
let previousProcess;

/* represents the current running process */
/** @type {KaholoProcess} */
let currentProcess;

/* represents the previous link result (not the process) */
/** @type {KaholoLink} */
let previousLink;

/* represents the current Link */
/** @type {KaholoLink} */
let currentLink;
