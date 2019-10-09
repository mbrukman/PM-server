const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statusEnum = {
  RUNNING: "running",
  DONE: "done",
  PENDING: "pending",
  ERROR: "error",
  STOPPED: "stopped",
  CANCELED: "canceled",
  SUCCESS: "success"
};

const actionResultSchema = new Schema(
  {
    action: {
      type: Schema.Types.ObjectId,
      ref: "MapStructure.processes.actions"
    },
    status: String,
    startTime: Date,
    finishTime: Date,
    result: Schema.Types.Mixed,
    retriesLeft: Number
  },
  { _id: false }
);

const processResultSchema = new Schema(
  {
    iterationIndex: Number,
    process: { type: Schema.Types.ObjectId, ref: "MapStructure.processes" },
    actions: [actionResultSchema],
    status: String,
    message: Schema.Types.Mixed,
    preRunResult: Schema.Types.Mixed,
    postRunResult: Schema.Types.Mixed,
    startTime: Date,
    finishTime: Date
  },
  { _id: false }
);

const AgentResultSchema = new Schema(
  {
    processes: [processResultSchema],
    agent: { type: Schema.Types.ObjectId, ref: "Agent" }
  },
  { _id: false }
);

const mapResultSchema = new Schema({
  map: { type: Schema.Types.ObjectId, ref: "Map" },
  structure: { type: Schema.Types.ObjectId, ref: "MapStructure" },
  configuration: Schema.Types.Mixed,
  agentsResults: [AgentResultSchema],
  startTime: { type: Date, index: true },
  finishTime: { type: Date, index: true },
  trigger: String,
  status: {
    type: String,
    enum: [
      statusEnum.DONE,
      statusEnum.ERROR,
      statusEnum.RUNNING,
      statusEnum.PENDING
    ]
  },
  reason: String, // e.g. no agents
  triggerPayload: Schema.Types.Mixed,
  archivedMap: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: new Date() }
});

mapResultSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});
const MapResult = mongoose.model("MapResult", mapResultSchema, "mapResults");
const AgentResultModel = mongoose.model(
  "AgentResult",
  AgentResultSchema,
  "agentResults"
);
const ActionResultModel = mongoose.model(
  "ActionResult",
  actionResultSchema,
  "actionResults"
);

module.exports = {
  MapResult,
  AgentResultModel,
  AgentResult: AgentResultSchema,
  ActionResult: actionResultSchema,
  ActionResultModel,
  statusEnum
};
