const fs = require('fs');
const hooks = require('../../libs/hooks/hooks');
const mongoose = require('mongoose');
let dbconfig;
try {
    dbconfig = require("../../env/dbconfig");
} catch (e) {
    dbconfig = null;
}


module.exports = {
    isSetUp: (req, res) => {
        if (dbconfig) {
            return res.send(true);
        }
        return res.send(false)
    },

    setupDbConnectionString: (req, res) => {
        const dbDetails = req.body;
        if (!dbDetails.uri) {
            return res.status(500).send('Missing parameters')
        }
        mongoose.connect(dbDetails.uri, {
            useMongoClient: true
        }, function (err) { if (err) { throw new Error(err)}})
            .then(
                () => {
                    fs.writeFile('./env/dbconfig.json', JSON.stringify(dbDetails), (err) => {
                        if (err) {
                            throw new Error(err);
                        }
                        dbconfig = require("../../env/dbconfig");
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