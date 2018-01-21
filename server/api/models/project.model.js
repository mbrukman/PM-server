const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let projectSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    archived: { type: Boolean, default: false },
    maps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Map' }]
}, { timestamps: true });

projectSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
    }
});

let Project = mongoose.model('Project', projectSchema, 'projects');


module.exports = Project;