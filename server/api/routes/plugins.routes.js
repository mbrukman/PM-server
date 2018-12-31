const path = require("path");
const express = require("express");
const pluginsController = require("../controllers/plugins.controller");
const multer = require('multer');
const env = require("../../env/enviroment");

let multerParams = {
    dest: path.join(env.static_cdn, env.upload_path)
};

const upload = multer(multerParams);

const router = express.Router();
router.get("/", pluginsController.pluginsList);
router.get("/:id", pluginsController.getPlugin);
router.delete("/:id/delete", pluginsController.pluginDelete);
router.post("/upload", upload.single('file'), pluginsController.pluginUpload);
router.post("/:id/settings", pluginsController.addSettings);
router.get("/:id/generateMethod/:name", pluginsController.generatePluginMethodParams);
router.get("/:id/generateSettings", pluginsController.generatePluginSettingsParams);

module.exports = router;

