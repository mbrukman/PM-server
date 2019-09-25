const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const COMPARISON = ['gte', 'gt', 'contains', 'lte', 'lt', 'equal'];


const filterParamSchema = new Schema({
  field: String,
  value: String,
  filterType: {type: String, enum: COMPARISON},
}, {_id: false});

const groupSchema = new Schema({
  name: {type: String, required: true},
  agents: [{type: Schema.Types.ObjectId, ref: 'Agent'}],
  filters: [filterParamSchema],
});

groupSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  },
});

const Group = mongoose.model('Group', groupSchema, 'groups');


module.exports = Group;
