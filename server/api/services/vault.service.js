const fs = require('fs');
const crypto = require('crypto');

const Vault = require("../models/vault.model");
const env = require('../../env/enviroment');
const createKey = require("../../helpers/create-key");

const algorithm = 'aes-256-cbc';
const outputEncoding = 'hex';
const IV_LENGTH = 16; // For AES, this is always 16

let key;

if (!fs.existsSync(env.keyPath)) {
    key = createKey.generateKey(env.keyPath);
} else {
    key = fs.readFileSync(env.keyPath, 'utf-8');
}

module.exports = {
    create: (vaultItem) => {
        vaultItem.value = _encrypt(vaultItem.value);
        return Vault.create(vaultItem)
    },
    delete: (vaultId) => {
        return Vault.remove({ _id: vaultId })
    },

    getByKey: (key) => {
        return Vault.find({ key: key })
    },
    getValueByKey: (key) => {
        return Vault.findOne({ key: key }).then(item=>{
            return _decrypt(item.value);
        })
    },

    list: (options) => {
        let queryObj = {};
        let fields = options.fields || 'key description'
        if (options.query) {
            queryObj.key = { $regex: options.query, $options: 'i' }
        }
        query = Vault.find(queryObj, fields);
        if (options.limit)
            query.limit(options.limit);

        return query;
    },
    update: (vaultId, vaultItem) => {
        if (vaultItem.value)
            vaultItem.value = _encrypt(vaultItem.value);
        return Vault.findByIdAndUpdate(vaultId, vaultItem)
    }
};

function _encrypt(value) {
    let encryptionKey = key;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString(outputEncoding) + ':' + encrypted.toString(outputEncoding);
}


function _decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), outputEncoding);
    let encryptedText = Buffer.from(textParts.join(':'), outputEncoding);
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}