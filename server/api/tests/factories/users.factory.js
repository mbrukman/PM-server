const { jsf } = require("./jsf.helper");
const userService = require("../../services/user.service");

const singleUserSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      chance: {
        word: {
          length: 7
        }
      }
    },
    email: {
      type: "string",
      chance: "email"
    },
    password: {
      type: "string",
      chance: {
        word: {
          length: 8
        }
      }
    },
    phoneNumber: {
      type: "string",
      chance: "phone"
    },
    changePasswordOnNextLogin: {
      type: "boolean",
      chance: { bool: { likelihood: 0 } }
    }
  },
  required: ["name", "email", "password"]
};

const arrayUserSchema = {
  type: "array",
  items: singleUserSchema,
  maxItems: 7,
  minItems: 2
};

module.exports = {
  generateUsers: () => jsf.generate(arrayUserSchema),
  generateSingleUser: password => {
    const user = jsf.generate(singleUserSchema);
    if (password) {
      user.password = userService.hashPassword(password);
    }
    return user;
  }
};
