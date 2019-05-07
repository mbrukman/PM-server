const agentsService = require('./agents.service')
const _ = require("lodash");

const winston = require('winston');
const IS_TIMEOUT = "Agent Timeout";


module.exports = {
    /**
     * generate runId
     */
    guidGenerator() {
        let S4 = function () {
            return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1);
        };
        return (S4() + '-' + S4());
    },

    /**
     * returns the start node of a structure
     * @param structure
     * @returns {*}
     */
    findStartNode(structure) {
        const links = structure.links;
        for (let i = 0; i < links.length; i++) {
            let source = links[i].sourceId;
            let index = structure.processes.findIndex((o) => {
                return o.uuid === source;
            });
            if (index === -1) {
                return { type: 'start_node', uuid: source };
            }
        }
    },

/**
* Checks if agents have correct plugins versions, if not install them.
* returns null promise 
* @param map
* @param structure
* @param runId
* @param agentKey
*/
    validate_plugin_installation(plugins, agentKey) {
        const agents = agentsService.agentsStatus();
        return new Promise((resolve, reject) => {

            // check if agents has the right version of the plugins.
            const filesPaths = plugins.reduce((total, current) => {
                if (agents[agentKey].alive && current.version !== agents[agentKey].installed_plugins[current.name]) {
                    total.push(current.file);
                }
                return total;
            }, []);
            if (filesPaths && filesPaths.length > 0) {
                Promise.all(filesPaths.map(function (filePath) {
                    return agentsService.installPluginOnAgent(filePath, agents[agentKey]);
                })).then(() => {
                    winston.log('success', 'Done installing plugins');
                }).catch((error) => {
                    console.error('error', "Error installing plugins on agent", error);
                }).then(() => {
                    resolve();
                })
            }
            else {
                resolve();
            }
        });
    },

    /**
     * returns how many executions exists for map with this status
     * @param status 
     * @param mapId
     * @returns {number}
     */
    countMapExecutions(executions, mapId) {
        return (Object.keys(executions).filter(runId => {
            return executions[runId].mapId.toString() === mapId
        })).length;
    },

    /**
     * create configuration
     * @param {*} mapStructure 
     * @param {string/Object} configuration 
     */
    createConfiguration(mapStructure, configuration) {

        if(configuration){
            if (typeof configuration != 'string'){
                return {
                    name: 'custom',
                    value: configuration
                }
            } else {
                try{
                    let parsedConfiguration = JSON.parse(configuration);
                    return {
                        name: 'custom',
                        value: parsedConfiguration
                    }
                }catch(err){}
            }
        } 

        let selectedConfiguration
        if (mapStructure.configurations && mapStructure.configurations.length) {
            selectedConfiguration = configuration ? mapStructure.configurations.find(o => o.name === configuration) : mapStructure.configurations.find(o => o.selected);
            if (!selectedConfiguration) {
                selectedConfiguration = mapStructure.configurations[0];
            }
        }

        return selectedConfiguration.value || {};
    },

    /**
     * filter agents for execution
     * @param mapCode
     * @param executionContext
     * @param groups
     * @param mapAgents
     * @param executionAgents
     * @returns {*}
     */
    getRelevantAgent(groups, mapAgents) {
        function filterLiveAgents(agents) {
            let agentsStatus = Object.assign({}, agentsService.agentsStatus());
            let allAgents = []
            agents.forEach((agentObj) => {

                const agentAlive = _.find(agentsStatus, (agent) => {
                    return (agent.id === agentObj.id && agent.alive)      // check if this is the condition:
                });
                agentAlive ? allAgents.push(agentAlive) : null;
            })
            return allAgents;
        }

        let groupsAgents = {};
        groups.forEach(group => {
            groupsAgents = Object.assign(groupsAgents, agentsService.evaluateGroupAgents(group));
        })
        groupsAgents = Object.keys(groupsAgents).map(key => groupsAgents[key]);
        let totalAgents = [...JSON.parse(JSON.stringify(mapAgents)), ...JSON.parse(JSON.stringify(groupsAgents))];
        return filterLiveAgents(totalAgents);
    },

    areAllAgentsAlive(executionAgents) {
        for(let key in executionAgents){
            if(!this.isAgentShuldContinue(executionAgents[key])){
                return false;
            }
        }
        return true;
    },

    /**
     * Return false if agent dead or has an error
     * @param {*} agentKey 
     * @param {*} executionAgents 
     */
    isAgentShuldContinue(agent){
        let agentsStatus = Object.assign({}, agentsService.agentsStatus());
        for(let key  in agentsStatus){
            if (agentsStatus[key].id === agent.id) {
                return (agentsStatus[key].alive && !agent.status) 
            }
        }
        return false;
    },

    IS_TIMEOUT:IS_TIMEOUT,

    /**
     * Return timeout function  
     * @param {*} action 
     */
    generateTimeoutFun(action){
        let timeout
        let timeoutPromise = new Promise(() => { });
        if (action.timeout || (!action.timeout && action.timeout !== 0)) { // if there is a timeout or no timeout
            timeoutPromise =  new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    resolve(IS_TIMEOUT);
                }, (action.timeout || 600000));
            })
        }
        return {timeoutPromise, timeout}
    },

    /**
     * returns successors uuids for certain node
     * @param nodeUuid
     * @param structure
     * @returns {Array}
     */
    findSuccessors(nodeUuid, structure) {
        let links = structure.links.filter((o) => o.sourceId === nodeUuid);
        return links.reduce((total, current) => {
            total.push(current.targetId);
            return total;
        }, []);
    },


    isThisTheFirstAgentToGetToTheProcess(executionAgents, processUUID, agentKey) {
        for (let i in executionAgents) {
            if (i != agentKey && executionAgents[i].context.processes.hasOwnProperty(processUUID)) {
                return false;
            }

        }
        return true;
    },


    /**
 * return ancestors for a certain node
 * @param nodeUuid
 * @param structure
 * @returns {Array} - uuid of ancestors
 */
    findAncestors(nodeUuid, structure) {
        let links = structure.links.filter((o) => o.targetId === nodeUuid);
        return links.reduce((total, current) => {
            total.push(current.sourceId);
            return total;
        }, []);
    }



}


