const _ = require("lodash");
const userService = require("../services/user.service");

async function checkPolicy(req, requiredPolicy) {
  const user = await userService.getUser(req.user);
  if (user.isAdmin === true) {
    return true;
  }
  const foundPolicyInUser = _.get(
    user.toObject(),
    "iamPolicy.permissions." + requiredPolicy
  );

  // for each group user belongs to, look for permissions
  const foundPolicyInUserGroups = user.groups
    .toObject()
    .map(group => group.iamPolicy.permissions)
    .find(permissions => permissions[requiredPolicy] === true)[requiredPolicy];

  return foundPolicyInUser === true || foundPolicyInUserGroups === true;
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
    const requiredPolicy = "create";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkReadPolicy(req, res, next) {
    const requiredPolicy = "read";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkUpdatePolicy(req, res, next) {
    const requiredPolicy = "update";
    const userHasPolicy = await checkPolicy(req, requiredPolicy);
    if (userHasPolicy) {
      next();
    } else {
      handleNoPermission(req, res, requiredPolicy);
    }
  }

  async checkRemovePolicy(req, res, next) {
    const requiredPolicy = "remove";
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
