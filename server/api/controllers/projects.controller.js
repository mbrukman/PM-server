const winston = require("winston");
const archiveService = require('../services/archive.service')
const projectsService = require("../services/projects.service");
const hooks = require("../../libs/hooks/hooks");

module.exports = {
    // archive a project
    archive: (req, res) => {
        hooks.hookPre('project-archive', req).then(() => {
            return archiveService.archiveProject(req.params.id, req.body.isArchive);
        }).then(() => {
            req.io.emit('notification', {
                title: 'Archived',
                message: ``,
                type: 'success'
            });
            return res.status(204).send();
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Oh no..',
                message: `Error archiving project`,
                type: 'error'
            });
            winston.log('error', "Error archiving project", error);
            res.status(500).send(error);
        });
    },
    /* add a new project */
    create: (req, res) => {
        hooks.hookPre('project-create', req).then(() => {
            return projectsService.create(req.body);
        }).then(project => {
            req.io.emit('notification', {
                title: 'Project created',
                message: `${project.name} created successfuly`,
                type: 'success'
            });
            return res.json(project);
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Oh no..',
                message: `There was an error creating this project`,
                type: 'error'
            });
            winston.log('error', "Error creating new project", error);
            res.status(500).send(error);
        });
    },

    /* add a map to project */
    addMap: (req, res) => {
        let projectId = req.params.projectId;
        let mapId = req.params.mapId;
        hooks.hookPre('project-add-map', req).then(() => {
            return projectsService.addMap(projectId, mapId);
        }).then(project => {
            res.json(project);
        }).catch((error) => {
            winston.log('error', "Error adding map to project", error);
            res.status(500).send(error);
        });
    },

    /* get project details */
    detail: (req, res) => {
        hooks.hookPre('project-detail', req).then(() => {
            return projectsService.detail(req.params.id,req.body);
        }).then(project => {
            res.json(project);
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error getting project details`, type: 'error' });
            winston.log('error', "Error getting project's details", error);
            res.status(500).send(error);
        });
    },

    /* delete a project */
    delete: (req, res) => {
        hooks.hookPre('project-delete', req).then(() => {
            return projectsService.delete(req.params.id);
        }).then(() => {
            req.io.emit('notification', {
                title: 'Project deleted',
                message: ``,
                type: 'success'
            });

            return res.status(200).send("OK");
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error deleting project`, type: 'error' });

            winston.log('error', "Error deleting map to project", error);
            res.status(500).send(error);
        });
    },

    /* filter projects */
    filter: (req, res) => {
        hooks.hookPre('project-filter', req).then(() => {
            return projectsService.filter(req.body);
        }).then(data => {
            return res.json(data);
        }).catch((error) => {
            req.io.emit('notification', { title: 'Whoops..', message: `Error getting projects list`, type: 'error' });

            winston.log('error', "Error creating new project", error);
            res.status(500).send(error);
        })
    },

    /* update a project */
    update: (req, res) => {
        let project = req.body;
        project._id = req.params.id;
        hooks.hookPre('project-update', req).then(() => {
            return projectsService.update(req.body);
        }).then(project => {
            req.io.emit('notification', {
                title: 'Project updated',
                message: `${project.name} updated successfully`,
                type: 'success'
            });

            res.json(project);
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Whoops..',
                message: `We couldn't update the project`,
                type: 'error'
            });
            winston.log('error', "Error updating project", error);
            res.status(500).send(error);
        })
    }

};