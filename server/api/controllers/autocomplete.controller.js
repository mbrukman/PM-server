const winston = require('winston');
const _ = require('lodash');
const autoCompleteService = require('../services/autocomplete.service');
const hooks = require('../../libs/hooks/hooks');

module.exports = {

  /**
     * Generating plugin autocomplete params
     * @param req
     * @param res
     */
  generateAutoComplete: (req, res) => {
    const query = req.query;
    const model = req.params.modelName;
    hooks.hookPre('plugin-generate-params').then(() => {
      return autoCompleteService.generateAutoComplete(model, query);
    }).then((generated) => {
      return res.json(generated);
    }).catch((error) => {
      req.io.emit('notification', {title: 'Whoops', message: `Error generate autocomplete`, type: 'error'});
      winston.log('error', 'Error generating plugin params', error);
      return res.status(500).send(error);
    });
  },

  getValueByKey: (req, res) => {
    hooks.hookPre('plugin-generate-params').then(() => {
      return autoCompleteService.getValueByKey(req.params.key, req.params.modelName);
    }).then((value) => {
      return res.json(value);
    }).catch((error) => {
      req.io.emit('notification', {title: 'Whoops', message: `Error generate autocomplete`, type: 'error'});
      winston.log('error', 'Error generating plugin params', error);
      return res.status(500).send(error);
    });
  },

};
