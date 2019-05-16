const socket = require('socket.io');
const winston = require('winston');
var _socket;

function init(server){
    // socket.io
    let _sock = socket(server);
    _sock.on('connection', function (socket) {
        _socket = socket;
        winston.log('info', 'a user connected');
    });
    return _sock;
}

module.exports = {
    init : init,
    get socket(){
        return _socket;
    },
    emit : (type, payload)=>{
        if (_socket)
            _socket.emit(type,payload)
    }
}