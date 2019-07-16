const fs = require('fs');
const path = require('path');
const winston = require('winston');
const expressWinston = require('express-winston');

const mongoose = require('mongoose');
const env = require('../../env/enviroment')
let config = require('../../env/config');

module.exports = {
    settings: (req, res) => {
        if(!config.dbURI){
            return res.send({
                isSetup: false,
                version: env.version
            })
        }
        mongoose.connect(config.dbURI)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            }).then(isSetup => {
                res.send({
                    isSetup: isSetup,
                    version: env.version
                })
            })
    },

    setupDbConnectionString: (req, res) => {
        const dbDetails = req.body;
        if (!dbDetails.uri) {
            return res.status(500).send('Missing parameters')
        }
        new Promise((resolve, reject) => {
            mongoose.connect(dbDetails.uri).then(() => {
                let expressWinstonTranports = [
                    new winston.transports.Console({
                        json: false,
                        colorize: true
                    })];
                expressWinstonTranports.push(new winston.transports.MongoDB({ db: dbDetails.uri }));
                req.app.use(expressWinston.logger({
                    transports: expressWinstonTranports,
                    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
                    msg: "HTTP {{req.method}} {{req.url}} {{req.statusCode}}",
                    expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
                    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
                }));
                let tmpRoute = req.app._router.stack.pop();
                req.app._router.stack.splice(3, 0, tmpRoute); // adding to router stack
                // adding mongo transporter to winston
                winston.add(new winston.transports.MongoDB({
                    db: dbDetails.uri
                }));
                config = Object.assign({}, config, { dbURI: dbDetails.uri });
                fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
                res.status(204).send();
                return resolve()
            }).catch((error) => {
                req.io.emit('notification', {
                    title: 'Error configuring db',
                    message: `${error.message}`,
                    type: 'error'
                });
                return res.status(500).send(error.toString() || `Error Connecting to the Mongodb`);
            });

        });
    }
};