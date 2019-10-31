const usersService = require("../services/users.service");

module.exports = {
  filter: (req, res) => {
    usersService
      .filter(req.body)
      .then(x => {
        return res.send(x);
      })
      .catch(e => {
        console.log(e);
      });
  }
};
