const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const userGroupController = require("../controllers/user-group.controller");
const iamMiddleware = require("../middleware/iam.middleware");

router.post(
  "/",
  iamMiddleware.checkCreatePermission,
  userGroupController.create
);
router.get("/", userGroupController.filter);
router.patch(
  "/",
  iamMiddleware.checkUpdatePermission,
  userGroupController.updateManyUserGroups
);

router.get("/:id", userGroupController.getOne);
router.patch(
  "/:id",
  iamMiddleware.checkUpdatePermission,
  userGroupController.patch
);
router.delete(
  "/:id",
  iamMiddleware.checkRemovePermission,
  userGroupController.remove
);

module.exports = router;
