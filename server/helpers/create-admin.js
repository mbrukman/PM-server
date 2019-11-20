require("dotenv").config();
const prompts = require("prompts");
const mongoose = require("mongoose");
const validator = require("validator");
const userService = require("../api/services/user.service");

function getPrompts() {
  return prompts([
    {
      type: "text",
      name: "name",
      message: "What is your name?",
      validate: value =>
        value.length < 3 ? `Name has to be longer than 2 letters.` : true
    },
    {
      type: "text",
      name: "email",
      message: "What is your email?",
      validate: value =>
        validator.isEmail(value) ? true : `It's incorrect email format.`
    }
  ]);
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });
    const { name, email } = await getPrompts();
    const password = "test";
    const user = await userService.createUser({
      name,
      email,
      password,
      changePasswordOnNextLogin: true,
      isAdmin: true
    });
    console.log(
      "\x1b[35m",
      `User created with email "${user.email}" and with password "${password}".`
    );
    console.log(
      "\x1b[35m",
      "You will be asked to change your password on your first login to the system."
    );
  } catch (error) {
    console.error(error);
  }
  mongoose.connection.close();
}

createAdmin();
