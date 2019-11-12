const express = require("express");
const router = express.Router();

const scheduledJobController = require("../controllers/scheduled-jobs.controller");

router.put("/", scheduledJobController.updateJob);
router.get("/", scheduledJobController.filterJobs);
router.get("/getFutureJobs", scheduledJobController.getFutureJobs);
router.post("/", scheduledJobController.createJob);
router.delete("/:jobId", scheduledJobController.deleteJob);

module.exports = router;
