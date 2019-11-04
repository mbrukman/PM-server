const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const User = require("../models/user.model");
const TestDataManager = require("../tests/factories/test-data-manager");
const app = "localhost:3000";

describe("User tests", () => {
  const usersTestDataManager = new TestDataManager(User);

  beforeEach(async () => {
    await usersTestDataManager.generateInitialCollection(
      usersFactory.generateUsers()
    );
  });

  afterEach(async () => {
    usersTestDataManager.clear();
  });

  describe("GET api/users", () => {
    it(`should respond with list of users`, () => {
      return request(app)
        .get("/api/users?options=''")
        .expect(200)
        .then(({ body }) => {
          expect(body.items.length).toEqual(
            usersTestDataManager.collection.length
          );
          expect(body.totalCount).toEqual(
            usersTestDataManager.collection.length
          );
        });
    });

    it(`should respond with 500`, done => {
      return request(app)
        .get("/api/users")
        .expect(500, done);
    });
  });

  describe("POST api/users", () => {
    const testUser = usersFactory.generateSingleUser();
    it(`should respond with created user's data for correct request`, () => {
      return request(app)
        .post("/api/users")
        .send(testUser)
        .expect(200)
        .then(({ body }) => {
          expect(body.name).toBe(testUser.name);
          expect(body.email).toBe(testUser.email);
          expect(body.phoneNumber).toBe(testUser.phoneNumber);
          expect(body.password).toBeDefined();
          expect(body.password).not.toBe(testUser.password);
          expect(body.password.length).toBe(64);
          expect(body.changePasswordOnNextLogin).toBe(
            testUser.changePasswordOnNextLogin
          );
        });
    });

    it(`should respond with 400 for request with incorrect user data`, () => {
      const incorrectTestUser = testUser;
      incorrectTestUser.email = "incorrect@invalid";
      return request(app)
        .post("/api/users")
        .send(incorrectTestUser)
        .expect(400)
        .then(({ body }) => {
          expect(body.name).toBe("ValidationError");
          expect(body.errors.email.name).toBe("ValidatorError");
        });
    });
  });
});
