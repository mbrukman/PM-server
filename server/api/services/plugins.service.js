const fs = require("fs");
const path = require('path');
const unzip = require('unzip');
const streams = require('memory-streams');
const child_process = require("child_process");
const async = require("async");

const env = require("../../env/enviroment");
const agentsService = require("./agents.service");
let Plugin = require("../models/plugin.model");


let pluginsPath = path.join(path.dirname(path.dirname(__dirname)), "libs", "plugins");

function installPluginOnAgent(pluginDir, obj) {
    let outputPath = path.join(pluginsPath, obj.name);
    if (!fs.existsSync(outputPath)) {
        console.log("Creating directory");
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
    let fullPath = path.join(pluginsPath, plugin.name, plugin.main);
    plugin.dir = path.dirname(fullPath);
    let pluginModule = require("../../libs/plugins/GithubTrigger/app");
    plugin.methods.forEach(method => {
        if (method.route) {
            let route = method.route.split(" ");
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
    });
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
            let cmd = 'cd ' + outputPath + ' &&' + ' npm install ' + " && cd " + outputPath;
            child_process.exec(cmd, function (error, stdout, stderr) {
                if (error) {
                    console.log("ERROR", error, stderr);
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
                            obj = JSON.parse(body);
                        } catch (e) {
                            return reject("Error parsing config file: ", e);
                        }

                        // check the plugin type
                        Plugin.findOne({ name: obj.name }).then((plugin) => {
                            if (!plugin) {
                                return Plugin.create(obj)
                            }
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
                            console.log("Error creating plugin", error);
                            reject(error);
                        });

                    });
                } else {
                    entry.autodrain();
                    resolve();
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
                        console.log("Error installing plugin: ", error);
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
        console.log("load modules");
        Plugin.find({ type: { $in: ['module', 'trigger', 'server'] } }).then(plugins=> {
            plugins.forEach(plugin => {
                loadModule(plugin, app);
            })
        })
    }
};