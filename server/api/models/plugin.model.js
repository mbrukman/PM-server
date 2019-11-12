const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pluginMethodParamsSchema = new Schema({
  required: Boolean,
  name: { type: String, required: true },
  viewName: String,
  type: {
    type: String,
    enum: [
      "string",
      "int",
      "float",
      "options",
      "autocomplete",
      "file",
      "text",
      "boolean",
      "vault"
    ],
    required: true
  },
  options: [{ id: String, name: String }],
  description: { type: String },
  model: {
    type: String,
    required: function() {
      return this.type === "autocomplete";
    }
  },
  propertyName: {
    type: String,
    required: function() {
      return this.type === "autocomplete";
    }
  },
  query: Schema.Types.Mixed
});

const pluginMethodSchema = new Schema({
  name: { type: String, required: true },
  viewName: String,
  route: String,
  actionString: String,
  params: [pluginMethodParamsSchema]
});

const pluginSettingsSchema = {
  required: Boolean,
  name: { type: String, required: true },
  valueType: String,
  viewName: String,
  options: [{ id: String, name: String }],
  value: { type: String, default: "" },
  model: {
    type: String,
    required: function() {
      return this.type === "autocomplete";
    }
  },
  propertyName: {
    type: String,
    required: function() {
      return this.type === "autocomplete";
    }
  },
  query: Schema.Types.Mixed
};

const pluginSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["server", "executer", "trigger", "module"],
    required: true
  },
  description: String,
  main: { type: String, required: true },
  execProgram: { type: String, required: true },
  active: { type: Boolean, default: true },
  version: { type: String, required: true },
  imgUrl: String,
  methods: [pluginMethodSchema],
  settings: [pluginSettingsSchema],
  file: { type: String, required: true }
});

pluginSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});

const Plugin = mongoose.model("Plugin", pluginSchema, "plugins");

module.exports = Plugin;
