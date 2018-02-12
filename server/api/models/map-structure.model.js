const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let actionParamsSchema = new Schema({
    value: String,
    viewName: String,
    param: { type: Schema.Types.ObjectId, ref: 'Plugin.methods.params' },
    name: String,
    code: Boolean
});

let actionSchema = new Schema({
    name: String,
    timeout: Number,
    timeunit: Number,
    retries: Number,
    mandatory: { type: Boolean, default: false },
    method: String,
    params: [actionParamsSchema]
});


let usedPluginsSchema = new Schema({
    name: { type: String, required: true },
    version: { type: String, required: true }
});

let processSchema = new Schema({
    name: String,
    description: String,
    order: Number,
    default_execution: Boolean,
    preRun: String,
    postRun: String,
    filterAgents: String,
    coordination: String,
    correlateAgents: { type: Boolean, default: false },
    mandatory: { type: Boolean, default: false },
    condition: String,
    createdAt: { type: Date, default: Date.now },
    used_plugin: usedPluginsSchema,
    actions: [actionSchema],
    uuid: String
});

let linkSchema = new Schema({
    name: String,
    sourceId: String,
    targetId: String,
    uuid: String,
    createdAt: { type: Date, default: Date.now },
});


let attributeSchema = new Schema({
    name: { type: String, require: true },
    type: { type: String, require: true, enum: ['string', 'array', 'object'] },
    value: { type: Schema.Types.Mixed, require: true },
});

let mapCodeSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    code: String
});

let mapStructureSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
    content: Schema.Types.Mixed,
    links: [linkSchema],
    processes: [processSchema],
    code: String,
    attributes: [attributeSchema],
    used_plugins: [usedPluginsSchema]
});

mapStructureSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let MapStructure = mongoose.model('MapStructure', mapStructureSchema, 'mapstructure');


module.exports = MapStructure;
