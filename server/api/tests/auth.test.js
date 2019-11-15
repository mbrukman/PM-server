const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const User = require("../models/user.model");
const TestDataManager = require("../tests/factories/test-data-manager");
const app = "localhost:3000";
const { randomIdx } = require("./helpers");

describe("Auth tests", () => {
  const usersTestDataManager = new TestDataManager(User);
  const testPassword = "testpassword1234";

  beforeEach(async () => {
    await usersTestDataManager.generateInitialCollection(
      usersFactory.generateSingleUser(testPassword)
    );
  });

  afterEach(async () => {
    usersTestDataManager.clear();
  });

  describe("POST api/auth/login", () => {
    it("should respond with status 200, user in body and a token in authorization header", () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const { email, name } = usersTestDataManager.collection[randomIndex];
      return request(app)
        .post(`/api/auth/login`)
        .send({ email, password: testPassword })
        .expect(200)
        .expect("Authorization", /Bearer/)
        .then(({ body }) => {
          expect(body.email).toEqual(email);
          expect(body.name).toEqual(name);
        });
    });

    it("should respond with status 401 for invalid password", () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const { email } = usersTestDataManager.collection[randomIndex];
      return request(app)
        .post(`/api/auth/login`)
        .send({ email, password: "invalid777" })
        .expect(401)
        .then(response => {
          expect(response.text).toEqual("Invalid password.");
        });
    });

    it("should respond with status 404 for non existing user", () => {
      return request(app)
        .post(`/api/auth/login`)
        .send({ email: "wrong@email.nowhere", password: testPassword })
        .expect(404)
        .then(response => {
          expect(response.text).toEqual("User does not exist.");
        });
    });
  });
});
