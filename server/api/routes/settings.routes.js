const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settings.controller");

router.get("/", settingsController.settings);
router.post("/db", settingsController.setupDbConnectionString);



module.exports = router;