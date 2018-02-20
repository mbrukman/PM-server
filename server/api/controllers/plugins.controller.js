const path = require("path");
const winston = require("winston");
const _ = require("lodash");


const pluginsService = require("../services/plugins.service");
const hooks = require("../../libs/hooks/hooks");


module.exports = {
    /**
     * Get a list of all plugins
     * @param req
     * @param res
     */
    pluginsList: (req, res) => {
        hooks.hookPre('plugin-list', req).then(() => {
            return pluginsService.filterPlugins({});
        }).then((plugins) => {
            return res.json(plugins);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops', message: `We couldn't get plugins list`, type: 'error' });
            winston.log('error', "Error filtering plugins", error);
            return res.status(500).send(error);
        })

    },

    /**
     * Creating a new plugin
     * @param req
     * @param res
     * @returns {*|undefined|void|boolean}
     */
    pluginUpload: (req, res) => {
        let file = req.file;
        let extension = path.extname(file.originalname);
        if (extension && _.indexOf([".zip", ".rar"], extension) === -1) {
            return res.status(500).send("Bad foramt")
        }
        hooks.hookPre('plugin-create', req).then(() => {
            return pluginsService.createPlugin(req.file.path, req);
        }).then((obj) => {
            req.io.emit('notification', {
                title: 'Installed plugin',
                message: `You can now use this plugin`,
                type: 'success'
            });
            return res.json(obj);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops', message: `Error while installing plugin`, type: 'error' });
            winston.log('error', "Error uploading plugin", error);
            return res.status(500).send(error);
        })
    },

    /**
     * Deleting a plugin
     * @param req
     * @param res
     */
    pluginDelete: (req, res) => {
        hooks.hookPre('plugin-delete', req).then(() => {
            return pluginsService.pluginDelete(req.params.id)
        }).then(() => {
            req.io.emit('notification', { title: 'Plugin deleted', message: ``, type: 'success' });
            return res.status(200).send();
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops', message: `Error deleting plugin`, type: 'error' });
            winston.log('error', "Error deleting plugin", error);
            return res.status(500).send(error);
        });
    },

    /**
     * Generating plugin autocomplete params
     * @param req
     * @param res
     */
    generatePluginParams: (req, res) => {
        hooks.hookPre('plugin-generate-params').then(() => {
            return pluginsService.generatePluginParams(req.params.id, req.params.name)
        }).then((generated) => {
            return res.json(generated);
        }).catch(error => {
            req.io.emit('notification', { title: 'Whoops', message: `Error deleting plugin`, type: 'error' });
            winston.log('error', "Error generating plugin params", error);
            return res.status(500).send(error);
        });
    }
};