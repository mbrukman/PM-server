const userService = require("../services/user.service");
const winston = require("winston");
const _ = require("lodash");

function returnUserWithPickedFields(userDocument) {
  return _.pick(userDocument, [
    "_id",
    "name",
    "email",
    "groups",
    "createdAt",
    "phoneNumber",
    "changePasswordOnNextLogin"
  ]);
}

function parseQuery(req) {
  const { query } = req;
  if (typeof query.options === "string" && query.options) {
    query.options = JSON.parse(query.options);
  } else {
    query.options = {};
  }
  return query;
}

async function filter(req, res) {
  const query = parseQuery(req);
  try {
    return userService.filter(query).then(param => res.send(param));
  } catch (err) {
    console.log(err);
  }
}

async function deleteUser(req, res) {
  try {
    const userDeleted = await userService.deleteUser(req.params.id);
    req.io.emit("notification", {
      title: "User deleted",
      message: ``,
      type: "success"
    });
    return res.status(200).send(userDeleted);
  } catch (err) {
    req.io.emit("notification", {
      title: "Whoops..",
      message: `Error deleting user`,
      type: "error"
    });

    winston.log("error", "Error deleting user", err);
    return res.status(500).send(err);
  }
}

async function getUser(req, res) {
  const query = parseQuery(req);
  try {
    const user = await userService.getUser(req.params.id, query);
    if (!user) {
      return res.status(404).send("User not found");
    }
    return res.status(200).send(userService.returnUserWithPickedFields(user));
  } catch (err) {
    req.io.emit("notification", {
      title: "Whoops..",
      message: `Error getting user`,
      type: "error"
    });
    winston.log("error", "Error getting user", err);
    return res.status(500).send(err);
  }
}

function createUser(req, res) {
  userService
    .createUser(req.body)
    .then(createdUser => {
      req.io.emit("notification", {
        title: "User created",
        message: `${createdUser.name} created successfully`,
        type: "success"
      });
      return res
        .status(200)
        .send(userService.returnUserWithPickedFields(createdUser));
    })
    .catch(err => {
      req.io.emit("notification", {
        title: "Whoops",
        message: `Error: ${err}`,
        type: "error"
      });
      return res.status(400).json(err);
    });
}

async function updateManyUsers(req, res) {
  try {
    const { body } = req;
    const users = await userService.bulkUpdateUser(body);
    req.io.emit("notification", {
      title: "Users updated",
      message: `Users updated successfully`,
      type: "success"
    });
    return res.status(200).json(users);
  } catch (err) {
    req.io.emit("notification", {
      title: "Whoops..",
      message: `Error updating users`,
      type: "error"
    });

    winston.log("error", "Error updating users", err);
    return res.status(500).send(err);
  }
}

async function updateUser(req, res) {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    req.io.emit("notification", {
      title: "User updated",
      message: `${updatedUser.name} updated successfully`,
      type: "success"
    });
    return res
      .status(200)
      .send(userService.returnUserWithPickedFields(updatedUser));
  } catch (err) {
    req.io.emit("notification", {
      title: "Whoops..",
      message: `Error updating user`,
      type: "error"
    });

    winston.log("error", "Error updating user", err);
    return res.status(500).send(err);
  }
}

module.exports = {
  filter,
  createUser,
  deleteUser,
  updateManyUsers,
  updateUser,
  getUser
};
