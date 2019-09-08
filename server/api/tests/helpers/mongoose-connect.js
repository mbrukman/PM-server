const mongoose = require('mongoose');
const env = require('../../../env/enviroment')
module.exports = {
    isConnected:(url = env.dbURI)=>{
        return new Promise((resolve,reject) => {
            mongoose.connect(url)
            .then(e => {
                return resolve(true)
            })
            .catch(e => {
                return resolve(false)
            })
        })
    }
}