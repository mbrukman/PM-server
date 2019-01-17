const express = require("express");
const router = express.Router();

const vaultController = require("../controllers/vaults.controller");

router.post("/", vaultController.vaultCreate);
router.put("/",vaultController.vaultList);
router.delete("/:vaultId", vaultController.vaultDelete);
router.put("/:vaultId", vaultController.vaultUpdatet);

module.exports = router;