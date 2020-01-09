const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const termsOfUseController = require("../controllers/terms-of-use.controller");

router.post("/", termsOfUseController.acceptTos);
router.get("/", termsOfUseController.getTos);

module.exports = router;
