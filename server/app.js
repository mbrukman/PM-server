const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const winston = require('winston');
const expressWinston = require('express-winston');
const mongoose = require('mongoose');
const bootstrap = require("./helpers/bootstrap").bootstrap;
const socket = require('socket.io');
const winstonMongo = require('winston-mongodb');
const parseArgs = require('minimist')(process.argv.slice(2));

const env = require('./env/enviroment');
const app = express();

/////////////////////
// configurations //
///////////////////

// enable cors
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// winston logger
const server = http.createServer(app);

let expressWinstonTranports = [
    new winston.transports.Console({
        json: false,
        colorize: true
    })];

if (env.dbURI) {
    mongoose.connect(env.dbURI, {
        useMongoClient: true
    }).then(() => {
        winston.add(winstonMongo.MongoDB, {
            db: env.dbURI,
        });
        winston.log('info', `Succesfully Connected to the Mongodb at ${env.dbURI}`);
    });
    expressWinstonTranports.push(new winston.transports.MongoDB({ db: env.dbURI }));
}

// add express winston to router stack
app.use(expressWinston.logger({
    transports: expressWinstonTranports,
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}} {{req.statusCode}}",
    expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
}));

mongoose.Promise = require('bluebird');

// socket.io
io = socket(server);
io.on('connection', function (socket) {
    winston.log('info', 'a user connected');
});


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.io = io;
    req.app = app;
    next();
});

// Angular dist output folder
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/plugins', express.static(path.join(__dirname, 'libs', 'plugins')));
app.use('/media', express.static(path.join(__dirname, 'media_cdn')));


//////////////////////
/////// routes //////
////////////////////

/* api references */
const setupApi = require("./api/routes/setup.routes");
const mapsApi = require("./api/routes/maps.routes");
const pluginsApi = require("./api/routes/plugins.routes");
const agentsApi = require("./api/routes/agents.routes");
const projectsApi = require("./api/routes/projects.routes");

app.use('/api/setup', setupApi);
app.use('/api/maps', mapsApi);
app.use('/api/plugins', pluginsApi);
app.use('/api/agents', agentsApi);
app.use('/api/projects', projectsApi);


// Send all other requests to the Angular app
app.all('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


//Set Port
const port = parseArgs.PORT || '3000';
app.set('port', port);
app.io = io;

server.listen(port, () => {
    winston.log('info', `Running on localhost:${port}`);
    bootstrap(app);
});



