const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const tosController = require("../controllers/tos.controller");

router.post("/", tosController.acceptTos);
router.get("/", tosController.getTos);

module.exports = router;
