const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vaultSchema = new Schema({
  key: {type: String, required: true, unique: true},
  description: String,
  value: {type: String, required: true},
});

vaultSchema.statics.autocompleteKey = 'key';
vaultSchema.statics.autocompleteValueField = 'key';

vaultSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  },
});

const Vault = mongoose.model('Vault', vaultSchema, 'vaults');


module.exports = Vault;
