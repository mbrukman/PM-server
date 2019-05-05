var fs = require('fs');

var sdk = fs.readFileSync('../server/libs/sdk.js');
var declarations = fs.readFileSync('../server/libs/sdk.d.ts');

var env = {
    sdk : sdk.toString(),
    declarations : declarations.toString()
}

fs.writeFileSync('./env.json',JSON.stringify(env),'utf8');