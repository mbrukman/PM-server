
const config = require('../../env/config');
const jwt = require('jsonwebtoken');
module.exports = {
    createToken:(req,res)=>{
        let payload = req.body;
        let jwtSecret = config.serverKey
        let today = new Date();
        let exp = new Date(today);
        exp.setDate(today.getDate() + 7);
        payload.exp = parseInt(exp.getTime() / 1000);
        let token =jwt.sign(payload, jwtSecret);
        res.send(token)
    },

    validateAndExtractToken:(token)=> {
        let jwtSecret = config.serverKey
        try {
            return jwt.verify(token, jwtSecret );
        } catch (err) {
            return false;
        }
    }
}