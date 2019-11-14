const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const userGroupController = require("../controllers/user-group.controller");

router.post("/", userGroupController.create);
router.get("/", userGroupController.filter);
router.patch("/", userGroupController.updateManyUserGroups);

router.get("/:id", userGroupController.getOne);
router.patch("/:id", userGroupController.patch);
router.delete("/:id", userGroupController.remove);

module.exports = router;
