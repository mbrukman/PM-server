const jsf = require('json-schema-faker');
const chance = require('chance').Chance();
const {ObjectId} = require('mongodb');

jsf.extend('chance', () => chance);

jsf.format('mongoID', () => new ObjectId().toString());

module.exports = {jsf};
