const express = require("express");
const router = express.Router();

const usersController = require("../controllers/user.controller");

router.post("/", usersController.filter);

module.exports = router;
