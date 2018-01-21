const scheduler = require('node-schedule');
const mapsService = require("../services/maps.service");
const mapsExecutionService = require("../services/map-execution.service");
const ScheduledJob = require("../models/scheduled-job.model");

let jobs = {};
let socket;

module.exports = {
    /*
     * adding scheduled job
     * we are using node-scheduler for this.
     * every job is saved in the jobs object, which will allow us to conveniently cancel it (see remove jobs);
     * */
    addScheduledJob: (job) => {

        jobs[job._id] = scheduler.scheduleJob((job.datetime || job.cron), function () {
            mapsExecutionService.execute(job.map, -1, 0, socket); // TODO: it should pass the socket
        });
    },
    /* creating new job */
    create: (job) => {
        return ScheduledJob.create(job).then((jobObj) => {
            module.exports.addScheduledJob(jobObj);
            return module.exports.filter({ _id: jobObj._id }, true)
        });
    },
    /* deleting job object from db and removing scheduled job if exists */
    delete: (jobId) => {
        module.exports.removeScheduledJob(jobId);

        return ScheduledJob.remove({ _id: jobId });
    },
    filter: (query = {}, one = false) => {
        return one ? ScheduledJob.findOne(query).populate('map') : ScheduledJob.find(query).populate('map')
    },
    /* return jobs that should happen in the future */
    getFutureJobs: () => {
        return ScheduledJob.find().where({
            $or: [
                { datetime: { $gt: new Date() } },
                { cron: { $exists: true } }
            ]
        });
    },
    /* updating job in db and in scheduled jobs */
    update: (job) => {
        return ScheduledJob.findByIdAndUpdate(job._id, job, { new: true }).then((jobObj) => {
            module.exports.removeScheduledJob(job._id);
            module.exports.addScheduledJob(jobObj);
            return jobObj
        });
    },
    /* removing a scheduled job */
    removeScheduledJob: (jobId) => {
        if (!jobs[jobId])
            return;
        jobs[jobId].cancel();
        delete jobs[jobId];
    },

    /*
     loading scheduled jobs and set the socket
     * this function is called on bootstrap
     * */
    loadJobs: (app) => {
        socket = app.io;
        module.exports.getFutureJobs().then((jobs) => {
            jobs.forEach(function (job) {
                module.exports.addScheduledJob(job);
            });
        }).catch((error) => {
        });
    }
};