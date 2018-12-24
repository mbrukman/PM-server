var fs = require('fs');

var sdk = fs.readFileSync('../server/libs/sdk.js');

var env = {
    sdk : sdk.toString()
}

fs.writeFileSync('./env.json',JSON.stringify(env),'utf8');