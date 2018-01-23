const fs = require('fs');
const hooks = require('../../libs/hooks/hooks');
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
        console.log(req.body);
        const dbDetails = req.body;
        fs.writeFile('./env/dbconfig.json', JSON.stringify(dbDetails), (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            console.log('The file has been saved!');
            dbconfig = require("../../env/dbconfig");
            return res.send("OK");
        });
    }
};