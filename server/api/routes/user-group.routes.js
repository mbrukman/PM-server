const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const userGroupController = require("../controllers/user-group.controller");

router.post("/", userGroupController.create);
router.post("/filter", userGroupController.filter);

module.exports = router;
