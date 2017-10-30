module.exports = {
  jobs: {},
  scheduler: require('node-schedule'),
  addJob: function (job) {
    return ScheduledJob.create(job).then((job) => {
      return ScheduledJob.findOne({id: job.id}).populate('Map')
    }).then((populatedJob) => {
      return SchedultJobsService.addScheduledJob(populatedJob);
      return populatedJob
    })
  },
  getFutureJobs: function (cb) {
    return ScheduledJob.find().where({
      or: [
        {
          startAt: {'>=': new Date()},
          isCron: false
        },
        {isCron: true}
      ]
    }).populate('Map')
  },
  deleteJob: function (jobId, cb) {
    SchedultJobsService.removeJob(jobId);
    
    return ScheduledJob.destroy({id: jobId});

  },
  updateJob: function (job, cb) {
    return ScheduledJob.update({id: job.id}, job).then((job) => {
      SchedultJobsService.removeJob(job.id);
      return ScheduledJob.findOne({id: job.id}).populate('Map')
    }).then((populatedJob) => {
      SchedultJobsService.addScheduledJob(populatedJob);
      return populatedJob
    });

  },
  removeJob: function (jobId) {
    if (!SchedultJobsService.jobs[jobId])
      return;

    SchedultJobsService.jobs[jobId].cancel();
    delete SchedultJobsService.jobs[jobId];
    sails.log.info('Removed scheduled job Id : ' + jobId);
  },
  addScheduledJob: function (job) {
    var startAt = (job.isCron) ? job.Cron : job.startAt;

    SchedultJobsService.jobs[job.id] = SchedultJobsService.scheduler.scheduleJob(startAt, function () {
      MapService.executeMap("-1", job.Map.id, job.version, [], function () {
      });
    });
    var dateString = (job.isCron) ? "Cron : " + job.Cron : "Date : " + job.startAt.toString();
    sails.log.info('Adding scheduled job for map : ' + job.Map.name + ' - ' + dateString);
  },
  loadJobs: function () {
    SchedultJobsService.getFutureJobs(function (err, jobs) {
      if (err) return;
      sails.log.info('Loading scheduled jobs');
      jobs.forEach(function (job) {
        SchedultJobsService.addScheduledJob(job);
      });
    });
  }
};
