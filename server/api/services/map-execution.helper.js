const agentsService = require("./agents.service");
const _ = require("lodash");

const winston = require("winston");
const IS_TIMEOUT = "Agent Timeout";

function /**
 * create configuration
 * @param {*} mapStructure
 * @param {string|Object} configuration
 */
_createConfiguration(mapStructure, configuration) {
  if (configuration) {
    if (typeof configuration != "string") {
      return {
        name: "custom",
        value: configuration
      };
    } else {
      try {
        const parsedConfiguration = JSON.parse(configuration);
        return {
          name: "custom",
          value: parsedConfiguration
        };
      } catch (err) {}
    }
  }

  let selectedConfiguration;
  if (
    mapStructure.configurations &&
    mapStructure.configurations.length &&
    configuration
  ) {
    selectedConfiguration = mapStructure.configurations.find(
      o => o.name === configuration
    );
    if (!selectedConfiguration) {
      selectedConfiguration = mapStructure.configurations[0];
    }
  }

  return selectedConfiguration
    ? selectedConfiguration.toObject()
    : { name: "custom", value: "" };
}

module.exports = {
  /**
   * @param structure
   * @return {Object} - start node of a structure
   */
  findStartNode(structure) {
    const links = structure.links;
    for (let i = 0; i < links.length; i++) {
      const source = links[i].sourceId;
      const index = structure.processes.findIndex(o => {
        return o.uuid === source;
      });
      if (index === -1) {
        return { type: "start_node", uuid: source };
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
   * @return {Promise<null>}
   */
  async validate_plugin_installation(plugins, agentKey) {
    const agentStatus = await agentsService.getAgentStatus(agentKey);
    return new Promise((resolve, reject) => {
      // check if agents has the right version of the plugins.
      const filesPaths = plugins.reduce((total, current) => {
        if (
          agentStatus.alive &&
          current.version !== agentStatus.installed_plugins[current.name]
        ) {
          total.push(current.file);
        }
        return total;
      }, []);
      if (filesPaths && filesPaths.length > 0) {
        Promise.all(
          filesPaths.map(function(filePath) {
            return agentsService.installPluginOnAgent(filePath, agentStatus);
          })
        )
          .then(() => {
            winston.log("success", "Done installing plugins");
          })
          .catch(error => {
            console.error("error", "Error installing plugins on agent", error);
          })
          .then(() => {
            resolve();
          });
      } else {
        resolve();
      }
    });
  },

  /**
   * returns how many executions exists for map with this status
   * @param status
   * @param mapId
   * @return {number}
   */
  countMapExecutions(executions, mapId) {
    return Object.keys(executions).filter(runId => {
      return executions[runId].mapId.toString() === mapId;
    }).length;
  },

  getConfiguration(structure, configuration) {
    const mainConfig = _createConfiguration(structure, configuration.config);
    if (!configuration.mergeConfig) {
      return mainConfig;
    }
    const mergeConfig = _createConfiguration(
      structure,
      configuration.mergeConfig
    );
    return {
      name: "custom",
      value: Object.assign(mainConfig.value, mergeConfig.value)
    };
  },

  /**
   * filter agents for execution
   * @param mapCode
   * @param executionContext
   * @param groups
   * @param mapAgents
   * @param executionAgents
   * @return {KaholoAgent[]}
   */
  getRelevantAgent(groups, mapAgents) {
    async function filterLiveAgents(agents) {
      const agentsStatus = Object.assign(
        {},
        await agentsService.getAllAgentsStatus()
      );
      const allAgents = [];
      agents.forEach(agentObj => {
        const agentAlive = _.find(agentsStatus, agent => {
          return agent.id === agentObj.id && agent.alive; // check if this is the condition:
        });
        agentAlive ? allAgents.push(agentAlive) : null;
      });
      return allAgents;
    }

    let groupsAgents = {};
    groups.forEach(group => {
      groupsAgents = Object.assign(
        groupsAgents,
        agentsService.evaluateGroupAgents(group)
      );
    });
    groupsAgents = Object.keys(groupsAgents).map(key => groupsAgents[key]);
    const totalAgents = [
      ...JSON.parse(JSON.stringify(mapAgents)),
      ...JSON.parse(JSON.stringify(groupsAgents))
    ];
    return filterLiveAgents(totalAgents);
  },

  /**
   * @param {*} executionAgents
   * @return {boolean}
   */
  areAllAgentsAlive(executionAgents) {
    for (const key in executionAgents) {
      if (!this.isAgentShuldContinue(executionAgents[key])) {
        return false;
      }
    }
    return true;
  },

  /**
   * @param {*} agentKey
   * @param {*} executionAgents
   * @return {boolean} - false if agent dead or has an error
   */
  async isAgentShuldContinue(agent) {
    const agentsStatus = Object.assign(
      {},
      await agentsService.getAllAgentsStatus()
    );
    for (const key in agentsStatus) {
      if (agentsStatus[key].id === agent.id) {
        return agentsStatus[key].alive && !agent.status;
      }
    }
    return false;
  },

  IS_TIMEOUT: IS_TIMEOUT,

  /**
   * Return timeout function
   * @param {*} action
   * @return {{timeoutPromise : Promise, timeout : function}}
   */
  generateTimeoutFun(action) {
    let timeout;
    let timeoutPromise = new Promise(() => {});
    if (action.timeout || (!action.timeout && action.timeout !== 0)) {
      // if there is a timeout or no timeout
      timeoutPromise = new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          resolve(IS_TIMEOUT);
        }, action.timeout || 600000);
      });
    }
    return { timeoutPromise, timeout };
  },

  /**
   * returns successors uuids for certain node
   * @param nodeUuid
   * @param structure
   * @return {string[]} - array of uuids
   */
  findSuccessors(nodeUuid, structure) {
    const links = structure.links.filter(o => o.sourceId === nodeUuid);
    return links.reduce((total, current) => {
      total.push(current.targetId);
      return total;
    }, []);
  },

  /**
   *
   * @param {*} executionAgents
   * @param {string} processUUID
   * @param {*} agentKey
   * @return {boolean} - false in case another agent got to process first
   */
  isThisTheFirstAgentToGetToTheProcess(executionAgents, processUUID, agentKey) {
    for (const i in executionAgents) {
      if (
        i != agentKey &&
        executionAgents[i].context.processes.hasOwnProperty(processUUID)
      ) {
        return false;
      }
    }
    return true;
  },

  /**
   * return ancestors for a certain node
   * @param nodeUuid
   * @param structure
   * @return {Array} - uuid of ancestors
   */
  findAncestors(nodeUuid, structure) {
    const links = structure.links.filter(o => o.targetId === nodeUuid);
    return links.reduce((total, current) => {
      total.push(current.sourceId);
      return total;
    }, []);
  }
};
