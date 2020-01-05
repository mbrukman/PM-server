const request = require('request');
const fs = require('fs');
const path = require('path');
const startKaholo = require('./helpers');
const getSettings = require('./api/controllers/settings.controller').getSetings;
const pluginService = require('./api/services/plugins.service');
const plugins = [
    {
        name : "SendMail",
        zip : "https://github.com/Kaholo/kaholo-plugin-sendMail/raw/master/zip/kaholo-plugin-sendMail.zip"
    },
    {
        name : "Jenkins",
        zip : "https://github.com/Kaholo/kaholo-plugin-jenkins/raw/master/zip/kaholo-plugin-jenkins.zip"
    },
    {
        name : "Zip",
        zip : "https://github.com/Kaholo/kaholo-plugin-zip/raw/master/zip/kaholo-plugin-zip.zip"
    },
    {
        name : "XML",
        zip : "https://github.com/Kaholo/kaholo-plugin-xml/raw/master/zip/kaholo-plugin-xml.zip"
    },
    {
        name : "Git",
        zip : "https://github.com/Kaholo/kaholo-plugin-git/raw/master/zip/kaholo-plugin-git.zip"
    },
    {
        name : "SVN",
        zip : "https://github.com/Kaholo/kaholo-plugin-svn/raw/develop/zip/svn_plugin.zip"
    },
    {
        name : "PowerShell Remoting",
        zip : "https://github.com/Kaholo/kaholo-plugin-powershell-remoting/raw/master/zip/kaholo-plugin-powershell-remoting.zip"
    },
    {
        name : "MongoDB",
        zip : "https://github.com/Kaholo/kaholo-plugin-mongo/raw/master/zip/kaholo-plugin-mongo.zip"
    },
    {
        name : "CMD",
        zip : "https://github.com/Kaholo/kaholo-plugin-cmd/raw/develop/zip/kaholo-plugin-cmd.zip"
    },
    {
        name : "VSTest",
        zip : "https://github.com/Kaholo/kaholo-plugin-vstest/raw/master/zip/kaholo-plugin-vstest.zip"
    },
    {
        name : "FileSystem",
        zip : "https://github.com/Kaholo/kaholo-plugin-fs/raw/master/zip/kaholo-plugin-fs.zip"
    },
    {
        name : "Slack",
        zip : "https://github.com/Kaholo/kaholo-plugin-slack/raw/master/zip/kaholo-plugin-slack.zip"
    },
    {
        name : "GSuite",
        zip : "https://github.com/Kaholo/kaholo-plugin-gsuite/raw/master/zip/kaholo-plugin-gsuite.zip"
    },
    {
        name : "Terraform CLI",
        zip : "https://github.com/Kaholo/kaholo-plugin-terraform-cli/raw/Develop/zip/kaholo-plugin-terraform-cli.zip"
    },
    {
        name : "AWS EC2",
        zip : "https://github.com/Kaholo/kaholo-plugin-amazon-ec2/raw/master/zip/kaholo-plugin-amazon-ec2.zip"
    },
    {
        name : "AWS Route53",
        zip : "https://github.com/Kaholo/kaholo-plugin-aws-route53/raw/master/zip/kaholo-plugin-aws-route53.zip"
    },
    {
        name : "AWS RDS",
        zip : "https://github.com/Kaholo/kaholo-plugin-rds/raw/master/zip/kaholo-plugin-rds.zip"
    },
    {
        name : "GCP Compute Engine",
        zip : "https://github.com/Kaholo/kaholo-plugin-GoogleCloudComputeEngine/raw/master/zip/kaholo-plugin-google-cloud-compute-engine.zip"
    },
    {
        name : "GCP Resource Manager",
        zip : "https://github.com/Kaholo/kaholo-plugin-google-cloud-resource-manager/raw/master/zip/kaholo-plugin-google-cloud-resource-manager.zip"
    },
    {
        name : "GCP Billing",
        zip : "https://github.com/Kaholo/kaholo-plugin-google-cloud-billing/raw/develop/zip/kaholo-plugin-google-cloud-billing.zip"
    }
];

function downloadFile(url, dest){
    return new Promise((resolve,reject)=>{
        let file = fs.createWriteStream(dest);
        request(url).pipe(file).on('error', (err) => {
            reject(err);
        }).on('finish', () => {
            file.close(()=>{
                resolve({url, dest});
            });  // close() is async, call cb after close completes.
          });
    })
}

function removeFile(path) {
    return new Promise((resolve,reject)=>{
        fs.unlink(path, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
    })
}

function installPlugin(plugin){
    console.log(`Start installing ${plugin.name} plugin`);
    const req = {app : {}};

    const filePath = path.join(__dirname, 'tmp', `plugin-${plugin.name.replace(/ /g,"-")}-${new Date().getTime()}`);
    return downloadFile(plugin.zip, filePath).then(res=>{
        return pluginService.createPlugin(filePath ,req)
    }).then(()=>{
        console.log(`Finished installing ${plugin.name} plugin`);
        console.log(`Removing installation file`);
        return removeFile(filePath);
    }).then(()=>{
      return {plugin : plugin.name, success: true};  
    }).catch((err) => {
        console.error(`Error installing ${plugin.name} plugin : ${err}`);
        return { plugin : plugin.name, success: false};  
      })
}

const server = startKaholo();

function close() {
    server.close();
    process.exit();
}

if (!getSettings().isSetup) {
    console.error("You must first set DB_URI in the .env file");
    close();
}

// Promise.all(plugins.map(plugin => installPlugin(plugin)))

const reduceFunc = (promiseChain, plugin, index) => {
    return promiseChain.then(chainResults => {
      return installPlugin(plugin).then(currentResult => {
        return [...chainResults, currentResult];
      });
    });
  };

  plugins.reduce(reduceFunc, Promise.resolve([])).then(res => {
    console.log("Finished installing plugins");
    close();
});

