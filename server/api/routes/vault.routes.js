const express = require("express");
const router = express.Router();

const vaultController = require("../controllers/vaults.controller");

router.post("/", vaultController.vaultCreate);
router.delete("/:vaultId", vaultController.vaultDelete);
router.put("/:vaultId", vaultController.vaultUpdatet);
router.get("/", vaultController.vaultList);


module.exports = router;