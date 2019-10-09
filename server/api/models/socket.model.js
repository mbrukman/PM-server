const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const socketSchema = new Schema(
  {
    namespace: String
  },
  { timestamps: true }
);

const Socket = mongoose.model("Socket", socketSchema, "sockets");

module.exports = Socket;
