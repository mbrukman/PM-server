var Ajv = require('ajv');
var ajv = new Ajv({jsonPointers: true});

var schema = {
  properties:{
    name: {type:'string'},
    type: {type:'string'},
    description: {type:'string'},
    execProgram: {type:'string'},
    main: {type:'string'},
    active:{type:"boolean"},
    version: {type:'string'},
    imgUrl: {type:'string'},
    file:{type:'string'},
    settings:{type:'array'},
    methods: {
      items:{  
        type:'object',
        properties:{
          name: {type:'string'},
          viewName: {type:'string'},
          route: {type:'string'},
          actionString: {type:'string'},
          params: 
          {
            items:{  
              type:'object',
              properties:{
                name: {type:'string'},
                viewName: {type:'string'},
                type: {
                    type:'string',
                    enum:['string', 'int', 'float', 'options', 'autocomplete', 'file', 'text', 'boolean']
                },
                options:
                {
                  items: 
                  {
                    type:'object',
                    properties:{
                      id:{
                        type:'string'
                      },
                      name:{
                        type:'string'
                      },
                      type:{
                        type:'string'
                      }
                    },
                    additionalProperties: false,
                    required:['id','name']
                  },
                }
              },
              allOf:[
                {
                    if:{
                        properties:{
                            type:{
                                const:'options'
                            }
                        }
                    },
                    then:{
                        required:['options']
                    }
                }
            ]
            }
          }
        }
      }
    }
  }
}

module.exports= ajv.compile(schema);