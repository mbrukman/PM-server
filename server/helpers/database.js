const mongoose = require('mongoose');
const winston = require("winston");

module.exports = function setupDB(expressWinstonTranports) {
    require("winston-mongodb");
    if (process.env.DB_URI) {
        mongoose
          .connect(process.env.DB_URI, {
            useNewUrlParser: true
          })
          .then(() => {
            winston.add(
              new winston.transports.MongoDB({
                db: process.env.DB_URI
              })
            );
            winston.log(
              "info",
              `Successfully Connected to the Mongodb at ${process.env.DB_URI}`
            );
          });
        expressWinstonTranports.push(
          new winston.transports.MongoDB({ db: process.env.DB_URI })
        );
      }
}