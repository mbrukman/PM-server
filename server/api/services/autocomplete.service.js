const models = require("../models");

module.exports = {
    generateAutoComplete: (modelName, queryString) => {
        let model = models[modelName];
        let query = {}
        let select = {}
        query[model.autocompleteKey] = new RegExp(queryString.query, 'i');
        select[model.autocompleteKey] = 1;
        select[model.autocompleteValueField] = 1;

        return model.find(query).select(select).limit(5).then(options => {
            options = options.map(o => ({
              id: o[model.autocompleteValueField],
              value: o[model.autocompleteKey]
            }));
            return options
          })
        
      },



      getValueByKey: (key,modelName) => {
        let model = models[modelName];
        let query = {};
        query[model.autocompleteValueField]=key
        let select = {}
        select[model.autocompleteKey]=1;
        return model.findOne(query).select(select).then(val => {
            return {
                id:val[model.autocompleteValueField],
                value:val[model.autocompleteKey]
            }
        })
      }
}