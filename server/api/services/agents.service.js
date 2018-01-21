const request = require("request");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const humanize = require("../../helpers/humanize");
const env = require("../../env/enviroment");
const Agent = require("../models/agent.model");

const LIVE_COUNTER = env.retries; // attempts before agent will be considered dead
const INTERVAL_TIME = env.interval_time;
let agents = {}; // store the agents status.


/* Send a post request to agent every INTERVAL seconds. Data stored in the agent variable, which is exported */
let followAgentStatus = (agent) => {
    let start = new Date();
    let listenInterval = setInterval(() => {
        request.post(
            agent.url + '/isalive', {
                form: {
                    key: agent.key
                }
            }, (error, response, body) => {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    body = { res: e };
                }
                if (!error && response.statusCode === 200) {
                    agents[agent.key] = {};
                    agents[agent.key].alive = true;
                    agents[agent.key].hostname = body.info.hostname;
                    agents[agent.key].arch = body.info.arch;
                    agents[agent.key].freeSpace = humanize.bytes(body.info.freeSpace);
                    agents[agent.key].respTime = new Date() - start;
                    agents[agent.key].url = agent.url;
                    agents[agent.key].id = agent.id;
                    agents[agent.key].key = agent.key;
                    agents[agent.key].liveCounter = LIVE_COUNTER;
                } else if ((--agents[agent.key].liveCounter) === 0) {
                    agents[agent.key].alive = false;
                    if (!agents[agent.key].hostname) {
                        agents[agent.key].hostname = 'unknown';
                    }
                    if (!agents[agent.key].arch) {
                        agents[agent.key].arch = 'unknown';
                    }
                    if (!agents[agent.key].freeSpace) {
                        agents[agent.key].freeSpace = 0;
                    }
                    agents[agent.key].respTime = 0;
                }
            })
    }, INTERVAL_TIME);
    if (!agents[agent.key]) {
        agents[agent.key] = { alive: false, following: true };
        // agents[agent.key] = { intervalId: listenInterval, alive: false, following: true };
    }
};

/* stop following an agent */
let unfollowAgentStatus = (agentId) => {
    let agent = _.find(agents, (o) => {
        return o.id === agentId
    });
    // stop the check interval
    clearInterval(agents[agent.key].intervalId);
    agents[agent.key].alive = false;
    agents[agent.key].following = false;

};

function getAgentStatus() {
    return agents;
}

module.exports = {
    add: (agent) => {
        return Agent.findOne({ key: agent.key }).then(agentObj => {
            if (!agentObj) {
                return Agent.create(agent)
            }
            return Agent.findByIdAndUpdate(agentObj._id, agent)
        })
    },
    delete: (agentId) => {
        return Agent.remove({ _id: agentId })
    },
    /* filter the agents. if no query is passed, will return all agents */
    filter: (query = {}) => {
        return Agent.find(query)
    },
    /* send plugin file to an agent */
    installPluginOnAgent: (pluginPath, agent) => {
        return new Promise((resolve, reject) => {
            let formData = {
                file: {
                    value: fs.createReadStream(pluginPath),
                    options: {
                        filename: path.basename(pluginPath)
                    }
                }
            };
            // if there is no agents, send this plugin to all living agents
            if (!agent) {
                for (let i in agents) {
                    if (!agents[i].alive) {
                        continue;
                    }
                    request.post({
                        url: agents[i].url + "/registeragent",
                        formData: formData
                    });
                }
            } else {
                request.post({
                    url: agent.url + "/registeragent",
                    formData: formData
                });
                resolve();
            }
        })
    },
    /* restarting the agents live status, and updating the status for all agents */
    restartAgentsStatus: () => {
        agents = {};
        Agent.find({}).then(agents => {
            agents.forEach(agent => {
                followAgentStatus(agent);
            })
        })
    },
    followAgent: followAgentStatus,
    unfollowAgent: unfollowAgentStatus,
    /* update an agent */
    update: (agentId, agent) => {
        return Agent.findByIdAndUpdate(agentId, agent, { new: true });
    },
    /* exporting the agents status */
    agentsStatus: getAgentStatus
};