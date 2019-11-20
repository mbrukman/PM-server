const User = require("../models/user.model");
const _ = require("lodash");

async function checkPolicy(req, policy) {
  const user = await User.findById(req.user);
  const foundPolicy = _.get(user.toObject(), policy);
  return foundPolicy === true;
}

function handleNoPermission(req, res, policy) {
  req.io.emit("notification", {
    title: "Whoops..",
    message: `You have no permission to do that.`,
    type: "error"
  });
  res.status(403).send(`User has no '${policy}' policy.`);
}

class IAMMiddleware {
  async checkCreatePolicy(req, res, next) {
    const requiredPolicy = "policies.iam.create";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkReadPolicy(req, res, next) {
    const requiredPolicy = "policies.iam.read";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkUpdatePolicy(req, res, next) {
    const requiredPolicy = "policies.iam.update";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkRemovePolicy(req, res, next) {
    const requiredPolicy = "policies.iam.remove";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }
}

const iamMiddleware = new IAMMiddleware();

module.exports = iamMiddleware;
