const usersService = require("../services/users.service");

module.exports = {
  filter: (req, res) => {
    usersService.filter().then(x => {
      return res.send(x);
    });
  }
};
