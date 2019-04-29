const agentsService = require('./agents.service')
const _ = require("lodash");

const winston = require('winston');


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
     * returning start node for a structure
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
* Checks if agents have correct plugins versions, if not install them
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

    createConfiguration(mapStructure, configurationName) {
        if (configurationName && typeof configurationName != 'string') {
            return {
                name: 'custom',
                value: configurationName
            }
        }
        let selectedConfiguration = {}
        if (mapStructure.configurations && mapStructure.configurations.length) {
            selectedConfiguration = configurationName ? mapStructure.configurations.find(o => o.name === configurationName) : mapStructure.configurations.find(o => o.selected);
            if (!selectedConfiguration) {
                selectedConfiguration = mapStructure.configurations[0];
            }
        }

        return selectedConfiguration.value;
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
        let agentKeys = Object.keys(executionAgents)
        let res = true
        agentKeys.forEach(async(key) => {
            // if(!await agentsService.checkAgentAlive(key)){ if I do async func the rest of agents contonus to run .
            if(!this.isAgentShuldContinue(key, executionAgents)){
                return res = false;
            }
        })
        return res;
    },

    isAgentShuldContinue(agentKey, executionAgents){
        let agentsStatus = Object.assign({}, agentsService.agentsStatus());
        let res = true
        _.find(agentsStatus, (agent) => {
            if (agent.id === executionAgents[agentKey].id) {
                if (!agent.alive || executionAgents[agentKey].status) {
                    return res = false
                }
            }
        })
        return res;
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
            if (i != agentKey && executionAgents[i].processes.hasOwnProperty(processUUID)) {
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


