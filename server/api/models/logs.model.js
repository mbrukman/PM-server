const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let logSchema = new Schema({
    message: String,
    status: String,
    meta: Schema.Types.Mixed,
    stacktrace: Schema.Types.Mixed,
    timestamp: Date
});


let Log = mongoose.model('Log', logSchema, 'log');


module.exports = Log;