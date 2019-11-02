const {jsf} = require("./jsf.helper");

jsf.option({
    useDefaultValue: true
});

const groupUsersSchema = {
    type: "object",
    properties: {
        _id: {
            type: "string",
            format: "mongoID"
        },
        name: {
            type: "string",
            chance: {
                word: {
                    length: 10
                }
            }
        },
        description: {
            type: "string",
            faker: "lorem.paragraph"
        },

    },
    required: ["_id", "name", "description"]
};

const groupUserCollectionSchema = {
    type: "array",
    items: groupUsersSchema,
    maxItems: 15,
    minItems: 5
};

module.exports = {
    generateGroupUserCollection: options => jsf.generate(Object.assign(groupUserCollectionSchema, options)),
    generateGroupUser: options => jsf.generate(Object.assign(groupUsersSchema, options)),
};
