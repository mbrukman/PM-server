const NodeEnvironment = require('jest-environment-node');
const {connectToSocket} = require('./../helpers');

class CustomEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context);
    }

    async setup() {
        this.global.io = await connectToSocket(global.websocketURL);
        await super.setup();
    }

    async teardown() {
        this.global.io.close();
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
     handleTestEvent(event, state) {
    }
}

module.exports = CustomEnvironment;
