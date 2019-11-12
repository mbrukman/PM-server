const express = require("express");
const router = express.Router();
const configTokenController = require("../controllers/config-token.controller");

router.put("/", configTokenController.createToken);

module.exports = router;
