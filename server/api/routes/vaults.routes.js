const express = require("express");
const router = express.Router();

const vaultsController = require("../controllers/vaults.controller");

router.post("/", vaultsController.vaultCreate);
router.get("/",vaultsController.vaultList);
router.delete("/:vaultId", vaultsController.vaultDelete);
router.put("/:vaultId", vaultsController.vaultUpdatet);

module.exports = router;