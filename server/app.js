const bootstrap = require("./helpers/bootstrap").bootstrap;

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const winston = require('winston');
const expressWinston = require('express-winston');
const mongoose = require('mongoose');

const socketService = require('./api/services/socket.service');

require('winston-mongodb');
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
    mongoose.connect(env.dbURI).then(() => {
        winston.add(new winston.transports.MongoDB({
            db: env.dbURI,
        }));
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

var io = socketService.init(server);

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
const settingsApi = require("./api/routes/settings.routes");
const mapsApi = require("./api/routes/maps.routes");
const pluginsApi = require("./api/routes/plugins.routes");
const agentsApi = require("./api/routes/agents.routes");
const projectsApi = require("./api/routes/projects.routes");
const triggersApi = require("./api/routes/triggers.routes");
const scheduledJobsApi =  require("./api/routes/scheduled-jobs.routes");
const vaultApi = require("./api/routes/vault.routes");
const configTokenApi = require("./api/routes/config-token.routes");
const autoCompleteApi = require("./api/routes/autocomplete.routes");

app.use('/api/settings', settingsApi);
app.use('/api/maps', mapsApi);
app.use('/api/plugins', pluginsApi);
app.use('/api/agents', agentsApi);
app.use('/api/projects', projectsApi);
app.use('/api/triggers', triggersApi);
app.use('/api/scheduled-jobs', scheduledJobsApi);
app.use('/api/vault', vaultApi);
app.use('/api/config-token', configTokenApi);
app.use('/api/autocomplete',autoCompleteApi);


//Set Port
const port = parseArgs.PORT || '3000';
app.set('port', port);
app.io = io;


// Send all other requests to the Angular app
app.all('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

module.exports = {
    server: server.listen(port, () => {
        winston.log('info', `Running on localhost:${port}`);
        bootstrap(app);
    })
};
