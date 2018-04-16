const express = require("express");
const router = express.Router();

const mapController = require("../controllers/maps.controller");

router.get("/", mapController.filter);
router.post("/create", mapController.create);
router.post("/generate", mapController.generate);
router.get("/jobs", mapController.filterJobs); // scheduled jobs route
router.get("/results", mapController.dashboard);
router.get("/currentruns", mapController.currentRuns);
router.put("/scheduledJob/updateJob", mapController.updateJob);
router.delete("/jobs/:jobId/delete", mapController.deleteJob);

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
router.get("/:id/archive", mapController.archive);

/* map structure */
router.get("/:id/structure", mapController.getMapStructure);
router.get("/:id/structures", mapController.getStructureList);
router.post("/:id/structure/create", mapController.createStructure);
router.get("/:id/structure/:structureId", mapController.getMapStructure);
router.post("/:id/structure/:structureId/duplicate", mapController.duplicateMap);

/* map triggers */
router.get("/:id/triggers", mapController.triggersList);
router.post("/:id/triggers/create", mapController.triggerCreate);
router.delete("/:id/triggers/:triggerId/delete", mapController.triggerDelete);
router.put("/:id/triggers/:triggerId/update", mapController.triggerUpdate);

/* schedule jobs - should be updated */
router.post("/:id/jobs/create", mapController.createJob);
router.delete("/:id/jobs/:jobId/delete", mapController.deleteJob);

module.exports = router;