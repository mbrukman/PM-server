const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/login", authController.login);

module.exports = router;
