const vaultsService = require("../services/vault.service");
const winston = require("winston");

module.exports = {
  vaultCreate: (req, res) => {
    vaultsService
      .create(req.body)
      .then(vault => {
        req.io.emit("notification", {
          title: "Vault saved",
          message: `${vault.key} saved successfully`,
          type: "success"
        });
        return res.json(vault);
      })
      .catch(error => {
        req.io.emit("notification", {
          title: "Oh no..",
          message: `There was an error creating this vault`,
          type: "error"
        });
        winston.log("error", "Error creating new vault", error);
        return res.status(500).json(error);
      });
  },

  vaultList: (req, res) => {
    vaultsService.list().then(x => {
      return res.send(x);
    });
  },

  vaultDelete: (req, res) => {
    vaultsService
      .delete(req.params.vaultId, req.body)
      .then(() => {
        req.io.emit("notification", {
          title: "Vault deleted",
          message: `vault deleted successfully`,
          type: "success"
        });
        return res.status(204).send(true);
      })
      .catch(error => {
        req.io.emit("notification", {
          title: "Oh no..",
          message: `There was an error deleting this vault`,
          type: "error"
        });
        winston.log("error", "Error deleting vault", error);
        return res.status(500).json(error);
      });
  },

  vaultUpdatet: (req, res) => {
    vaultsService
      .update(req.params.vaultId, req.body)
      .then(vault => {
        req.io.emit("notification", {
          title: "Vault updated",
          message: `updated successfully`,
          type: "success"
        });
        return res.json(vault);
      })
      .catch(error => {
        req.io.emit("notification", {
          title: "Oh no..",
          message: `There was an error updating this vault`,
          type: "error"
        });
        winston.log("error", "Error updating vault", error);
        return res.status(500).json(error);
      });
  }
};
