const express = require('express');
const router = express.Router();

const autoCompleteController = require('../controllers/autocomplete.controller');

router.get('/:modelName', autoCompleteController.generateAutoComplete);
router.get('/:modelName/:key', autoCompleteController.getValueByKey);

module.exports = router;
