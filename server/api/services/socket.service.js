const io = require('socket.io');
const winston = require('winston');
var socket;

function init(server) {
    socket = io(server);
    socket.on('connection', function (socket) {
        winston.log('info', 'a user connected');
    });
    return socket;
}

module.exports = {
    init: init,
    get socket() {
        return socket;
    },
    emit: (type, payload) => {

        if (socket)
            socket.emit(type, payload)
    }
}