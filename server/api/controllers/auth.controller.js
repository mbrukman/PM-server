const authService = require("../services/auth.service");
const userService = require("../services/user.service");

class AuthController {
  async login(req, res) {
    let user;
    try {
      user = await authService.login(req.body.email, req.body.password);
    } catch (error) {
      if (error.message === "User does not exist.") {
        res.status(404);
      } else if (error.message === "Invalid password.") {
        res.status(401);
      } else {
        res.status(500);
      }

      return res.send({ message: error.message });
    }
    const token = authService.sign(user.id, req.body.keepLoggedIn);
    res.header("Authorization", "Bearer " + token);
    res.status(200).send(userService.returnUserWithPickedFields(user));
  }
}

const authController = new AuthController();

module.exports = authController;
