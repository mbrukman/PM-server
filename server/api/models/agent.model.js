const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// TODO add plugins installed?
let agentSchema = new Schema({
    name: String,
    url: { type: String, required: true },
    key: { type: String, required: true },
    sshKey: String,
    attributes: []
});


agentSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Agent = mongoose.model('Agent', agentSchema, 'agents');

module.exports = Agent;
