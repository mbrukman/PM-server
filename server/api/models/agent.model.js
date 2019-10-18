const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agentStatusSchema = new Schema({
  attributes: [],
  _id: Schema.Types.ObjectId,
  name: String,
  url: String,
  publicUrl: String,
  __v: Number,
  id: String,
  alive: Boolean,
  following: Boolean,
  defaultUrl: String,
  socketId: String,
  intervalId: Number,
  hostname: String,
  arch: String,
  freeSpace: String,
  respTime: Number,
  key: String,
  installed_plugins: Schema.Types.Mixed,
  liveCounter: Number
});

const agentSchema = new Schema({
  name: String,
  url: { type: String, required: true },
  publicUrl: { type: String, required: true },
  key: { type: String, required: true, index: true },
  sshKey: String,
  attributes: [],
  isDeleted: Boolean,
  status: agentStatusSchema
});

agentSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
    delete ret.key;
  }
});

const Agent = mongoose.model("Agent", agentSchema, "agents");

module.exports = Agent;
