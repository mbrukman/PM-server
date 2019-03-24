
const config = require('../../env/config');
const jwt = require('jsonwebtoken');
module.exports = {
    createToken:(req,res)=>{
        let payload = req.body;
        let jwtSecret = config.serverKey
        let token =jwt.sign(payload, jwtSecret);
        res.send(token)
    }
}