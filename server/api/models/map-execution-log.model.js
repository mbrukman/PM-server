const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let mapExecutionLogSchema = new Schema({
    map: { type: Schema.Types.ObjectId, ref: 'Map' },
    runId: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['success', 'info', 'error', 'fail', 'partial'] },
}, { timestamps: true });

mapExecutionLogSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let MapExecutionLog = mongoose.model('MapExecutionLog', mapExecutionLogSchema, 'maplogs');


module.exports = MapExecutionLog;