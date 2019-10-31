require("./setup-env");

const path = require("path");
const http = require("http");
const winston = require("winston");
const express = require("express");
const bodyParser = require("body-parser");
const expressWinston = require("express-winston");
const parseArgs = require("minimist")(process.argv.slice(2));

const socketService = require("../api/services/socket.service");
const bootstrap = require("./bootstrap").bootstrap;
const bootstrapApi = require("./routes");
const setupDB = require("./database");

module.exports = function startKaholo() {
  const app = express();

  let port, server, io;

  if (!process.env.DB_URI) {
    throw new Error("No DB_URI was provided in environmental variables!");
  }

  // enable cors
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "PUT, GET, POST, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });

  // winston logger
  const expressWinstonTranports = [
    new winston.transports.Console({
      json: false,
      colorize: true
    })
  ];

  setupDB(expressWinstonTranports);

  // add express winston to router stack
  app.use(
    expressWinston.logger({
      transports: expressWinstonTranports,
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}} {{req.statusCode}}",
      expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: false // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    })
  );

  server = http.createServer(app);
  io = socketService.init(server);

  app.use(
    bodyParser.urlencoded({
      extended: false
    })
  );
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    req.io = io;
    req.app = app;
    next();
  });

  bootstrapApi(app);

  // Angular dist output folder
  app.use(express.static(path.join(__dirname, "../dist")));
  app.use(
    "/plugins",
    express.static(path.join(__dirname, "../libs", "plugins"))
  );
  app.use("/media", express.static(path.join(__dirname, "..media_cdn")));

  port = parseArgs.PORT || process.env.PORT;
  app.set("port", port);
  app.io = io;

  // Send all other requests to the Angular app
  app.all("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  server.listen(port, () => {
    winston.log("info", `Running on localhost:${port}`);
    bootstrap(app);
  });

  return server;
};
