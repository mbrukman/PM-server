const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const winston = require('winston');
const expressWinston = require('express-winston');
const mongoose = require('mongoose');
const bootstrap = require("./helpers/bootstrap").bootstrap;
const socket = require('socket.io');
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
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true
        })
    ],
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
}));


const server = http.createServer(app);
io = socket(server);
io.on('connection', function (socket) {
    console.log('a user connected');
});

if (env.dbURI) {
    console.log('--', env.dbURI);
    mongoose.connect(env.dbURI, {
        useMongoClient: true
    }).then(() => {
        console.log(`Succesfully Connected to the Mongodb Database`);
    });
}

mongoose.Promise = require('bluebird');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.io = io;
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
const port = process.env.PORT || '3000';
app.set('port', port);
app.io = io;

server.listen(port, () => {
    console.log(`Running on localhost:${port}`);
    bootstrap(app);
});



