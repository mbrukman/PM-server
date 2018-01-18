const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let actionResultSchema = new Schema({
    name: String,
    action: { type: Schema.Types.ObjectId, ref: 'MapStructure.processes.actions' },
    method: { name: String, _id: {type: Schema.Types.ObjectId, ref: 'Plugin.method' }},
    status: String,
    startTime: Date,
    finish: Date,
    result: Schema.Types.Mixed
});

let processResultSchema = new Schema({
    name: String,
    process: { type: Schema.Types.ObjectId, ref: 'MapStructure.processes' },
    uuid: String,
    plugin: { name: String, _id: { type: Schema.Types.ObjectId, ref: 'Plugin' } },
    actions: [actionResultSchema],
    status: String,
    startTime: Date,
    finishTime: Date,
    result: Schema.Types.Mixed
});

let agentResultSchema = new Schema({
    name: String,
    processes: [processResultSchema],
    agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
    status: String,
    startTime: Date,
    finish: Date,
    result: Schema.Types.Mixed
});


let mapResultSchema = new Schema({
    map: { type: Schema.Types.ObjectId, ref: 'Map' },
    runId: { type: String, required: true },
    structure: { type: Schema.Types.ObjectId, ref: 'MapStructure' },
    agentsResults: [agentResultSchema],
    startAgentsNumber: Number,
    startTime: Date,
    finishTime: Date,
});

mapResultSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let MapResult = mongoose.model('MapResult', mapResultSchema, 'mapResults');


module.exports = MapResult;