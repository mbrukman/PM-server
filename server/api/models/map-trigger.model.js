const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let actionParamsSchema = new Schema({
    value: String,
    viewName: String,
    param: String,
    name: String,
    type:String
});


let TriggerSchema = new Schema({
    name: { type: String, required: true },
    map: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
    description: String,
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    plugin: {type:String,required: true},
    method: {type:String,required: true},
    configuration: String,
    params: [actionParamsSchema]
});

TriggerSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Trigger = mongoose.model('Trigger', TriggerSchema, 'triggers');


module.exports = Trigger;

