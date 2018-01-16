let mapsService = require("../services/maps.service");
let projectsService = require("../services/projects.service");
let mapsExecutionService = require("../services/map-execution.service");
let triggersService = require("../services/triggers.service");
let scheduledJobsService = require("../services/scheduled-job.service");


module.exports = {
    /* archive a map */
    archive: (req, res) => {
        mapsService.archive([req.params.id]).then(map => {
            return res.status(204).send();
        }).catch(error => {
            console.log("Error archiving map", error);
            req.io.emit('notification', {
                title: 'Error',
                message: `Error creating map. Please try again`,
                type: 'error'
            });
            return res.status(500).send(error);
        });
    },
    create: (req, res) => {
        // create the map object.
        if (!req.body || Object.keys(req.body).length === 0 || !req.body.name) {
            return res.status(400).send("Bad request: No map was sent.");
        }
        mapsService.create(req.body).then((map) => {
            projectsService.addMap(req.body.project, map._id).then(() => {
                req.io.emit('notification', {
                    title: 'Map created',
                    message: `Map ${map.name} was created`,
                    type: 'success'
                });
                res.json(map);
            });
        }).catch((error) => {
            console.log("Error creating map: ", error);
            req.io.emit('notification', {
                title: 'Error',
                message: `Error creating map. Please try again`,
                type: 'error'
            });

            res.status(500).send(error);
        })
    },

    detail: (req, res) => {
        mapsService.get(req.params.id).then((map) => {
            return res.status(200).json(map);
        }).catch((error) => {
            console.log("Error finding map: ", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error finding map`, type: 'error' });
            return res.status(500).json(error);
        });
    },
    /* duplicating map with a structure */
    duplicateMap: (req, res) => {
        let dupMap;
        // find the map
        mapsService.filterByQuery({ _id: req.params.id }).then((map) => {
            map = map[0];
            // copy the descriptive fields (not including archive) and create a new map.
            const newMap = {
                name: map.name,
                description: map.description,
                licence: map.licence
            };
            return mapsService.create(newMap)
        }).then(duplicatedMap => {
            dupMap = duplicatedMap;
            return mapsService.getMapStructure(req.params.id, req.params.structureId)
        }).then(structure => {
            const newStructure = {
                links: structure.links,
                processes: structure.processes,
                attributes: structure.attributes,
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
            console.log(error);
            return res.status(500).send(error);
        });
    },
    filter: (req, res) => {
        let query = req.query;
        mapsService.filter(query).then(data => {
            if (!data || data.totalCount === 0) {
                return res.status(204).send();
            }
            return res.json(data);
        }).catch((error) => {
            console.log("Error filtering maps: ", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error filtering maps`, type: 'error' });

            return res.status(500).json(error);
        });
    },
    getMapStructure: (req, res) => {
        mapsService.getMapStructure(req.params.id, req.params.structureId).then((structure) => {
            if (structure)
                return res.json(structure);
            return res.status(204).send();
        }).catch((error) => {
            console.log("Error finding map version: ", error);
            return res.status(500).json(error);
        });
    },
    /* update a map with new body
     * This will also call the projects service to update the maps of the relevant projects.
     * */
    update: (req, res) => {
        const mapId = req.params.id;
        mapsService.update(mapId, req.body).then((map) => {
            console.log(map);
            return projectsService.updateMap(mapId, req.body.project);
        }).then(() => {
            return res.send('OK');
        }).catch((error) => {
            console.log("Error updating map: ", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error updating map`, type: 'error' });

            return res.status(500).json(error);
        });
    },

    /* structure */
    /* create new structure */
    createStructure: (req, res) => {
        let mapId = req.params.id;
        req.body.map = mapId;
        mapsService.createStructure(req.body).then(structure => {
            req.io.emit('notification', { title: 'Saved', message: `Map saved successfully`, type: 'success' });
            res.json(structure)
        }).catch((error) => {
            console.log("Error creating map structure: ", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error saving map structure`, type: 'error' });

            res.status(500).send(error);
        })
    },
    getStructureList: (req, res) => {
        mapsService.structureList(req.params.id).then(structures => {
            res.json(structures)
        }).catch((error) => {
            console.log("Error finding map structures: ", error);
            res.status(500).send(error);
        })
    },

    /* execution */
    /* execute a map */
    execute: (req, res) => {
        mapsExecutionService.execute(req.params.id, null, null, req).then((r) => {
            res.json(r);
        }).catch(error => {
            console.log("Error executing map: ", error);
            req.io.emit('notification', { title: 'Whoops...', message: `Error executing map`, type: 'error' });

            return res.status(500).json(error);
        });
    },

    logs: (req, res) => {
        mapsExecutionService.logs(req.params.id).then((results) => {
            res.json(results);
        }).catch(error => {
            console.log("Error getting execution results: ", error);
            return res.status(500).json(error);
        });
    },

    results: (req, res) => {
        mapsExecutionService.results(req.params.id).then((results) => {
            res.json(results);
        }).catch(error => {
            console.log("Error getting execution results: ", error);
            req.io.emit('notification', {
                title: 'Whoops...',
                message: `Error getting execution results`,
                type: 'error'
            });

            return res.status(500).json(error);
        });
    },

    /* triggers */
    /* create trigger */
    triggerCreate: (req, res) => {
        triggersService.create(req.params.id, req.body).then(trigger => {
            req.io.emit('notification', {
                title: 'Trigger saved',
                message: `${trigger.name} saved successfully`,
                type: 'success'
            });

            return res.json(trigger);
        }).catch((error) => {
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* delete a trigger */
    triggerDelete: (req, res) => {
        triggersService.delete(req.params.triggerId).then(() => {
            req.io.emit('notification', {
                title: 'Trigger deleted',
                message: `${trigger.name} saved successfully`,
                type: 'success'
            });

            return res.send("OK");
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Error deleting',
                message: `We couldn't delete this trigger`,
                type: 'error'
            });
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* get triggers list for given map */
    triggersList: (req, res) => {
        triggersService.list(req.params.id).then(triggers => {
            return res.json(triggers);
        }).catch((error) => {
            console.log("Error getting map's triggers: ", error);
            return res.status(500).json(error);
        });
    },
    /* update a trigger */
    triggerUpdate: (req, res) => {
        triggersService.update(req.params.triggerId, req.body).then(trigger => {
            req.io.emit('notification', {
                title: 'Trigger saved',
                message: `${trigger.name} saved successfully`,
                type: 'success'
            });

            return res.json(trigger);
        }).catch((error) => {
            console.log("Error updating triggers: ", error);
            return res.status(500).json(error);
        });
    },

    /* scheduled jobs
     * TODO: change to standalone plugin (that is old implantation)
     * */
    createJob: (req, res) => {
        scheduledJobsService.create(req.body).then((job) => {
            return res.json(job);
        }).catch((error) => {
            console.log("Error creating a new job ", error);
            return res.status(500).send(error);
        });
    },
    deleteJob: (req, res) => {
        scheduledJobsService.delete(req.params.jobId).then(() => {
            return res.status(200).send('OK');
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    filterJobs: (req, res) => {
        scheduledJobsService.filter().then(jobs => {
            return res.json(jobs)
        }).catch((error) => {
            console.log("Error finding jobs ", error);
            return res.status(500).send(error);
        });
    },
    getFutureJobs: (req, res) => {
        scheduledJobsService.getFutureJobs().then((jobs) => {
            res.send(jobs);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    },
    updateJob: function (req, res) {
        scheduledJobsService.update(req.body).then((job) => {
            return res.json(job[0]);
        }).catch((error) => {
            return res.status(500).send(error);
        });
    }
};