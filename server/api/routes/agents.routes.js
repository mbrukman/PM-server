const express = require("express");
const router = express.Router();

const agentsController = require("../controllers/agents.controller");

router.get("/", agentsController.list);
router.get("/status", agentsController.status);
router.post("/add", agentsController.add);

router.get("/groups", agentsController.groupsList);
router.post("/groups", agentsController.groupsList);
router.put("/groups/:id/add-agent", agentsController.addAgentToGroup);
router.post("/groups/:id/add-filters", agentsController.addGroupFilters);
router.post("/groups/create", agentsController.createGroup);
router.get("/groups/:id", agentsController.groupDetail);
router.delete("/groups/:id/delete", agentsController.deleteGroup);

router.delete("/:id/delete", agentsController.delete);
router.put("/:id/update", agentsController.update);



module.exports = router;