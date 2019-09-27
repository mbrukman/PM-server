const jsf = require('json-schema-faker');
const Chance = require('chance');
const {ObjectId} = require('mongodb');

const chance = new Chance();
jsf.extend('chance', () => chance);

jsf.format('mongoID', () => new ObjectId().toString());

jsf.option('minLength', 5);

module.exports = {jsf};
