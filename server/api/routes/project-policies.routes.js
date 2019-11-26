const express = require("express");
const projectPolicyController = require("../controllers/project-policy.controller");

// eslint-disable-next-line new-cap
const router = express.Router();

router.get("/:id", projectPolicyController.getOne);

module.exports = router;
