const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentSchema = new Schema({
  name: String,
  url: {type: String, required: true},
  publicUrl: {type: String, required: true},
  key: {type: String, required: true},
  sshKey: String,
  attributes: [],
  isDeleted: Boolean,
});


agentSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret.key;
  },
});

const Agent = mongoose.model('Agent', agentSchema, 'agents');

module.exports = Agent;
