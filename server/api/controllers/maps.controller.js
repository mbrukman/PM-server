const winston = require("winston");

const mapsService = require("../services/maps.service");
const projectsService = require("../services/projects.service");
const mapsExecutionService = require("../services/map-execution.service");
const triggersService = require("../services/triggers.service");
const scheduledJobsService = require("../services/scheduled-job.service");
const hooks = require("../../libs/hooks/hooks");

module.exports = {
    /* archive a map */
    archive: (req, res) => {
        mapsService.archive([req.params.id]).then(map => {
            return res.status(204).send();
        }).catch(error => {
            winston.log('error', "Error archiving map", error);
            req.io.emit('notification', {
                title: 'Error',
                message: `Error creating map. Please try again`,
                type: 'error'
            });
            return res.status(500).send(error);
        });
    },
    create: (req, res) => {
        if (!req.body || Object.keys(req.body).length === 0 || !req.body.name) {
            return res.status(400).send("Bad request: No map was sent.");
        }

        hooks.hookPre('map-create', req).then(() => {
            mapsService.create(req.body).then((map) => {
                projectsService.addMap(req.body.project, map._id).then(() => {
                    req.io.emit('notification', {
                        title: 'Map created',
                        message: `Map ${map.name} was created`,
                        type: 'success'
                    });
                    res.json(map);
                });
            });
        }).catch((error) => {
            winston.log('error', "Error creating map", error);
            req.io.emit('notification', {
                title: 'Error',
                message: `Error creating map. Please try again`,
                type: 'error'
            });
            res.status(500).send(error);
        })
    },
    dashboard: (req, res) => {
        hooks.hookPre('map-dashboard', req).then(() => {
            return mapsExecutionService.list()
        }).then(executions => {
            executions = JSON.parse(JSON.stringify(executions));
            let filteredExecutions = executions.filter((o, index) => {
                let i = executions.findIndex((k) => {
                    return k.map.id === o.map.id;
                });
                return i === index;
            });
            return res.json(filteredExecutions);
        })
    },

    detail: (req, res) => {
        hooks.hookPre('map-detail', req).then(() => {
            return mapsService.get(req.params.id)
        }).then((map) => {
            return res.status(200).json(map);
        }).catch((error) => {
            winston.log('error', "Error finding map", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error finding map`, type: 'error' });
            return res.status(500).json(error);
        });
    },
    /* duplicating map with a structure */
    duplicateMap: (req, res) => {
        let dupMap;
        // find the map
        hooks.hookPre('map-duplicate', req).then(() => {
            return mapsService.filterByQuery({ _id: req.params.id });
        }).then((map) => {
            map = map[0];
            // copy the descriptive fields (not including archive) and create a new map.
            const newMap = {
                name: req.body.options.name,
                description: map.description
            };
            if(req.body.options.isChecked){
                newMap.agents = map.agents
            }
            return mapsService.create(newMap)
        }).then(duplicatedMap => {
            dupMap = duplicatedMap;
            return mapsService.getMapStructure(req.params.id, req.params.structureId)
        }).then(structure => {
            const newStructure = {
                links: structure.links,
                processes: structure.processes,
                configurations: structure.configurations,
                content: structure.content,
                code: structure.code,
                map: dupMap._id
            };
            return mapsService.createStructure(newStructure);
        }).then(() => {
            projectsService.addMap(req.body.projectId, dupMap._id).then(() => {
                req.io.emit('notification', {
                    title: 'Map duplicated',
                    message: `${dupMap.name} was duplicated`,
                    type: 'success'
                });
                return res.json(dupMap);
            });
        }).catch(error => {
            winston.log('error', 'Error duplicating map', error);
            return res.status(500).send(error);
        });
    },
    filter: (req, res) => {
        let query = req.query;
        hooks.hookPre('map-filter', req).then(() => {
            return mapsService.filter(query);
        }).then(data => {
            if (!data || data.totalCount === 0) {
                return res.status(204).send();
            }
            return res.json(data);
        }).catch((error) => {
            winston.log('error', "Error filtering maps", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error filtering maps`, type: 'error' });

            return res.status(500).json(error);
        });
    },

    /**
     * Deleting a map
     * @param req
     * @param res
     */
    mapDelete: (req, res) => {
        hooks.hookPre('map-delete', req).then(() => {
            return mapsService.mapDelete(req.params.id)
        }).then(() => {
            req.io.emit('notification', { title: 'Map deleted', message: ``, type: 'success' });
            return res.status(200).send();
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops', message: `Error deleting map`, type: 'error' });
            winston.log('error', "Error deleting map", error);
            return res.status(500).send(error);
        });
    },

    generate: (req, res) => {
        hooks.hookPre('map-generate', req).then(() => {
            return mapsService.generateMap(req.body);
        }).then((data) => {
            return res.status(200).send(data._id);
        }).catch((error) => {
            winston.log('error', "Error generating map", error);
            return res.status(500).send(error.message);
        });
    },
    getMapStructure: (req, res) => {
        hooks.hookPre('map-get-structure', req).then(() => {
            return mapsService.getMapStructure(req.params.id, req.params.structureId)
        }).then((structure) => {
            if (structure)
                return res.json(structure);
            return res.status(204).send();
        }).catch((error) => {
            winston.log('error', "Error finding map version", error);
            return res.status(500).json(error);
        });
    },
    /* update a map with new body
     * This will also call the projects service to update the maps of the relevant projects.
     * */
    update: (req, res) => {
        const mapId = req.params.id;
        hooks.hookPre('map-update', req).then(() => {
            return mapsService.update(mapId, req.body);
        }).then((map) => {
            console.log(map);
            return req.body.project ? projectsService.updateMap(mapId, req.body.project) : null;
        }).then(() => {
            return res.send('OK');
        }).catch((error) => {
            winston.log('error', "Error updating map", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error updating map`, type: 'error' });

            return res.status(500).json(error);
        });
    },

    /* structure */
    /* create new structure */
    createStructure: (req, res) => {
        let mapId = req.params.id;
        req.body.map = mapId;
        console.log(req.body);
        hooks.hookPre('map-create-structure', req).then(() => {
            return mapsService.createStructure(req.body)
        }).then(structure => {
            req.io.emit('notification', { title: 'Saved', message: `Map saved successfully`, type: 'success' });
            return res.json(structure)
        }).catch((error) => {
            winston.log('error', "Error creating map structure", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error saving map structure`, type: 'error' });

            return res.status(500).send(error);
        })
    },
    getStructureList: (req, res) => {
        hooks.hookPre('map-list-structures', req).then(() => {
            return mapsService.structureList(req.params.id, req.query.page);
        }).then(structures => {
            return res.json(structures);
        }).catch((error) => {
            winston.log('error', "Error finding map structures", error);
            return res.status(500).send(error);
        })
    },

    /* execution */
    /* cancel a pending executions */
    cancelPending: (req, res) => {
        hooks.hookPre('map-cancel-pending', req).then(() => {
            return mapsExecutionService.cancelPending(req.params.id, req.body.runId, req.io);
        }).then(() => {
            return res.send(req.body);
        }).catch((error) => {
            winston.log('error', "Error finding map structures", error);
            return res.status(500).send(error.message);
        })
    },
    /* get a list of ongoing executions */
    currentRuns: (req, res) => {
        hooks.hookPre('map-currentruns', req).then(() => {
            const executions = mapsExecutionService.executions;
            return res.json(Object.keys(executions).reduce((total, current) => {
                console.log(executions[current].map);
                total[current] = executions[current].map;
                return total;
            }, {}));
        });
    },
    /* execute a map */
    execute: (req, res) => {
        let agents, trigger, config;
        if (req.body) {
            agents = req.body.agents ? req.body.agents.split(',') : null;
            trigger = req.body.trigger;
            config = req.body.config ? req.body.config : req.query.config;
        }
        hooks.hookPre('map-execute', req).then(() => {
            return mapsExecutionService.execute(req.params.id, req.params.structure, null, req, config, trigger, agents);
        }).then((r) => {
            res.json(r);
        }).catch(error => {
            winston.log('error', "Error executing map", error);
            req.io.emit('notification', { title: 'Error executing map', message: error.message, type: 'error' });
            return res.status(500).send(error.message);
        });
    },

    /* stop map execution */
    stopExecution: (req, res) => {
        return res.json(mapsExecutionService.stop(req.params.id, req.params.runId, req.io));
    },

    logs: (req, res) => {
        hooks.hookPre('map-logs-list', req).then(() => {
            return mapsExecutionService.logs(req.params.id, req.params.resultId);
        }).then((results) => {
            res.json(results);
        }).catch(error => {
            winston.log('error', "Error getting execution results", error);
            return res.status(500).json(error);
        });
    },

    results: (req, res) => {
        hooks.hookPre('map-results-list', req).then(() => {
            return mapsExecutionService.results(req.params.id)
        }).then((results) => {
            res.json(results);
        }).catch(error => {
            winston.log('error', "Error getting execution results", error);
            req.io.emit('notification', {
                title: 'Whoops...',
                message: `Error getting execution results`,
                type: 'error'
            });

            return res.status(500).json(error);
        });
    },

    resultDetail: (req, res) => {
        hooks.hookPre('map-results-detail').then(() => {
            return mapsExecutionService.detail(req.params.resultId);
        }).then(result => {
            if (!result) {
                res.status(204);
            }
            return res.json(result);
        }).catch(error => {
            winston.log('error', "Error getting execution result", error);
            req.io.emit('notification', {
                title: 'Whoops...',
                message: `Error getting execution result`,
                type: 'error'
            });

            return res.status(500).json(error);
        });
    },

    /* triggers */
    /* create trigger */
    triggerCreate: (req, res) => {
        hooks.hookPre('trigger-create', req).then(() => {
            return triggersService.create(req.params.id, req.body)
        }).then(trigger => {
            req.io.emit('notification', {
                title: 'Trigger saved',
                message: `${trigger.name} saved successfully`,
                type: 'success'
            });

            return res.json(trigger);
        }).catch((error) => {
            winston.log('error', "Error getting map's triggers", error);
            return res.status(500).json(error);
        });
    },
    /* delete a trigger */
    triggerDelete: (req, res) => {
        hooks.hookPre('trigger-delete', req).then(() => {
            return triggersService.delete(req.params.triggerId);
        }).then(() => {
            req.io.emit('notification', {
                title: 'Trigger deleted',
                message: ``,
                type: 'success'
            });

            return res.send("OK");
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Error deleting',
                message: `We couldn't delete this trigger`,
                type: 'error'
            });
            winston.log('error', "Error getting map's triggers", error);
            return res.status(500).json(error);
        });
    },
    /* get triggers list for given map */
    triggersList: (req, res) => {
        hooks.hookPre('trigger-list', req).then(() => {
            return triggersService.list(req.params.id)
        }).then(triggers => {
            return res.json(triggers);
        }).catch((error) => {
            winston.log('error', "Error getting map's triggers", error);
            return res.status(500).json(error);
        });
    },
    /* update a trigger */
    triggerUpdate: (req, res) => {
        hooks.hookPre('trigger-update', req).then(() => {
            return triggersService.update(req.params.triggerId, req.body)
        }).then(trigger => {
            req.io.emit('notification', {
                title: 'Trigger saved',
                message: `${trigger.name} saved successfully`,
                type: 'success'
            });

            return res.json(trigger);
        }).catch((error) => {
            winston.log('error', "Error updating triggers", error);
            return res.status(500).json(error);
        });
    },

    /* scheduled jobs
     * TODO: change to standalone plugin (that is old implantation)
     * */
    createJob: (req, res) => {
        hooks.hookPre('scheduledJob-create', req).then(() => {
            return scheduledJobsService.create(req.body)
        }).then((job) => {
            return res.json(job);
        }).catch((error) => {
            winston.log('error', "Error creating a new job ", error);
            return res.status(500).send(error);
        });
    },
    deleteJob: (req, res) => {
        hooks.hookPre('scheduledJob-delete', req).then(() => {
            return scheduledJobsService.delete(req.params.jobId)
        }).then(() => {
            return res.status(200).send('OK');
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    filterJobs: (req, res) => {
        hooks.hookPre('scheduledJob-list', req).then(() => {
            return scheduledJobsService.filter();
        }).then(jobs => {
            return res.json(jobs)
        }).catch((error) => {
            winston.log('error', "Error finding jobs ", error);
            return res.status(500).send(error);
        });
    },
    getFutureJobs: (req, res) => {
        hooks.hookPre('scheduledJob-list', req).then(() => {
            return scheduledJobsService.getFutureJobs();
        }).then((jobs) => {
            res.send(jobs);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    updateJob: function (req, res) {
        hooks.hookPre('scheduledJob-update', req).then(() => {
            return scheduledJobsService.update(req.body);
        }).then((job) => {
            return res.json(job[0]);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    }
};