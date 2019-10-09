const socketio = require("socket.io");
const winston = require("winston");
const Socket = require("../../api/models/socket.model");

let socketServerInstance;

function init(server) {
  socketServerInstance = socketio(server);
  socketServerInstance.on("connection", function(socket) {
    winston.log("info", "a user connected");
  });

  return socketServerInstance;
}

async function getNamespaceSocket(_namespaceName) {
  let socketFromDatabase;
  let namespaceToReturn;

  try {
    socketFromDatabase = await Socket.findOne({ namespace: _namespaceName });
  } catch (error) {
    throw new Error("error getting socket from database" + error);
  }

  if (socketFromDatabase) {
    namespaceToReturn = socketServerInstance.of(
      "/" + socketFromDatabase.namespace
    );
  } else {
    socketFromDatabase = new Socket({ namespace: _namespaceName });
    await socketFromDatabase.save();
    namespaceToReturn = socketServerInstance.of("/" + _namespaceName);
  }
  return namespaceToReturn;
}

module.exports = {
  init,
  get socket() {
    return socketServerInstance;
  },
  getNamespaceSocket
};
