const User = require("../models/user.model");
const serverKey = process.env.SERVER_KEY;
const userService = require("../services/user.service");
const jwt = require("jsonwebtoken");

class AuthService {
  sign(userId, keepLoggedIn = false) {
    // ~6 months or 24 hours
    const expiresIn = keepLoggedIn ? "180d" : "24h";
    return jwt.sign({ sub: userId }, serverKey, { expiresIn });
  }

  async login(email, password) {
    let user;
    try {
      user = await User.findOne({ email });
    } catch (error) {
      throw new Error("Error reading user from db:", error);
    }

    if (!user) {
      throw new Error("User does not exist.");
    }

    const hashedPassword = userService.hashPassword(password);
    if (hashedPassword !== user.password) {
      throw new Error("Invalid password.");
    } else {
      return user;
    }
  }
}

const authService = new AuthService();

module.exports = authService;
