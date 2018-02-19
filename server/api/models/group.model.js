const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const COMPARISON = ['gte', 'gt', 'contains', 'lte', 'lt', 'equal'];

const filterSchema = new Schema({
    value: String,
    filterType: { type: String, enum: COMPARISON }
}, { _id: false });

const groupSchema = new Schema({
    name: { type: String, required: true },
    agents: [{ type: Schema.Types.ObjectId, ref: 'Agent' }],
    filter: {
        hostname: [filterSchema],
        arch: [filterSchema],
        alive: [{
            value: Boolean,
            filterType: { type: String, enum: ['equal'] }
        }],
        freeSpace: [filterSchema],
        respTime: [filterSchema],
        ip: [filterSchema]
    }
});

groupSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Group = mongoose.model('Group', groupSchema, 'groups');


module.exports = Group;