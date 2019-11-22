const _ = require("lodash");
const userService = require("../services/user.service");

async function checkPolicy(req, requiredPermission) {
  const user = await userService.getUser(req.user);
  if (user.isAdmin === true) {
    return true;
  }
  const permissionFoundInUser = _.get(
    user.toObject(),
    "iamPolicy.permissions." + requiredPermission
  );

  // for each group user belongs to, look for permissions
  const permissionFoundInUserGroups = user.groups
    .toObject()
    .map(group => group.iamPolicy.permissions)
    .find(permissions => permissions[requiredPermission] === true)[
    requiredPermission
  ];

  return permissionFoundInUser === true || permissionFoundInUserGroups === true;
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
  async checkCreatePermission(req, res, next) {
    const requiredPermission = "create";
    const userHasPermission = await checkPolicy(req, requiredPermission);
    if (userHasPermission) {
      next();
    } else {
      handleNoPermission(req, res, requiredPermission);
    }
  }

  async checkReadPermission(req, res, next) {
    const requiredPermission = "read";
    const userHasPermission = await checkPolicy(req, requiredPermission);
    if (userHasPermission) {
      next();
    } else {
      handleNoPermission(req, res, requiredPermission);
    }
  }

  async checkUpdatePermission(req, res, next) {
    const requiredPermission = "update";
    const userHasPermission = await checkPolicy(req, requiredPermission);
    if (userHasPermission) {
      next();
    } else {
      handleNoPermission(req, res, requiredPermission);
    }
  }

  async checkRemovePermission(req, res, next) {
    const requiredPermission = "remove";
    const userHasPermission = await checkPolicy(req, requiredPermission);
    if (userHasPermission) {
      next();
    } else {
      handleNoPermission(req, res, requiredPermission);
    }
  }
}

const iamMiddleware = new IAMMiddleware();

module.exports = iamMiddleware;
