const userService = require("../services/user.service");
const winston = require("winston");

function filter(req, res) {
  const params = JSON.parse(JSON.stringify(req.query));
  params.options = JSON.parse(params["options"]);
  userService.filter(params).then(x => {
    return res.send(x);
  });
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

function createUser(req, res) {
  userService
    .createUser(req.body)
    .then(createdUser => {
      req.io.emit("notification", {
        title: "User created",
        message: `${createdUser.name} created successfully`,
        type: "success"
      });
      res.json(createdUser);
    })
    .catch(err => {
      req.io.emit("notification", {
        title: "Whoops",
        message: `Error: ${err}`,
        type: "error"
      });
      res.status(400).json(err);
    });
}

async function updateUser(req, res) {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    req.io.emit("notification", {
      title: "User updated",
      message: `${updatedUser.name} updated successfully`,
      type: "success"
    });
    return res.status(200).send(updatedUser);
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
  updateUser
};
