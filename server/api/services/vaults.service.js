const Vault = require("../models/vault.model");

module.exports = {
    create: (vault) => {
        return Vault.create(vault)
    },
    delete: (vaultId) => {
        return Vault.remove({ _id: vaultId })
    },
    list: () => {
        return Vault.find({}, 'name description')
    },
    update: (vaultId, vault) => {
        return Vault.findByIdAndUpdate(vaultId, vault)
    }
};