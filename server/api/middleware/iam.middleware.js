const User = require("../models/user.model");
const _ = require("lodash");

class IAMMiddleware {
  async checkCreatePolicy(req, res, next) {
    const policy = "policies.iam.create";
    const user = await User.findById(req.user);
    const userHasPolicy = _.get(user.toObject(), policy);
    if (userHasPolicy === true) {
      next();
    } else {
      req.io.emit("notification", {
        title: "Whoops..",
        message: `You have no permission to do that.`,
        type: "error"
      });
      res.status(403).send(`User has no '${policy}' policy.`);
    }
  }
}

const iamMiddleware = new IAMMiddleware();

module.exports = iamMiddleware;
