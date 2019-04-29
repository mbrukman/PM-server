const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let mapSchema = new Schema({
    name: { type: String, required: true },
    description: {type: String, default: ''},
    archived: { type: Boolean, default: false },
    agents: [{ type: Schema.Types.ObjectId, ref: 'Agent' }],
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    queue: Number,
}, { timestamps: true });

mapSchema.statics.autocompleteKey = "name";
mapSchema.statics.autocompleteValueField = "_id";

mapSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Map = mongoose.model('Map', mapSchema, 'maps');


module.exports = Map;