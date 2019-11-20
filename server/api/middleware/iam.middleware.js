const User = require("../models/user.model");

class IAMMiddleware {
  checkCreatePolicy(req, res, next) {
    const policyField = "policies.iam.create";
    const hasPolicy = User.findById(req.user).select();
    if (hasPolicy === true) {
      next();
    } else {
      res.status(403).send(`User has no '${policyField}' policy.`);
    }
  }
}

const iamMiddleware = new IAMMiddleware();

module.exports = iamMiddleware;
