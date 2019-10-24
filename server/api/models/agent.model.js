const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agentStatusSchema = new Schema({
  alive: Boolean,
  following: Boolean,
  defaultUrl: String,
  socketId: String,
  hostname: String,
  arch: String,
  freeSpace: String,
  respTime: Number,
  installed_plugins: Schema.Types.Mixed,
  liveCounter: Number
});

const agentSchema = new Schema({
  name: String,
  url: { type: String, required: true },
  publicUrl: { type: String, required: true },
  key: { type: String, required: true, index: true },
  sshKey: String,
  isDeleted: Boolean,
  attributes: [],
  status: agentStatusSchema
});

agentSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});

const Agent = mongoose.model("Agent", agentSchema, "agents");

module.exports = Agent;
