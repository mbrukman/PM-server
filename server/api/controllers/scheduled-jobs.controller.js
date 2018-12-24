const winston = require("winston");
const scheduledJobsService = require("../services/scheduled-job.service");
const hooks = require("../../libs/hooks/hooks");

module.exports = {
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
}