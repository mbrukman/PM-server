const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const userGroupController = require("../controllers/user-group.controller");
const iamMiddleware = require("../middleware/iam.middleware");

router.post("/", iamMiddleware.checkCreatePolicy, userGroupController.create);
router.get("/", userGroupController.filter);
router.patch(
  "/",
  iamMiddleware.checkUpdatePolicy,
  userGroupController.updateManyUserGroups
);

router.get("/:id", userGroupController.getOne);
router.patch(
  "/:id",
  iamMiddleware.checkUpdatePolicy,
  userGroupController.patch
);
router.delete(
  "/:id",
  iamMiddleware.checkRemovePolicy,
  userGroupController.remove
);

module.exports = router;
