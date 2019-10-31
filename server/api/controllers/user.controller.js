const userService = require("../services/user.service");

function filter(req, res) {
  userService.filter(req.body).then(x => {
    return res.send(x);
  });
}

function createUser(req, res) {
  userService
    .createUser(req.body)
    .then(createdUser => {
      res.json(createdUser);
    })
    .catch(err => {
      res.status(400).json(err);
    });
}

module.exports = { filter, createUser };
