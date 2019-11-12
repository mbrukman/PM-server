const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    archived: { type: Boolean, default: false },
    maps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Map" }]
  },
  { timestamps: true }
);

projectSchema.statics.autocompleteKey = "name";
projectSchema.statics.autocompleteValueField = "_id";

projectSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});

const Project = mongoose.model("Project", projectSchema, "projects");

module.exports = Project;
