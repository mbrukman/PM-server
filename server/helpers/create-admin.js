require("dotenv").config();
const mongoose = require("mongoose");
const userService = require("../api/services/user.service");

async function createAdmin() {
  await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });
  try {
    const user = await userService.createUser({
      name: "default admin",
      email: "test@kaholo.io",
      password: "test",
      changePasswordOnNextLogin: true
    });
    console.log("user created:", user.email);
  } catch (error) {
    console.error(error);
  }
  mongoose.connection.close();
}

createAdmin();
