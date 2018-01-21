const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let mapSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    licence: String,
    archived: { type: Boolean, default: false },
    agents: [{ type: Schema.Types.ObjectId, ref: 'Agent' }]
}, { timestamps: true });

mapSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Map = mongoose.model('Map', mapSchema, 'maps');


module.exports = Map;