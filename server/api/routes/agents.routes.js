const express = require("express");
const router = express.Router();

const agentsController = require("../controllers/agents.controller");

router.get("/", agentsController.list);
router.get("/status", agentsController.status);
router.post("/add", agentsController.add);

router.get("/groups", agentsController.groupsList);
router.post("/groups", agentsController.groupsList);
router.put("/groups/:id/add-agent", agentsController.addAgentToGroup);
router.put("/groups/:id", agentsController.updateGroup);
router.post("/groups/:id/add-filters", agentsController.addGroupFilters);
router.post("/groups/create", agentsController.createGroup);
router.get("/groups/:id", agentsController.groupDetail);
router.delete("/groups/:id", agentsController.deleteGroup);
router.post("/groups/:id/remove-agent", agentsController.removeAgentFromGroup);
router.delete(
  "/groups/:groupId/filters/:index",
  agentsController.deleteFilterFromGroup
);
router.delete("/:id", agentsController.delete);
router.put("/:id", agentsController.update);

module.exports = router;
