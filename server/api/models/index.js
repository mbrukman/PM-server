const Agent         = require('./agent.model');
const Group = require('./group.model');
const Log           = require('./logs.model');
const Map           = require('./map.model');
const ExecutionLog  = require('./map-execution-log.model');
const Result        = require('./map-results.model');
const Structure     = require('./map-structure.model');
const Trigger       = require('./map-trigger.model');
const Plugin        = require('./plugin.model');
const Project       = require('./project.model');
const ScheduledJob  = require('./scheduled-job.model');


module.exports = {
    Agent,
    Group,
    Log,
    Map,
    ExecutionLog,
    Result,
    Structure,
    Trigger,
    Plugin,
    Project,
    ScheduledJob
};
