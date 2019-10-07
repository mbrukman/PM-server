const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const snodeSchema = new Schema({
  name: {type: String, required: true},
  parent: this,
  children: [this],
  agent: {type: Schema.Types.ObjectId, ref: 'Agent', unique: true},
});

snodeSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  },
});

const SNode = mongoose.model('SNode', snodeSchema, 'snodes');


module.exports = SNode;
