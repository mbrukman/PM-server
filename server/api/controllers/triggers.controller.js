const winston = require('winston');
const triggersService = require('../services/triggers.service');
const hooks = require('../../libs/hooks/hooks');

module.exports = {
  /* create trigger */
  triggerCreate: (req, res) => {
    hooks.hookPre('trigger-create', req).then(() => {
      return triggersService.create(req.params.mapId, req.body);
    }).then((trigger) => {
      req.io.emit('notification', {
        title: 'Trigger saved',
        message: `${trigger.name} saved successfully`,
        type: 'success',
        mapId: req.params.mapId,
      });

      return res.json(trigger);
    }).catch((error) => {
      winston.log('error', 'Error getting map\'s triggers', error);
      return res.status(500).json(error);
    });
  },
  /* delete a trigger */
  triggerDelete: (req, res) => {
    hooks.hookPre('trigger-delete', req).then(() => {
      return triggersService.delete(req.params.triggerId);
    }).then((response) => {
      if (!response.n) return res.status(500).send({message: 'Trigger not found'});
      req.io.emit('notification', {
        title: 'Trigger deleted',
        message: ``,
        type: 'success',
        mapId: req.params.mapId,
      });

      return res.send('OK');
    }).catch((error) => {
      req.io.emit('notification', {
        title: 'Error deleting',
        message: `We couldn't delete this trigger`,
        type: 'error',
        mapId: req.params.mapId,
      });
      winston.log('error', 'Error getting map\'s triggers', error);
      return res.status(500).json(error);
    });
  },
  /* get triggers list for given map */
  triggersList: (req, res) => {
    hooks.hookPre('trigger-list', req).then(() => {
      return triggersService.list(req.params.mapId);
    }).then((triggers) => {
      return res.json(triggers);
    }).catch((error) => {
      winston.log('error', 'Error getting map\'s triggers', error);
      return res.status(500).json(error);
    });
  },
  /* update a trigger */
  triggerUpdate: (req, res) => {
    hooks.hookPre('trigger-update', req).then(() => {
      return triggersService.update(req.params.triggerId, req.body);
    }).then((trigger) => {
      req.io.emit('notification', {
        title: 'Trigger saved',
        message: `${trigger.name} saved successfully`,
        type: 'success',
        mapId: req.params.mapId,
      });

      return res.json(trigger);
    }).catch((error) => {
      winston.log('error', 'Error updating triggers', error);
      return res.status(500).json(error);
    });
  },
};
