const express = require('express');
const router = express.Router();

const triggerController = require('../controllers/triggers.controller');

router.get('/:mapId', triggerController.triggersList);
router.post('/:mapId', triggerController.triggerCreate);
router.delete('/:mapId/:triggerId', triggerController.triggerDelete);
router.put('/:mapId/:triggerId', triggerController.triggerUpdate);

module.exports = router;
