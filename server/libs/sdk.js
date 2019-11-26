/**
 * @type {MapsService}
 */
var MapService;

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
var executionId;

/** @type {KaholoTrigger} */
var trigger;

/**
 * Represents the selected configuration
 */
/** @type {KaholoConfiguration} */
var configuration;

/**
 * Returns a process execution by the process uuid
 * @param {string} processId
 * @return {object}
 */
function getProcessById(processId) {
  return processes[processId];
}

/**
 * Get a specific iteration of process, defaults to first one
 * @param index
 * @param process
 */
function getProcessIteration(process, index = -1) {
  index = index === -1 || index === 0 ? 0 : index - 1;
  return process[index];
}

/**
 * Return the first process with the specific name or undefined.
 * @param {string} name the name of the process
 */
function getProcessByName(name) {
  var processesKey = Object.keys(process);
  var processesName = processesKey.map(k => processes[k].name);
  return processes[processesKey[processesName.findIndex(o => o === name)]];
}

/**
 * Return the action in the {actionIndex} number in the process specified
 * @param {number} actionIndex the index number of the action.
 * @param process
 * @return {*|Action}
 */
function getActionByIndex(actionIndex, process) {
  if (typeof process !== "object") {
    throw new Error("invalid parameters: process should be an object");
  }
  var actionId = Object.keys(process.actions)[actionIndex];
  return process.actions[actionId];
}

/**
 * Returns an object containing the process from all the running agent.
 * @param {string} processId
 * @return {object} all the process. the keys are the agents urls.
 */
function getProcessCrossAgent(processId) {
  var processes = {};
  Object.keys(globalContext).forEach(agentKey => {
    processes[globalContext[agentKey].url] =
      globalContext[agentKey].processes[processId];
  });
  return processes;
}

/**
 * Return the selected configuration or undefined
 * @return {object | undefined}
 */
function getConfiguration() {
  return configuration;
}

/** @type {KaholoVault} */
var vault;

/* represents the previous action that was running in this process
 when the action is the first one to run will be undefined */

// /* represents the current running action */
/** @type {KaholoAction} */
var currentAction;

/** @type {KaholoAction} */
var previousAction;

/* represents the previous running process */
/** @type {KaholoProcess} */
var previousProcess;

/* represents the current running process */
/** @type {KaholoProcess} */
var currentProcess;

/* represents the previous link result (not the process) */
/** @type {KaholoLink} */
var previousLink;

/* represents the current Link */
/** @type {KaholoLink} */
var currentLink;
