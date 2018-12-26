const express = require("express");
const router = express.Router();

const mapController = require("../controllers/maps.controller");

router.post("/", mapController.filter);
router.post("/create", mapController.create);
// router.post("/generate", mapController.generate);
router.get("/results/:limit", mapController.dashboard);
router.get("/currentruns", mapController.currentRuns);
router.delete("/:id", mapController.mapDelete);
router.get("/:id", mapController.detail);

/* map execution */
router.get("/:id/execute", mapController.execute);
router.post("/:id/execute", mapController.execute);
router.get("/:id/execute/:structure", mapController.execute);
router.post("/:id/execute/:structure", mapController.execute);
router.get("/:id/stop-execution", mapController.stopExecution);
router.get("/:id/stop-execution/:runId", mapController.stopExecution);
router.post("/:id/cancel-pending", mapController.cancelPending);
router.get("/:id/results", mapController.results);
router.get("/:id/results/logs", mapController.logs);
router.get("/:id/results/:resultId", mapController.resultDetail);
router.get("/:id/results/:resultId/logs", mapController.logs);
router.put("/:id/update", mapController.update);
router.put("/:id/archive", mapController.archive);

/* map structure */
router.get("/:id/structure", mapController.getMapStructure);
router.get("/:id/structures", mapController.getStructureList);
router.post("/:id/structure/create", mapController.createStructure);
router.get("/:id/structure/:structureId", mapController.getMapStructure);
router.post("/:id/structure/:structureId/duplicate", mapController.duplicateMap);
module.exports = router;