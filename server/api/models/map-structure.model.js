const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actionParamsSchema = new Schema({
    value: String,
    viewName: String,
    param: { type: Schema.Types.ObjectId, ref: 'Plugin.methods.params' },
    name: String,
    code: Boolean,
    type: String
});

const actionSchema = new Schema({
    name: String,
    timeout: { type: Number, default: 600000 },
    retries: { type: Number, default: 1 },
    method: String,
    params: [actionParamsSchema],
    mandatory: { type: Boolean, default: false }
});


const usedPluginsSchema = new Schema({
    name: { type: String, required: true },
    version: { type: String, required: true }
}, { _id: false });

const processSchema = new Schema({
    name: String,
    description: String,
    order: Number,
    default_execution: Boolean,
    preRun: String,
    postRun: String,
    filterAgents: String,
    coordination: String,
    flowControl: { type: String, enum: ['race', 'each', 'wait'], default: 'each' },
    correlateAgents: { type: Boolean, default: false },
    mandatory: { type: Boolean, default: false },
    condition: String,
    createdAt: { type: Date, default: Date.now },
    used_plugin: usedPluginsSchema,
    actions: [actionSchema],
    uuid: String
});

const linkSchema = new Schema({
    name: String,
    sourceId: String,
    targetId: String,
    uuid: String,
    createdAt: { type: Date, default: Date.now },
});

const configurationSchema = new Schema({
    name: { type: String, require: true },
    value: { type: Schema.Types.Mixed, require: true },
    selected: Boolean
}, { _id: false });

const mapStructureSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
    content: Schema.Types.Mixed,
    links: [linkSchema],
    processes: [processSchema],
    code: String,
    configurations: [configurationSchema],
    used_plugins: [usedPluginsSchema]
});

mapStructureSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

const MapStructure = mongoose.model('MapStructure', mapStructureSchema, 'mapstructure');


module.exports = MapStructure;