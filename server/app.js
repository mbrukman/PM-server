const {app, server, port, winston} = require('./api');

const bootstrap = require('./helpers/bootstrap').bootstrap;

server.listen(port, () => {
  winston.log('info', `Running on localhost:${port}`);
  bootstrap(app);
});
