const express = require("express");
const router = express.Router();

const setupController = require("../controllers/setup.controller");

router.get("/issetup", setupController.isSetUp);
router.post("/db", setupController.setupDbConnectionString);



module.exports = router;