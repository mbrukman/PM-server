const NodeEnvironment = require("jest-environment-node");
const { connectToSocket } = require("./../helpers");
const mockServer = require("mockserver-node");
const mockServerClient = require("mockserver-client").mockServerClient;
const mockServerPort = 1080;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await mockServer.start_mockserver({
      serverPort: mockServerPort
    });

    mockServerClient("localhost", mockServerPort).mockAnyResponse({
      httpRequest: {
        method: "GET",
        path: "/api/status"
      },
      httpResponse: {
        statusCode: 200
      }
    });

    this.global.io = await connectToSocket(global.websocketURL);
    await super.setup();
  }

  async teardown() {
    await mockServer.stop_mockserver({
      serverPort: mockServerPort
    });
    this.global.io.close();
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
  handleTestEvent(event, state) {}
}

module.exports = CustomEnvironment;
