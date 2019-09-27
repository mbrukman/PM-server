const {app, server, port, winston} = require('../../index');
const bootstrap = require('../../../helpers/bootstrap').bootstrap;

module.exports = async () => {
  global.server = server.listen(port, () => {
    winston.log('info', `Running on localhost:${port}`);
    bootstrap(app);
  });
};
