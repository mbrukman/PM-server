const authService = require("../services/auth.service");
const userService = require("../services/user.service");

class AuthController {
  async login(req, res) {
    let user;
    try {
      user = authService.login(req.body.email, req.body.password);
    } catch (error) {
      if (error.message === "User does not exist.") {
        res.status(404);
      } else if (error.message === "Wrong email and/or password.") {
        res.status(400);
      } else {
        res.status(500);
      }

      res.send(error.message);
    }
    const token = authService.sign(user._id);
    res.header("Authorization", "Bearer " + token);
    res.status(200).send(userService.returnUserWithPickedFields(user));
  }
}

const authController = new AuthController();

module.exports = authController;
