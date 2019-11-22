const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
const userController = require("../controllers/user.controller");
const iamMiddleware = require("../middleware/iam.middleware");

router.get("/", userController.filter);
router.post(
  "/",
  iamMiddleware.checkCreatePermission,
  userController.createUser
);
router.delete(
  "/:id",
  iamMiddleware.checkRemovePermission,
  userController.deleteUser
);
router.patch(
  "/:id",
  iamMiddleware.checkUpdatePermission,
  userController.updateUser
);
router.patch(
  "/",
  iamMiddleware.checkUpdatePermission,
  userController.updateManyUsers
);
router.get("/:id", userController.getUser);
router.post("/reset-password", userController.resetPassword);

module.exports = router;
