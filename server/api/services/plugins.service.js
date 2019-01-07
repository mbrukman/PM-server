const fs = require("fs");
const path = require("path");
const unzip = require("unzipper");
const child_process = require("child_process");
const winston = require("winston");
const del = require("del");
const env = require("../../env/enviroment");
const agentsService = require("./agents.service");
const models = require("../models");
const Plugin = models.Plugin;
const rimraf = require('rimraf')
var pluginConfigValidationSchema = require('../validation-schema/plugin-config.schema');
let pluginsPath = path.join(
  path.dirname(path.dirname(__dirname)),
  "libs",
  "plugins"
);
let pluginsTmpPath = path.join(
  path.dirname(path.dirname(__dirname)),
  "tmp",
  "plugins"
);

function installPluginOnAgent(pluginDir, obj) {
  agentsService.installPluginOnAgent(pluginDir);
}

function deletePluginOnAgent(name) {
  return agentsService.deletePluginOnAgent(name)
}

function deletePluginOnServer(name) {
  return new Promise((resolve, reject) => {
    rimraf(`server/libs/plugins/${name}`, (err, res) => {
      if (err) return reject(err)
      else return resolve(res)
    })
  })
}

function copyPluginImageFile(obj, extPath) {
  let outputPath = path.join(pluginsPath, obj.name);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  let srcImgPath = path.join(extPath, obj.imgUrl);
  let dstImgPath = path.join(outputPath, obj.imgUrl);

  fs.copyFileSync(srcImgPath, dstImgPath);
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
    let pluginModule = require(path.join(
      path.dirname(fullPath),
      path.basename(fullPath, path.extname(fullPath))
    ));
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
      .pipe(unzip.Extract({ path: outputPath }))
      .on("finish", () => {
        // when done unzipping, install the packages.
        console.log("Close");
        let cmd =
          "cd " + outputPath + " &&" + " npm install " + " && cd " + outputPath;
        child_process.exec(cmd, function (error, stdout, stderr) {
          if (error) {
            winston.log("error", "ERROR", error, stderr);
          }
          return resolve();
        });
      });
  });
}

// the function of file (should be an archived file), and process it to install plugin
function deployPluginFile(pluginPath, req) {
  return new Promise((resolve, reject) => {
    let extPath = path.join(pluginsTmpPath, "" + new Date().getTime());

    fs.createReadStream(pluginPath)
      .pipe(unzip.Extract({ path: extPath }))
      .on("finish", () => {
        let configPath = path.join(extPath, "config.json");
        fs.exists(configPath, exists => {
          if (!exists) return reject("No config file found!");

          fs.readFile(configPath, "utf8", (err, body) => {
            if (err) return reject("Error reading config file: ", err);

            let obj;
            try {
              obj = Object.assign({}, JSON.parse(body), { file: pluginPath });
            } catch (e) {
              return reject("Error parsing config file: ", e);
            }

            var valid = pluginConfigValidationSchema(obj)
            if (!valid) {
              return reject(err)
            }

            // check the plugin type
            Plugin.findOne({ name: obj.name })
              .then(plugin => {
                if (obj.settings)
                obj.settings = obj.settings.map(s=>{
                  s.valueType = s.type;
                  delete s.type;
                  return s;
                })
                if (!plugin) {
                  return Plugin.create(obj);
                }
                fs.unlink(plugin.file, function (error) {
                  if (error) {
                    winston.log("error", "Error unlinking old file");
                  } else {
                    winston.log("info", "Deleted old plugin file");
                  }
                });
                return Plugin.findByIdAndUpdate(plugin._id, obj);
              })
              .then(plugin => {
                if (obj.type === "executer") {
                  // copy image file
                  copyPluginImageFile(obj, extPath);
                  installPluginOnAgent(pluginPath, obj);
                  return plugin;
                } else if (
                  obj.type === "trigger" ||
                  obj.type === "module" ||
                  obj.type === "server"
                ) {
                  installPluginOnServer(pluginPath, obj).then(() => {
                    loadModule(plugin, req.app);
                    return plugin;
                  });
                } else return reject("No type was provided for this plugin");
              }).then(plugin => {
                resolve(plugin);
              }).catch(error => {
                winston.log("error", "Error creating plugin", error);
                console.log("error deployPluginFile  : ",error);
                

                return reject(error);
              }).finally(() => {
                // delete extracted tmp dir
                del([extPath]).then(() => {
                  winston.log("info", "Deleted extracted directory");
                }).catch(err => {
                  winston.log("error", "Error deleting extracted directory");
                });
              });
          });
        });
      });
  });
}

module.exports = {
  filterPlugins: (query = {}) => {
    return Plugin.find(query);
  },
  createPlugin: deployPluginFile,
  /* get all plugins files from the static dir, and installs them on agent */
  // TODO: delete old files/save the file location at db to install it? Right now, if a plugin is deleted it would reinstall it
  loadPlugins: () => {
    console.log("Loading plugins");
    fs.readdir(path.join(env.static_cdn, env.upload_path), (err, files) => {
      Promise.all(files.map((plugin) => {
        return new Promise((resolve, reject) => {
          let filePath = path.join(env.static_cdn, env.upload_path, plugin);
          deployPluginFile(filePath)
            .then(() => { })
            .catch(error => {
              winston.log("error", "Error installing plugin: ", error);
            });
          resolve();
        })
      }))
    });
  },

  pluginDelete: id => {
    return Plugin.findById(id).then((obj) => {
      if (obj.type === "executer")
        return deletePluginOnAgent(obj.name)
      else
        return deletePluginOnServer(obj.name);
    }).finally(() => {
      return Plugin.remove({ _id: id });
    })
  },
  deletePluginByPath(path) {
    return Plugin.findOne({ file: path }).then((plugin)=>{
      if(plugin)
        return pluginDelete(plugin.id)
      
    });
  },
  getPlugin: id => {
    return Plugin.findOne({ _id: id });
  },
  /* load server plugins modules */
  loadModules: app => {
    Plugin.find({ type: { $in: ["module", "trigger", "server"] } }).then(
      plugins => {
        plugins.forEach(plugin => {
          loadModule(plugin, app);
        });
      }
    );
  },

  updateSettings:(id,settings)=>{
    return new Promise((resolve,reject) => {
      return Plugin.findOne({_id:id})
      .then((plugin) => {
        for(let i=0, length=plugin.settings.length; i<length; i++){
          plugin.settings[i].value = settings[Object.keys(settings)[i]]
        }
        plugin.save()
        .then((res) => {
          resolve(res)
        })
        .catch((e) => {
          reject(e)
        })
      })
    })
  },
  /**
   * Generating autocomplete plugin options
   * @param pluginId
   * @param methodName
   */
  generatePluginParams: (pluginId, methodName) => {
    return module.exports.getPlugin(pluginId).then(plugin => {

      plugin = JSON.parse(JSON.stringify(plugin));
      let method = plugin.methods.find(o => o.name === methodName);
      let paramsToGenerate = method.params.filter(
        o => o.type === "autocomplete"
      );
      let promises = paramsToGenerate.map(param => _generateAutocompleteParams(param))
      return Promise.all(promises).finally(() => {
        return paramsToGenerate;
      })
    });
  }

};

function _generateAutocompleteParams(param) {
  return models[param.model]
    .find(param.query || {})
    .select(param.propertyName)
    .then(options => {
      param.options = options.map(o => ({
        id: o._id,
        value: o[param.propertyName]
      }));
    });
}