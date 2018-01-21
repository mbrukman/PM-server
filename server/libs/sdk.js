var currentAgent = { name: "", url: "", dedicatedAgents: [{ type: "", url: "" }], attributes: [{ name: "", value: "" }] };


/**
 * print msg to messages console
 *
 * @method     printToConsole
 * @param      {String}  msg  { msg to print }
 * @return     {void}  { no print }
 */
var printToConsole = function(msg) {

}

/*
 * return the link with the given id from current map
 *
 * @method     getLinkById
 * @param      {GUID string}  id      { link id from current map}
 * @return     Link JSON obj or -1 if no link with @id is found
 */
var getLinkById = function (id) {
    for (var i = map.links.length - 1; i >= 0; i--) {
        var link = map.links[i];
        if (link.id === id) {
            return link;
        }
    };
    return -1;
}

/**
 * gets process object from link by process id
 *
 * @method     getProcessById
 * @param      {String}    linkId     the link id
 * @param      {String}    processId  wanted process id
 * @return     {Object}  process object, if no link exist -1 if process don't exist in  link -2
 */
var getProcessById = function (linkId, processId) {
    var link = getLinkById(linkId);
    if (link !== -1) {
        for (var i = link.processes - 1; i >= 0; i--) {
            var process = link.processes[i];
            if (process.id === processId) {
                return process;
            }
        };
        return -2;
    }
    return -1
}

/**
 * retrives the processes list from link with linkId on current map.
 *
 * @method     getLinkProcesses
 * @param      {String}    linkId  the link id
 * @return     processes list of given link, if no link exist in current map return -1
 */
var getLinkProcesses = function (linkId) {
    var link = getLinkById(linkId);
    if (link !== -1) {
        return link.processes;
    }
    return -1;
}

/**
 * retrive the links of current map
 *
 * @method     getLinks
 * @return     {Array} array of links objects.
 */
var getLinks = function () {
    return map.links;
}

/**
 * get the action list of proces in link from current map
 *
 * @method     getActions
 * @param      {String} linkId link's id in map.
 * @param      {String} processId  process id in link
 * @return     {actions} array from process, -1 if no link exist and -2 if no process exist.
 */
var getActions = function (linkId, processId) {
    var process = getProcessById(linkId, processId);
    if (process < 0) {
        return process;
    }
    else {
        return process.actions;
    }
}

/**
 * get actions from process and link by id
 *
 * @method     getActionById
 * @param      {String} linkId the link id
 * @param      {String}             processId process id in link
 * @param      {String}             actionId action id in link
 * @return     {action} json if found else -3 if no link exist -1 if no process exist -2
 */
var getActionById = function (linkId, processId, actionId) {
    var actions = getActions(linkId, processId);
    if (actions < 0) {
        return actions;
    }
    else {
        for (var i = actions.length - 1; i >= 0; i--) {
            var action = actions[i];
            if (action.id === actionId) {
                return action;
            }
        }
        return -3;
    }
}

/**
 * add new attribute to the current map
 *
 * @method     addMapAttribute
 * @param      {string}  name    attribute name
 * @param      {any}  value   the attribute value
 */
var addMapAttribute = function (name, value) {
    if (!map.attributes) {
        map.attributes = {};
    }
    map.attributes.name = value;
}

/**
 * get process result from the inflated object at the server
 *
 * @method     getProccessResult
 * @param      {object}  proc    the process object
 * @return     {string}  the inflated object result
 */
var getProccessResult = function (proc) {
    return proc.result;
}
/**
 * get the selected link result
 *
 * @method     getLinkResult
 * @param      {objcect}  link    the link object
 * @return     {string}  result from db
*/
var getLinkResult = function (link) {
    return link.result;
}

/**
 * get the action result after server assignmenr ibnlk
 *
 * @method     getActionResult
 * @param      {Object}  action  { action object }
 * @return     {Object}  { the screen or bajagar }
 */
var getActionResult = function (action) {
    return action.result;
}

/**
 * gets attribute value from production map object
 *
 * @method     getAttribute
 * @param      {Object}            obj     the pm object with attributes array
 * @param      {string}            name    the attribute name
 * @return     {(Object|boolean)}  the value of the attribute with key 'name' if no attribute is found return false
 */
var getAttribute = function (obj, name) {
    for (var i = obj.attributes.length - 1; i >= 0; i--) {
        var attr = obj.attributes[i];
        if (attr.name === name) {
            return attr.value;
        }
    }
    return false;
}

/**
 * gets attribute value from production map object
 *
 * @method     setAttribute
 * @param      {Object}            obj     the pm object with attributes array
 * @param      {string}            name    the attribute name
 * @param      {Object}            value   the attribute value
 * @return     {(Object|boolean)}  the value of the attribute with key 'name' if no attribute is found return false
 */
var setAttribute = function (obj, name, value) {
    for (var i = obj.attributes.length - 1; i >= 0; i--) {
        var attr = obj.attributes[i];
        if (attr.name === name) {
            attr.value = value;
            return obj;
        }
    }
    obj.attributes.push({ name: name, value: value });
    return obj;
}

var setMapAttribute = function (name, type, value) {
    map.attributes[name] = { "name": name, "type": type, "value": value };
    return map;
}

/**
 * *** IMPLEMENTED BY USER ***
 * this is a stub function to be override by user!
 * each time a map is executed this function will be called.
 * the function have to return a list of strings represents the id's of the relevant base agents
 * @return {Array} strings array represents the id's of the base agent which the map will execute on.
 */
var filterServers = function () {
    return false;
}

/**
 * get previous action from currentAction variable (works onlly at the same process)
 * @return {JSON} the previous action structure
 */
var getPreviousAction = function () {
    var actionName = currentAction.name;
    var linkId = currentLink.id;
    var processId = currentProcess.name;
    for (var i = 0; i < map.links.length; i++) {
        var link = map.links[i];
        if (link.id == linkId) {
            for (var j = 0; j < link.processes.length; j++) {
                var process = link.processes[j];
                if (process.name == processId) {
                    for (var k = 0; k < process.actions.length; k++) {
                        var action = process.actions[k];
                        if (action.name == actionName) {
                            return process.actions[k - 1];
                        }
                    }
                }
            }
        }
    }
    return -1;
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
    "params": {
    },
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