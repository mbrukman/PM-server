const async = require("async");
const winston = require("winston");

const agentsService = require("../services/agents.service");
const pluginsService = require("../services/plugins.service");
const hooks = require("../../libs/hooks/hooks");

module.exports = {
    /* The function will be called every time an agent is registering to the server (agent startup) */
    add: (req, res) => {
        winston.log('info', "Add new agent");
        let agent;
        let plugins;
        hooks.hookPre('agent-create', req).then(() => {
            return agentsService.add(req.body);
        }).then(agentObj => {
            // add agent to follow list
            agent = agentObj;
            agentsService.followAgent(agent);
            // deploy all plugins on agents
            return pluginsService.filterPlugins({ active: true, type: 'executer' });
        }).then(activePlugins => {
            plugins = activePlugins;
            return agentsService.setDefaultUrl(agent);
        }).then(() => {
            return agentsService.checkPluginsOnAgent(agent);
        }).then(agentsPlugin => {
            agentsPlugin = JSON.parse(agentsPlugin);
            // the agent plugin returns an object with keys as plugin names and version number as version: { 'cmd': '0.0.1' }
            const filesPaths = plugins.reduce((total, current) => {
                if (current.version !== agentsPlugin[current.name]) {
                    total.push(current.file);
                }
                return total;
            }, []);

            if (!filesPaths || filesPaths.length === 0) {
                return res.status(204).send();
            }
            async.each(filesPaths,
                function (filePath, callback) {
                    agentsService.installPluginOnAgent(filePath, agent).then(() => {
                    }).catch((e) => {
                        winston.log('error', "Error installing on agent", e);
                    });
                    callback();
                },
                function (error) {
                    if (error) {
                        winston.log('error', "Error installing plugins on agent", error);
                    }
                    return res.status(204).send();
                });
        });
    },
    /* Delete an agent */
    delete:
        (req, res) => {
            hooks.hookPre('agent-delete').then(() => {
                return agentsService.delete(req.params.id)
            }).then(() => {
                req.io.emit('notification', { title: 'Agent deleted', message: ``, type: 'success' });
                return res.status(200).send('OK');
            }).catch(error => {
                req.io.emit('notification', { title: 'Whoops...', message: `Error deleting agent`, type: 'error' });
                winston.log('error', "Error deleting agent", error);
                return res.status(500).send(error);
            });
            agentsService.unfollowAgent(req.params.id);
        },
    /* Get all agents list */
    list:
        (req, res) => {
            hooks.hookPre('agent-list').then(() => {
                return agentsService.filter({})
            }).then(agents => {
                res.json(agents);
            }).catch(error => {
                req.io.emit('notification', { title: 'Whoops...', message: `Error finding agents`, type: 'error' });
                winston.log('error', "Error filtering agents", error);
                return res.status(500).send(error);
            });
        },
    /* Get agents status */
    status:
        (req, res) => {
            hooks.hookPre('agent-status-list', req).then(() => {
                let status = agentsService.agentsStatus();
                if (status) {
                    for (let i in status) {
                        delete status[i].intervalId;
                        return res.json(status);
                    }
                }
                return res.send('');
            }).catch(error => {
                winston.log('error', "Error getting agents status", error);
                return res.status(500).send();
            })
        },
    /* update an agent */
    update: (req, res) => {
        let agent = req.body;
        delete agent._id;
        hooks.hookPre('agent-update', req).then(() => {
            return agentsService.update(req.params.id, agent);
        }).then((agent) => {
            req.io.emit('notification', {
                title: 'Update success',
                message: `${agent.name} updated successfully`,
                type: 'success'
            });
            return res.json(agent);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error updating agent`, type: 'error' });
            winston.log('error', "Error updating agent", error);
            res.status(500).send(error);
        });
    },

    /* Groups */

    createGroup: (req, res) => {
        hooks.hookPre('group-create', req).then(() => {
            return agentsService.createGroup(req.body)
        }).then((group) => {
            return res.json(group);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error creating group`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    },

    groupsList: (req, res) => {
        console.log("LIST");
        hooks.hookPre('group-list', req).then(() => {
            return agentsService.groupsList(req.body);
        }).then((groups) => {
            return res.json(groups);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error finding groups`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    },

    deleteGroup: (req, res) => {
        hooks.hookPre('group-list', req).then(() => {
            return agentsService.deleteGroup(req.params.id);
        }).then(() => {
            return res.send(req.params.id);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error deleting group`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    },

    groupDetail: (req, res) => {
        hooks.hookPre('group-list', req).then(() => {
            return agentsService.groupDetail(req.params.id);
        }).then((group) => {
            return res.json(group);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error adding agent to group`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    },

    addAgentToGroup: (req, res) => {
        hooks.hookPre('group-list', req).then(() => {
            return agentsService.addAgentToGroup(req.params.id, req.body);
        }).then((group) => {
            req.io.emit('notification', { title: 'Excellent', message: `Agent was added to group`, type: 'success' });
            return res.json(group);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error adding agent to group`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    },

    addGroupFilters: (req, res) => {
        hooks.hookPre('group-add-filters', req).then(() => {
            return agentsService.addGroupFilters(req.params.id, req.body);
        }).then((group) => {
            req.io.emit('notification', { title: 'Yay!', message: `Filters updated`, type: 'success' });
            return res.json(group);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops...', message: `Error creating group`, type: 'error' });
            winston.log('error', "Error creating group", error);
            res.status(500).send(error);
        });
    }
}
;
