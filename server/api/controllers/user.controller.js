const usersService = require("../services/user.service");

function filter(req, res) {
  usersService
    .filter(req.body)
    .then(x => {
      return res.send(x);
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

module.exports = { filter };
