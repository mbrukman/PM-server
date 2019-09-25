const config = require('../../env/config');
const jwt = require('jsonwebtoken');

module.exports = {

  createToken: (payload, expiration)=> {
    const jwtSecret = config.serverKey;
    return jwt.sign(payload, jwtSecret, expiration );
  },

  validateAndExtractToken: (token)=> {
    const jwtSecret = config.serverKey;
    try {
      return jwt.verify(token, jwtSecret );
    } catch (err) {
      return false;
    }
  },
};
