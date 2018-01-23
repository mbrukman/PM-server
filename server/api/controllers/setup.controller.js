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
        let connectionString;
        if (!dbDetails.uri && !(dbDetails.url && dbDetails.port && dbDetails.name)) {
            return res.status(500).send('Missing parameters')
        }
        if (dbDetails.username && dbDetails.password) {
            connectionString = `mongodb://${dbDetails.username}:${dbDetails.password}@${dbDetails.url}:${dbDetails.port}/${dbDetails.name}`;
        } else {
            connectionString = `mongodb://${dbDetails.url}:${dbDetails.port}/${dbDetails.name}`;
        }

        mongoose.connect((dbDetails.uri || connectionString), {
            useMongoClient: true
        }).then(() => {
            console.log(`Succesfully Connected to the Mongodb Database  at URL : mongodb://127.0.0.1:27017/refactor`);
            fs.writeFile('./env/dbconfig.json', JSON.stringify(dbDetails), (err) => {
                if (err) {
                    throw new Error(err);
                }
                dbconfig = require("../../env/dbconfig");
                return res.status(204).send();
            });
        }).catch((error) => {
            req.io.emit('notification', { title: 'Error configuring db', message: `${error}`, type: 'error' });
            return res.status(500).send((error || `Error Connecting to the Mongodb`));
        });

    }
};