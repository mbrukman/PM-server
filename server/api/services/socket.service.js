const socket = require('socket.io');
const winston = require('winston');
var _socket;

function init(server){
    // socket.io
    _socket = socket(server);
    _socket.on('connection', function (socket) {
        winston.log('info', 'a user connected');
        _socket.on('execution-update',(data) =>{
            console.log(data);
        })
    });
    return _socket;
}

module.exports = {
    init : init,
    get socket(){
        return _socket;
    }
}