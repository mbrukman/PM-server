const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/user.model");
const serverKey = process.env.SERVER_KEY;
const userService = require("../services/user.service");
const jwt = require("jsonwebtoken");

class AuthService {
  constructor() {
    const strategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: serverKey
    };
    passport.use(new JwtStrategy(strategyOptions, this.verify));
  }

  sign(userId) {
    jwt.sign({ sub: userId }, serverKey);
  }

  verify(jwtPayload, done) {
    User.findOne({ _id: jwtPayload.sub }, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
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
    } else if (userService.hashPassword(password) !== user.password) {
      throw new Error("Wrong email and/or password.");
    } else {
      return user;
    }
  }
}

const authService = new AuthService();

module.exports = authService;
