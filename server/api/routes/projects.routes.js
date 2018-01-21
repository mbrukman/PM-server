const express = require("express");
const router = express.Router();

const projectsController = require("../controllers/projects.controller");

router.get("/", projectsController.filter);
router.post("/create", projectsController.create);
router.get("/:id", projectsController.detail);
router.put("/:id/update", projectsController.update);
router.delete("/:id/delete", projectsController.delete);
router.get("/:id/archive", projectsController.archive);
router.get("/:projectId/add/:mapId", projectsController.addMap);


module.exports = router;