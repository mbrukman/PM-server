const { scheduleJob } = require("node-schedule");
const mapsExecutionService = require("../services/map-execution.service");
const ScheduledJob = require("../models").ScheduledJob;
const winston = require("winston");

class ScheduledJobService {
  constructor() {
    this.socket = null;
    this.scheduledJob = {};
  }
  /*
   * adding scheduled job
   * we are using node-scheduler for this.
   * */
  addScheduledJob(job) {
    this.scheduledJob[job._id] = scheduleJob(job.datetime || job.cron, () => {
      ScheduledJob.findById(job._id).then(async jobObj => {
        if (!jobObj) {
          return;
        }
        if (jobObj.skip) {
          await ScheduledJob.findByIdAndUpdate(job._id, {
            $set: { skip: false }
          }).then(() => {
            console.log("Removed skip from job");
          });
          return;
        }
        const configuration = {
          config: job.configuration
        };
        mapsExecutionService
          .execute(
            job.map,
            null,
            this.socket,
            configuration,
            "Started by schedules task"
          )
          .then(res => {
            console.log(res);
          })
          .catch(err => {
            winston.log("error", err);
          });
      });
    });
  }
  /* creating new job */
  create(job) {
    return ScheduledJob.create(job).then(jobObj => {
      this.addScheduledJob(jobObj);
      return this.filter({ _id: jobObj._id }, true);
    });
  }
  /* deleting job object from db and removing scheduled job if exists */
  async delete(jobId) {
    this.removeScheduledJob(jobId);

    return ScheduledJob.remove({ _id: jobId });
  }
  filter(query = {}, one = false) {
    return one
      ? ScheduledJob.findOne(query).populate("map")
      : ScheduledJob.find(query).populate("map");
  }
  /* return jobs that should happen in the future */
  getFutureJobs() {
    return ScheduledJob.find().where({
      $or: [{ datetime: { $gt: new Date() } }, { cron: { $exists: true } }]
    });
  }
  /* updating job in db and in scheduled jobs */
  update(job) {
    return ScheduledJob.findByIdAndUpdate(job._id, job, { new: true })
      .then(jobObj => {
        this.removeScheduledJob(job._id);
        return jobObj;
      })
      .then(jobObj => {
        this.addScheduledJob(jobObj);
        return jobObj;
      });
  }

  /* removing a scheduled job */
  removeScheduledJob(jobId) {
    if (this.scheduledJob[jobId]) {
      this.scheduledJob[jobId].cancel();
      delete this.scheduledJob[jobId];
    }
  }

  /*
     loading scheduled jobs and set the socket
     * this function is called on bootstrap
     * */
  loadJobs(app) {
    this.socket = app.io;
    this.getFutureJobs()
      .then(jobs => {
        jobs.forEach(job => {
          this.addScheduledJob(job);
        });
      })
      .catch(error => {});
  }
}

const scheuledJobService = new ScheduledJobService();

module.exports = scheuledJobService;
