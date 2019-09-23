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


function deleteContent(path){
  return del([path],{force: true})
  .then((paths) => {
    winston.log("info", "deleted static file", paths);
  })
  .catch((error) => {
    winston.log("error", "Error deleted extracted directory", error);
  });
}


// the function of file (should be an archived file), and process it to install plugin
function deployPluginFile(pluginPath, req) {
  return new Promise((resolve, reject) => {
    let extPath = path.join(pluginsTmpPath, "" + new Date().getTime());

    fs.createReadStream(pluginPath)
      .pipe(unzip.Extract({ path: extPath }))
      .on("finish", () => {
        let configPath =  path.join(extPath, "config.json");
        fs.exists(configPath, exists => {
            try{
              if (!exists){
                throw "No config file found!"
              }
            }
            catch(e){
              deleteContent(pluginPath);
              deleteContent(extPath);
              return reject(e)
            }
            fs.readFile(configPath, "utf8", (err, body) => {
              try{
                if (err) {
                  throw "Error reading config file: "+ err
                }
    
                let obj;
  
                try {
                  obj = Object.assign({}, JSON.parse(body), { file: pluginPath });
                } catch (e) {
                  throw "Error parsing config file: "+e;
                }
                
  
                var valid = pluginConfigValidationSchema(obj)
                if (!valid) {
                  throw err
                }
    
                // check the plugin type
                let oldFile;
                Plugin.findOne({ name: obj.name })
                  .then(plugin => {
                    if (obj.settings){
                      obj.settings = obj.settings.map(s => {
                        s.valueType = s.type;
                        delete s.type;
                        if(plugin && plugin.settings){
                          for (let i=0, length=plugin.settings.length; i<length; i++){
                            if (s.name == plugin.settings[i].name)
                              s.value = plugin.settings[i].value;
                          }
                        }
                        return s;
                      })
                    }
                    if (!plugin) {
                      return Plugin.create(obj);
                    }
                    oldFile = plugin.file;
                    return Plugin.findByIdAndUpdate(plugin._id, obj);
                  })
                  .then(plugin => {
                    if(oldFile){
                      deleteContent(oldFile);
                      deleteContent(extPath);
                    }
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
                    console.log("error deployPluginFile  : ", error);
                    deleteContent(pluginPath);
                    deleteContent(extPath);
                    return reject(error);
                  }).finally(() => {
                    // delete extracted tmp dir
                      deleteContent(extPath);
                        });
                    }
              catch(e){
                deleteContent(pluginPath);
                deleteContent(extPath);
                return reject(e)
              }
            })
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
      if(!obj){ return} 
      deleteContent(obj.file);
      if (obj.type === "executer")
        return deletePluginOnAgent(obj.name)
      else
        return deletePluginOnServer(obj.name);
    }).finally(() => {
      return Plugin.remove({ _id: id });
    })
  },
  deletePluginByPath(path) {
    return Plugin.findOne({ file: path }).then((plugin) => {
      if (plugin)
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

  updateSettings: (id, settings) => {
    if(!settings.length) {
      return Promise.reject({message:'Settings not found'})
    }
    return Plugin.findOne({ _id: id }).then((plugin) => {
      for (let i = 0, length = plugin.settings.length; i < length; i++) {
        plugin.settings[i].value = settings[i].value
      }
      return plugin.save();
    })
  },


};

