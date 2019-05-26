const socket = require('socket.io');
const winston = require('winston');
var _socket;

function init(server){
    // socket.io
    _socket = socket(server);
    _socket.on('connection', function (socket) {
        console.log(socket.id);
        
        winston.log('info', 'a user connected');
    });
    return _socket;
}

module.exports = {
    init : init,
    get socket(){
        return _socket;
    }
}