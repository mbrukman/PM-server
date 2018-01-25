const fs = require('fs');
const hooks = require('../../libs/hooks/hooks');
const mongoose = require('mongoose');
const env = require('../../env/enviroment');
let config = require('../../env/config');

module.exports = {
    isSetUp: (req, res) => {
        console.log(config.dbURI);
        if (config.dbURI) {
            return res.send(true);
        }
        return res.send(false)
    },

    setupDbConnectionString: (req, res) => {
        const dbDetails = req.body;
        if (!dbDetails.uri) {
            return res.status(500).send('Missing parameters')
        }

        mongoose.connect(dbDetails.uri, { useMongoClient: true })
            .then(
                () => {

                    config = Object.assign({}, config, { dbURI: dbDetails.uri });
                    fs.writeFile('./env/config.json', JSON.stringify(config), (err) => {
                        if (err) {
                            throw new Error(err);
                        }
                        return res.status(204).send();
                    });
                },
                err => {
                    throw new Error(err)
                })
            .catch((error) => {
                req.io.emit('notification', { title: 'Error configuring db', message: `${error}`, type: 'error' });
                return res.status(500).send((error || `Error Connecting to the Mongodb`));
            });

    }
};