const fs = require("fs");
const path = require('path');
const unzip = require('node-unzip-2');
const streams = require('memory-streams');
const child_process = require("child_process");
const async = require("async");
const winston = require("winston");


const env = require("../../env/enviroment");
const agentsService = require("./agents.service");
// let Plugin = require("../models/plugin.model");
const models = require("../models");
const Plugin = models.Plugin;

let pluginsPath = path.join(path.dirname(path.dirname(__dirname)), "libs", "plugins");

function installPluginOnAgent(pluginDir, obj) {
    let outputPath = path.join(pluginsPath, obj.name);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    // unzipping the img
    fs.createReadStream(pluginDir)
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
            let fileName = entry.path;
            if (fileName === obj.imgUrl) {
                entry.pipe(fs.createWriteStream(path.join(outputPath, fileName)));
            }
        });
    agentsService.installPluginOnAgent(pluginDir);
}

/*
 * load plugin module.
 * the function get a plugin (db model) and the express app (can be found in req.app).
 * then it will load and map the routing of the plugin.
 * this enables dynamic loading of plugin routes.
 * */
function loadModule(plugin, app) {
    const wildcard = app._router.stack.pop(); // the wildcard point to the angular app and it should always be the last route in the router stack

    try {
        let fullPath = path.join(pluginsPath, plugin.name, plugin.main);
        plugin.dir = path.dirname(fullPath);
        let pluginModule = require(path.join(path.dirname(fullPath), path.basename(fullPath, path.extname(fullPath))));
        plugin.methods.forEach(method => {
            if (method.route) {
                let route = method.route.split(" ");
                if (route.length === 2) {
                    if (route[0] === "post" || route[0] === "*") {
                        app.post(route[1], pluginModule[method.name]);
                    } else if (route[0] === "get" || route[0] === "*") {
                        app.get(route[1], pluginModule[method.name]);
                    } else if (route[0] === "put" || route[0] === "*") {
                        app.put(route[1], pluginModule[method.name]);
                    } else if (route[0] === "delete" || route[0] === "*") {
                        app.delete(route[1], pluginModule[method.name]);
                    }
                }
            }
        });
    } catch (e) {
        console.log("Error binding new routes", e);
    }

    app._router.stack.push(wildcard);
}

function installPluginOnServer(pluginDir, obj) {
    return new Promise((resolve, reject) => {
        let outputPath = path.join(pluginsPath, obj.name);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }

        // unziping the file and installing the modules
        fs.createReadStream(pluginDir)
            .pipe(unzip.Parse())
            .on('entry', (entry) => {
                let fileName = entry.path;
                entry.pipe(fs.createWriteStream(path.join(outputPath, fileName)));
            }).on('close', (data) => {
            // when done unzipping, install the packages.
            console.log("Close");
            let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
            child_process.exec(cmd, function (error, stdout, stderr) {
                if (error) {
                    winston.log('error', "ERROR", error, stderr);
                }
                return resolve();
            });
        });
    });
}

// the function of file (should be an archived file), and process it to install plugin
function deployPluginFile(pluginPath, req) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(pluginPath)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                let fileName = entry.path;
                if (fileName === 'config.json') {
                    let writer = new streams.WritableStream();
                    entry.pipe(writer);
                    let body = '';
                    entry.on('data', (chunk) => {
                        body += chunk;
                    });

                    entry.on('end', () => {
                        let obj;
                        try {
                            obj = Object.assign({}, JSON.parse(body), { file: pluginPath });
                        } catch (e) {
                            return reject("Error parsing config file: ", e);
                        }

                        // check the plugin type
                        Plugin.findOne({ name: obj.name }).then((plugin) => {
                            if (!plugin) {
                                return Plugin.create(obj)
                            }
                            fs.unlink(plugin.file, function (error) {
                                if (error) {
                                    winston.log('error', "Error unlinking old file");
                                } else {
                                    winston.log('info', "Deleted old plugin file");
                                }
                            });
                            return Plugin.findByIdAndUpdate(plugin._id, obj)
                        }).then((plugin) => {
                            if (obj.type === "executer") {
                                installPluginOnAgent(pluginPath, obj);
                                resolve(plugin);
                            }
                            else if (obj.type === "trigger" || obj.type === "module" || obj.type === "server") {
                                installPluginOnServer(pluginPath, obj).then(() => {
                                    loadModule(plugin, req.app);
                                    resolve(plugin);
                                });
                            }
                            else
                                return reject("No type was provided for this plugin");
                        }).catch((error) => {
                            winston.log('error', "Error creating plugin", error);
                            return reject(error);
                        });

                    });
                } else {
                    entry.autodrain();
                }
            });
    });
}

module.exports = {
    filterPlugins: (query = {}) => {
        return Plugin.find(query)
    },
    createPlugin: deployPluginFile,
    /* get all plugins files from the static dir, and installs them on agent */
    // TODO: delete old files/save the file location at db to install it? Right now, if a plugin is deleted it would reinstall it
    loadPlugins: () => {
        console.log("Loading plugins");
        fs.readdir(path.join(env.static_cdn, env.upload_path), (err, files) => {
            async.each(files,
                function (plugin, callback) {
                    let filePath = path.join(env.static_cdn, env.upload_path, plugin);
                    deployPluginFile(filePath).then(() => {
                    }).catch(error => {
                        winston.log('error', "Error installing plugin: ", error);
                    });
                    callback();
                },
                function (err) {
                });
        });
    },
    pluginDelete: (id) => {
        return Plugin.remove({ _id: id })
    },
    getPlugin: (id) => {
        return Plugin.findOne({ _id: id })
    },
    /* load server plugins modules */
    loadModules: (app) => {
        Plugin.find({ type: { $in: ['module', 'trigger', 'server'] } }).then(plugins => {
            plugins.forEach(plugin => {
                loadModule(plugin, app);
            })
        })
    },
    /**
     * Generating autocomplete plugin options
     * @param pluginId
     * @param methodName
     */
    generatePluginParams: (pluginId, methodName) => {
        return module.exports.getPlugin(pluginId).then((plugin) => new Promise((resolve, reject) => {
            plugin = JSON.parse(JSON.stringify(plugin));
            let method = plugin.methods.find((o) => o.name === methodName);
            let paramsToGenerate = method.params.filter((o) => o.type === 'autocomplete');
            async.each(paramsToGenerate, (param, callback) => {
                models[param.model].find((param.query || {})).select(param.propertyName).then((options) => {
                    param.options = options.map((o) => ({ id: o._id, value: o[param.propertyName] }));
                    return callback();
                });
            }, (error) => {
                resolve(paramsToGenerate);
            })
        }));
    }
};