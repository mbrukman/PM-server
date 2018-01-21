const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let actionParamsSchema = new Schema({
    value: String,
    viewName: String,
    param: { type: Schema.Types.ObjectId, ref: 'Plugin.methods.params' },
    name: String
});


let TriggerSchema = new Schema({
    name: { type: String, required: true },
    map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
    description: String,
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    plugin: { type: Schema.Types.ObjectId, ref: 'Plugin' },
    method: { type: Schema.Types.ObjectId, ref: 'Plugin.methods' },
    params: [actionParamsSchema]
});

TriggerSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Trigger = mongoose.model('Trigger', TriggerSchema, 'triggers');


module.exports = Trigger;

