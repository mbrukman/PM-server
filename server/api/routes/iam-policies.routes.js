const { Router } = require("express");
const iamPoliciesController = require("../controllers/iam-policies.controller");

// eslint-disable-next-line new-cap
const router = Router();

router.patch("/:id", iamPoliciesController.updatePolicy);

module.exports = router;
