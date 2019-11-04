const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const userController = require("../controllers/user.controller");

router.get("/", userController.filter);

router.post("/", userController.createUser);

module.exports = router;