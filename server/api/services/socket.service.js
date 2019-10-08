const socket = require("socket.io");
const winston = require("winston");

let _socket;
const namespaces = {};

function init(server) {
  // socket.io
  _socket = socket(server);
  _socket.on("connection", function(socket) {
    winston.log("info", "a user connected");
  });

  return _socket;
}

function getNamespaceSocket(nsp) {
  if (namespaces[nsp]) {
    return namespaces[nsp];
  }
  namespaces[nsp] = _socket.of("/" + nsp);
  console.log(namespaces);
  console.trace("getNamespaceSocket");
  return namespaces[nsp];
}

module.exports = {
  init: init,
  get socket() {
    return _socket;
  },
  getNamespaceSocket: getNamespaceSocket
};
