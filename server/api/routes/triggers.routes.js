const express = require("express");
const router = express.Router();

const triggerController = require("../controllers/triggers.controller");

router.get("/:mapId", triggerController.triggersList);
router.post("/:mapId/create", triggerController.triggerCreate);
router.delete("/:mapId/:triggerId", triggerController.triggerDelete);
router.put("/:mapId/:triggerId/update", triggerController.triggerUpdate);