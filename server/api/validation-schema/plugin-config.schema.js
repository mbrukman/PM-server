const Ajv = require('ajv');
const ajv = new Ajv({jsonPointers: true});

const pluginParamsSceham = require('./plugin-params.schema');

const schema = {
  properties: {
    name: {type: 'string'},
    type: {type: 'string'},
    description: {type: 'string'},
    execProgram: {type: 'string'},
    main: {type: 'string'},
    active: {type: 'boolean'},
    version: {type: 'string'},
    imgUrl: {type: 'string'},
    file: {type: 'string'},
    settings: pluginParamsSceham,
    methods: {
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          viewName: {type: 'string'},
          route: {type: 'string'},
          actionString: {type: 'string'},
          params: pluginParamsSceham,
        },
      },
    },
  },
};
module.exports= ajv.compile(schema);
