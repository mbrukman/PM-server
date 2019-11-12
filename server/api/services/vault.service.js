const fs = require("fs");
const crypto = require("crypto");

const Vault = require("../models/vault.model");
const createKey = require("../../helpers/create-key");

const algorithm = "aes-256-cbc";
const outputEncoding = "hex";
const IV_LENGTH = 16; // For AES, this is always 16

let key;

if (!fs.existsSync(global.kaholo.KEY_PATH)) {
  key = createKey.generateKey(global.kaholo.KEY_PATH);
} else {
  key = fs.readFileSync(global.kaholo.KEY_PATH, "utf-8");
}

module.exports = {
  create: vaultItem => {
    vaultItem.value = _encrypt(vaultItem.value);
    return Vault.create(vaultItem);
  },
  delete: vaultId => {
    return Vault.remove({ _id: vaultId });
  },
  list: () => {
    return Vault.find({}).select({ key: 1, description: 1 });
  },

  getByKey: key => {
    return Vault.find({ key: key });
  },
  getValueByKey: key => {
    return Vault.findOne({ key: key }).then(item => {
      return _decrypt(item.value);
    });
  },

  update: (vaultId, vaultItem) => {
    if (vaultItem.value) {
      vaultItem.value = _encrypt(vaultItem.value);
    }
    return Vault.findByIdAndUpdate(vaultId, vaultItem);
  }
};

function _encrypt(value) {
  const encryptionKey = key;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey),
    iv
  );
  let encrypted = cipher.update(value);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString(outputEncoding) + ":" + encrypted.toString(outputEncoding);
}

function _decrypt(text) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), outputEncoding);
  const encryptedText = Buffer.from(textParts.join(":"), outputEncoding);
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
