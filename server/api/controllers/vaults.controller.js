const vaultsService = require("../services/vaults.service");
const winston = require("winston");
const fs = require('fs');
const env = require("../../env/enviroment")

const assert = require('assert');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';
const IV_LENGTH = 16; // For AES, this is always 16



function _encryption(value) {
    const key = fs.readFileSync(env.keyPath, 'utf-8');
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(value);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}


function _decryption(text) {
    const key = fs.readFileSync(env.keyPath, 'utf-8');
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText =  Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

module.exports = {
    vaultCreate: (req, res) => {
        x = req.body.value
        req.body.value = _encryption(req.body.value)
        y = _decryption(req.body.value)
        assert(x == y);

        vaultsService.create(req.body).then(vault => {
            req.io.emit('notification', {
                title: 'Vault saved',
                message: `${vault.name} saved successfully`,
                type: 'success',
            });
            return res.json(vault);
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Oh no..',
                message: `There was an error creating this vault`,
                type: 'error'
            });
            winston.log('error', "Error creating new vault", error);
            return res.status(500).json(error);
        });
    },

    vaultList: (req, res) => {
        vaultsService.list().then(x => {
            return res.send(x)
        });
    },

    vaultDelete: (req, res) => {
        vaultsService.delete(req.params.vaultId, req.body).then(() => {
            req.io.emit('notification', {
                title: 'Vault deleted',
                message: `vault deleted successfully`,
                type: 'success',
            });
            return res.status(204).send(true);
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Oh no..',
                message: `There was an error deleting this vault`,
                type: 'error'
            });
            winston.log('error', "Error deleting vault", error);
            return res.status(500).json(error);
        });

    },

    vaultUpdatet: (req, res) => {
        if(req.body.value){
            req.body.value = _encryption(req.body.value)
        }
        vaultsService.update(req.params.vaultId, req.body).then((vault) => {
            req.io.emit('notification', {
                title: 'Vault updated',
                message: `updated successfully`,
                type: 'success',
            });
            return res.json(vault);
        }).catch((error) => {
            req.io.emit('notification', {
                title: 'Oh no..',
                message: `There was an error updating this vault`,
                type: 'error'
            });
            winston.log('error', "Error updating vault", error);
            return res.status(500).json(error);
        });
    }
}