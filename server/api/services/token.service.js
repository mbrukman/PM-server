const config = require('../../env/config');
const jwt = require('jsonwebtoken');

module.exports = {
    
    createToken:(payload,expiration)=> {
        let jwtSecret = config.serverKey;
        return jwt.sign(payload, jwtSecret, expiration );
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