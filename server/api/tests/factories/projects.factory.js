const jsf = require('json-schema-faker');

jsf.extend('custom', () => {
    return {
      'empty_array': () => {
        return []; 
      }   
    };  
  });

const singleSchema = {
    type: 'object',
    properties: {
        name:{type:'string'},
        description:{type:'string'},
        archived:{type:'boolean'},
        maps:{
            type:'array',
            custom: 'empty_array'
        }         
    },
    required: ['name','description','maps'],

};

const arraySchema = {
    type: 'array',
    items: singleSchema,
    maxItems: 2,
   
};

module.exports = {
    generateProjects: () => jsf.generate(arraySchema),
    generateSingleProject: () => jsf.generate(singleSchema),
}