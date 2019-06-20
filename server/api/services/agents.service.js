const request = require("request");
const fs = require("fs");
const path = require("path");

const winston = require("winston");
const _ = require("lodash");
const humanize = require("../../helpers/humanize");
const env = require("../../env/enviroment");
const Map = require("../models/map.model");
const Agent = require("../models").Agent;
const Group = require("../models").Group;
const socketService = require('./socket.service');

let agents = {}; // store the agents status.


const FILTER_TYPES = Object.freeze({
    gte: 'gte',
    gt: 'gt',
    equal: 'equal',
    contains: 'contains',
    lte: 'lte',
    lt: 'lt'
});



function  updateClientAgentStatus(){
    const agentsStatuses =  _getAgentsStatuses()
    socketService.emit('agentsStatus', agentsStatuses)
}

function _getAgentsStatuses(){
        const agentsCopy = _.cloneDeep(agents);
        const statuses = Object.keys(agentsCopy)
            .reduce((total, current) => {
                current = _.cloneDeep(agentsCopy[current]);
                if (!current.hasOwnProperty('id')) {
                    return total;
                }
                delete current.key;
                delete current.intervalId;
                delete current.socket;
                total[current._id] = current;
                return total;
            }, {});
            return statuses
}

function _updateAgentStatus(agentKey, res){
    agents[agentKey].hostname = res.hostname;
    agents[agentKey].arch = res.arch;
    agents[agentKey].freeSpace = humanize.bytes(res.freeSpace);
    agents[agentKey].installed_plugins = res.installed_plugins;
    agents[agentKey].alive = true

}

/* Send a post request to agent every INTERVAL seconds. Data stored in the agent variable, which is exported */
let initAgent =  (agent) => {
    if(agents[agent.key]){return}
    agents[agent.key] = agent.toJSON();
    agents[agent.key].alive = false;
    setDefaultUrl(agent);
};


function getAgentStatus() {
    return agents;
}


function setDefaultUrl(agent) {
    return new Promise((resolve, reject) => {
        request.post(agent.url + '/api/status', { form: { key: agent.key } }, function (error, response, body) {
            if (error) {
                agents[agent.key].defaultUrl = agent.publicUrl;
            } else {
                agents[agent.key].defaultUrl = agent.url;
            }
            resolve();
        });
    });
}

/**
 * Evaluates group dynamic agents and constant agents.
 * @param group
 * @returns {any}
 */
function evaluateGroupAgents(group) {
    group = JSON.parse(JSON.stringify(group)); // make sure its not a mongoose document
    
    let agentsCopy = {};
    Object.keys(agents).map(key=>{
        let a = Object.assign({},agents[key]);
        delete a.socket;
        agentsCopy[key] = a;
    })
    
    let filteredAgents = Object.keys(agents).map(key => agentsCopy[key]);
    group.filters.forEach(filter => {
        filteredAgents = evaluateFilter(filter, filteredAgents);
    });

    // array of the constant agents attached to the group
    const constAgents = group.agents.reduce((total, current) => {
        const agent = Object.keys(agentsCopy).find(key => {
            return agentsCopy[key].id === current;
        });
        if (agent) {
            total.push(agentsCopy[agent]);
        }
        return total;
    }, []);


    filteredAgents = [...filteredAgents, ...constAgents];
    return filteredAgents.reduce((total, current) => {
        total[current.key] = current;
        return total;
    }, {});
}

/**
 * Evaluates group's filter on given agents
 * @param filter
 * @param agents
 * @returns array of filtered agents
 */
function evaluateFilter(filter, agents) {
    return agents.filter(o => {
        if (!o[filter.field]) {
            return false;
        }
        switch (filter.filterType) {
            case FILTER_TYPES.equal: {
                if (!o[filter.field]) {
                    return false;
                }
                return o[filter.field].toString() === filter.value;
            }
            case FILTER_TYPES.contains: {
                return o[filter.field].includes(filter.value);
            }

            case FILTER_TYPES.gt: {
                try {
                    return parseFloat(o[filter.field]) > parseFloat(filter.value);
                } catch (e) {
                    return false;
                }
            }

            case FILTER_TYPES.gte: {
                try {
                    return parseFloat(o[filter.field]) >= parseFloat(filter.value);
                } catch (e) {
                    return false;
                }
            }

            case FILTER_TYPES.lt: {
                try {
                    return parseFloat(o[filter.field]) < parseFloat(filter.value);
                } catch (e) {
                    return false;
                }
            }

            case FILTER_TYPES.lte: {
                try {
                    return parseFloat(o[filter.field]) <= parseFloat(filter.value);
                } catch (e) {
                    return false;
                }
            }

            default: {
                return false;
            }
        }
    });
}

/**
 * Adding a socketid to agents statuses (if agentkey exists)
 * @param agentKey
 * @param socket
 */
async function addSocketIdToAgent(agentKey, socket) {
    if (!agents.hasOwnProperty(agentKey)) { 

        let agent = await Agent.findOne({ key: agentKey })
        if(!agent){return} 
        agents[agentKey] = agent.toJSON();
        
    }
    agents[agentKey].socket = socket;
    agents[agentKey].alive = true
    updateClientAgentStatus()

}

function sendRequestToAgent(options, agent) {
    return new Promise((resolve, reject) => {
        options = Object.assign({},options);
        options.uri = agents[agent.key].defaultUrl + options.uri;
        options.method = options.method || 'POST';

        if (options.body) {
            options.json = true;
            options.body.key = agent.key;
        }
        else if (options.formData)
            options.formData.key =  agent.key;
        

        winston.log('info', "Sending request to agent");
        request(options, function (error, response, body) {
            if (error) { return reject(error) }
            resolve(response)
        })
    })
}


function deleteAgentFromMap(agentId){
    return Map.updateMany({agents:{$elemMatch:{$eq:agentId}}},{$pull:{agents:{$in:[agentId]}}})
}



module.exports = {

  getAgentStatuses: _getAgentsStatuses,

    add: (agent) => {
        return Agent.findOne({ key: agent.key }).then(agentObj => {
            if (!agentObj) {
                return Agent.create(agent)
            }
            return Agent.findByIdAndUpdate(agentObj._id, { $set: { url: agent.url, publicUrl: agent.publicUrl,isDeleted:false } });
        }).then(agent => {
            initAgent(agent)
            return agent
        })
    },
    getByKey: (agentKey) => {
        agents[agentKey].key = agentKey;
        return agents[agentKey];
    },
    // get an object of installed plugins and versions on certain agent.
    checkPluginsOnAgent: (agent) => {
        return new Promise((resolve, reject) => {
            console.log(" checkPluginsOnAgent", agents[agent.key].defaultUrl);
            request.post(agents[agent.key].defaultUrl + '/api/plugins', { form: { key: agent.key } }, function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    resolve('{}');
                }
                resolve(body);

            });
        });
    },
    delete: (agentId) => {
        return Agent.findByIdAndUpdate(agentId,{ $set: { "isDeleted": "true" } }).then(async(agent) => {
            let deleteAgent = await deleteAgentFromMap(agentId)
            if(agents[agent.key]){
                clearInterval(agents[agent.key].intervalId)
            }
            delete agents[agent.key];
        })
    },
    /* filter the agents. if no query is passed, will return all agents */
    filter: (query = {}) => {
        query.isDeleted = {$ne:true};
        return Agent.find(query);
    },
    /* send plugin file to an agent */
    installPluginOnAgent: (pluginPath, agent) => {
        let formData = {
            file: {
                value: fs.createReadStream(pluginPath),
                options: {
                    filename: path.basename(pluginPath),
                }
            }
        };
        // if there is no agents, send this plugin to all living agents
        var requestOptions = {
            uri: "/api/plugins/install",
            formData: formData
        };

        if (!agent) {
            var requests = []
            for (let i in agents) {
                if (!agents[i].alive) {
                    continue;
                }
                requests.push(sendRequestToAgent(requestOptions, agents[i]));
            }
            return Promise.all(requests);
        } else {
            return Promise.all([sendRequestToAgent(requestOptions, agent)]);
        }
    },

    /**
     * 
     * @param {string} name 
     * @param {Agent} agent 
     * @returns {Promise<result[]>}
     */
    deletePluginOnAgent: function (name, agent) {
        // if there is no agents, send this plugin to all living agents
        var requestOptions = {
            body: { name: name },
            uri: "/api/plugins/delete"
        }

        if (!agent) {
            var requests = [];
            for (let i in agents) {
                if (!agents[i].alive) {
                    continue;
                }

                requests.push(sendRequestToAgent(requestOptions, agents[i]));
            }
            return Promise.all(requests);
        } else {
            return Promise.all([sendRequestToAgent(requestOptions, agent)]);
        }
    },

    /* restarting the agents live status, and updating the status for all agents */
    restartAgentsStatus: () => {
        agents = {};
        Agent.find({}).then(agents => {
            agents.forEach(agent => {
                initAgent(agent);
            })
        })
    },
    setDefaultUrl: setDefaultUrl,
    followAgent: initAgent,
    /* update an agent */
    update: (agentId, agent) => {
        return Agent.findByIdAndUpdate(agentId, agent, { new: true });
    },

    updateGroup: (groupId, groupUpdated) => {

        return Group.findOne({_id:groupId}).then((group => {
            group.name = groupUpdated.name
            group.filters = groupUpdated.filters
            return group.save();
        }))

    },
    /* exporting the agents status */
    agentsStatus: getAgentStatus,

    /* Groups */
    /**
     * Creaqting new group object
     * @param group
     * @returns {group}
     */
    createGroup: (group) => {
        return Group.create(group);
    },

    groupsList: (query = {}) => {
        return Group.find(query);
    },

    /**
     * Adding agents to group
     * @param groupId
     * @param agentsId
     * @returns {Query}
     */
    addAgentToGroup: (groupId, agentsId) => {
        return Group.findByIdAndUpdate(groupId, { $addToSet: { agents: { $each: agentsId } } }, { new: true });
    },

    /**
     * Adding filters to group
     * @param groupId
     * @param filters
     * @returns {Query}
     */
    addGroupFilters: (groupId, filters) => {
        return Group.findByIdAndUpdate(groupId, { '$set': { 'filters': filters } }, { new: true });
    },

    /**
     * Delete a group.
     * @param groupId
     * @returns {Query}
     */
    deleteGroup: (groupId) => {
        return Group.findByIdAndRemove(groupId);
    },

    /**
     * Returning a group by it's id
     * @param groupId
     * @returns {Query}
     */
    groupDetail: (groupId) => {
        return Group.findById(groupId);
    },

    evaluateGroupAgents: evaluateGroupAgents,

    /**
     * Removes agents ref from groups.
     * @param agentId
     */
    removeAgentFromGroups: (agentId) => {
        return Group.update({ agents: { $in: [agentId] } }, { $pull: { agents: { $in: [agentId] } } })
    },


    deleteFilterFromGroup: (groupId,index) => {
        return Group.findOne({_id:groupId}).then((group) => {
            group.filters.splice(index,1);
            return group.save();
        })
    },

    /**
     * Removing an agent from a group
     * @param groupId
     * @param agentId
     * @returns {Query|*}
     */
    removeAgentFromGroup: (groupId, agentId) => {
        return Group.findOne({_id:groupId}).then((group) => {
            group.agents.splice(group.agents.findIndex(agent => agent.id == agentId),1)
            return group.save();
        })
    },
    /**
     * Establish a room for agents
     * @param socket
     */
    establishSocket: (socket) => {
        const nsp = socket.of('/agents');
        nsp.on('connection', function (socket) {
            let agentKey = socket.client.request._query.key

            winston.log("info", "Agent log");
            // agent send key on connection string
            addSocketIdToAgent(agentKey, socket);

            socket.on('status', res=>{
                if(!agents[agentKey]){return} 
                _updateAgentStatus(agentKey, res)
            })

            socket.on('disconnect',() => {
                agents[agentKey].alive = false;
                updateClientAgentStatus()
            });
    
        });

       
    }

};