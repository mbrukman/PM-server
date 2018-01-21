const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let pluginMethodParamsSchema = new Schema({
    name: { type: String, required: true },
    viewName: String,
    type: { type: String, enum: ['string', 'int', 'float', 'collection', 'file', 'text'], required: true },
    options: [{ id: String, name: Date }],

});

let pluginMethodSchema = new Schema({
    name: { type: String, required: true },
    viewName: String,
    route: String,
    actionString: String,
    params: [pluginMethodParamsSchema]
});

let pluginSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["server", "executer", "trigger", "module"], required: true },
    description: String,
    main: { type: String, required: true },
    execProgram: { type: String, required: true },
    active: { type: Boolean, default: true },
    version: String,
    imgUrl: String,
    methods: [pluginMethodSchema]
});

pluginSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Plugin = mongoose.model('Plugin', pluginSchema, 'plugins');


module.exports = Plugin;
