const tokenService = require("../services/token.service");

module.exports = {
  createToken: (req, res) => {
    const payload = req.body;
    const token = tokenService.createToken(payload, { expiresIn: "7d" });
    res.send(token);
  }
};
