const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../api/models/user.model");
const serverKey = process.env.SERVER_KEY;

function verify(jwtPayload, done) {
  User.findOne({ _id: jwtPayload.sub }, function(err, user) {
    if (err) {
      console.error(err);
      return done(err, false);
    } else {
      return done(null, user || false);
    }
  });
}

const strategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: serverKey
};

passport.use(new JwtStrategy(strategyOptions, verify));

function authMiddleware(req, res, next) {
  if (req.method === "OPTIONS") {
    next();
    return;
  }
  passport.authenticate("jwt", { session: false })(req, res, next);
}

module.exports = authMiddleware;
