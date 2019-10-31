const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const User = require("../models/user.model");
const TestDataManager = require("../tests/factories/test-data-manager");

const app = "localhost:3000";

describe("User tests", () => {
  const usersTestDataManager = new TestDataManager(User);

  beforeEach(async () => {
    await usersTestDataManager.generateInitialCollection(
      usersFactory.generateMany()
    );
  });

  afterEach(async () => {
    usersTestDataManager.clear();
  });

  describe("POST api/users/filter", () => {
    it(`should respond with list of users`, () => {
      return request(app)
        .post("/api/users/filter")
        .send({ options: {} })
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
        .post("/api/users/filter")
        .send()
        .expect(500, done);
    });

    describe("POST api/users/create", () => {
      it(`should respond with created user's data for correct request`, () => {
        return request(app)
          .post("/api/users/create")
          .send({
            name: "test user",
            email: "test@testy.co",
            password: "test-password",
            phoneNumber: "0-700-888-888",
            changePasswordOnNextLogin: false
          })
          .expect(200)
          .then(({ body }) => {
            expect(body.name).toBe("test user");
            expect(body.email).toBe("test@testy.co");
            expect(body.phoneNumber).toBe("0-700-888-888");
            expect(body.password).toBeDefined();
            expect(body.password).not.toBe("test-password");
            expect(body.password.length).toBe(64);
            expect(body.changePasswordOnNextLogin).toBe(false);
          });
      });

      it(`should respond with 400 for request with incorrect user data`, () => {
        return request(app)
          .post("/api/users/create")
          .send({ name: "bad-user", email: "haxor@nothing" })
          .expect(400)
          .then(({ body }) => {
            expect(body.name).toBe("ValidationError");
            expect(body.errors.email.name).toBe("ValidatorError");
          });
      });
    });
  });
});
