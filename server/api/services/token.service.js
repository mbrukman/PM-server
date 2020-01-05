const jwt = require('jsonwebtoken');

module.exports = {

  createToken: (payload, expiration)=> {
    const jwtSecret = process.env.SERVER_KEY;
    return jwt.sign(payload, jwtSecret, expiration );
  },

  validateAndExtractToken: (token)=> {
    const jwtSecret = process.env.SERVER_KEY;
    try {
      return jwt.verify(token, jwtSecret );
    } catch (err) {
      return false;
    }
  },
};
