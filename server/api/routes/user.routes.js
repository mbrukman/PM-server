const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
const userController = require("../controllers/user.controller");
const iamMiddleware = require("../middleware/iam.middleware");

router.get("/", userController.filter);
router.post("/", iamMiddleware.checkCreatePolicy, userController.createUser);
router.delete(
  "/:id",
  iamMiddleware.checkRemovePolicy,
  userController.deleteUser
);
router.patch(
  "/:id",
  iamMiddleware.checkUpdatePolicy,
  userController.updateUser
);
router.patch(
  "/",
  iamMiddleware.checkUpdatePolicy,
  userController.updateManyUsers
);
router.get("/:id", userController.getUser);
router.post("/reset-password", userController.resetPassword);

module.exports = router;
