const express = require("express");
const router = express.Router();

const agentsController = require("../controllers/agents.controller");

router.get("/", agentsController.list);
router.get("/status", agentsController.status);
router.post("/add", agentsController.add);
router.delete("/:id/delete", agentsController.delete);
router.put("/:id/update", agentsController.update);



module.exports = router;