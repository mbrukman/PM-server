const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const User = require("../models/user.model");
const TestDataManager = require("../tests/factories/test-data-manager");
const app = "localhost:3000";
const { randomIdx } = require("./helpers");
const authService = require("../services/auth.service");

describe("User tests", () => {
  const usersTestDataManager = new TestDataManager(User);

  beforeEach(async () => {
    await usersTestDataManager.generateInitialCollection(
      usersFactory.generateUsers()
    );
  });

  afterEach(() => {
    usersTestDataManager.clear();
  });

  describe("PATCH api/users", () => {
    it("should respond with updated user", () => {
      const user = usersTestDataManager.collection[0];
      const id = user._id.toString();
      const name = "ET Go Home";
      return request(app)
        .patch(`/api/users/${id}`)
        .send({ name })
        .expect(200)
        .then(({ body }) => {
          expect(body._id).toBe(id);
          expect(body.name).toEqual(name);
        });
    });
    it("should respond with updated users", () => {
      const users = usersTestDataManager.collection;

      const userCollection = {};
      users.forEach(user => {
        userCollection[user._id] = {
          name: "new name"
        };
      });
      return request(app)
        .patch(`/api/users`)
        .send(userCollection)
        .expect(200)
        .then(({ body }) => {
          body.forEach(({ name, _id }) => {
            expect(userCollection[_id].name).toBe(name);
          });
        });
    });
  });

  describe("GET api/users", () => {
    it(`should respond with list of users with query params`, () => {
      return request(app)
        .get("/api/users?options={}")
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
    it(`should respond with list of users without query prams`, () => {
      return request(app)
        .get("/api/users")
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

  describe("DELETE api/users/", () => {
    it(`should respond with number of deleted users`, () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const userId = usersTestDataManager.collection[randomIndex]._id;
      return request(app)
        .delete(`/api/users/${userId}`)
        .expect(200)
        .then(({ body }) => {
          expect(body.n).toEqual(1);
        });
    });

    it(`should respond with 500`, done => {
      return request(app)
        .delete("/api/users/1")
        .send()
        .expect(500, done);
    });
  });

  describe("GET api/users/:id", () => {
    it(`should respond with a user of given id`, () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const user = usersTestDataManager.collection[randomIndex];
      return request(app)
        .get(`/api/users/${user.id}`)
        .expect(200)
        .then(({ body }) => {
          expect(body.name).toEqual(user.name);
        });
    });

    it(`should respond with 404 for non-existing user`, done => {
      return request(app)
        .get("/api/users/5dc27eeb0cf1474100000000")
        .send()
        .expect(404, done);
    });

    it(`should respond with 500 on error`, done => {
      return request(app)
        .get("/api/users/1")
        .send()
        .expect(500, done);
    });
  });

  describe("PATCH api/users", () => {
    it(`should respond with updated user for proper request`, () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const userId = usersTestDataManager.collection[randomIndex]._id;
      const newUserData = usersFactory.generateSingleUser();
      return request(app)
        .patch(`/api/users/${userId}`)
        .send(newUserData)
        .expect(200)
        .then(({ body }) => {
          expect(body.name).toEqual(newUserData.name);
          expect(body.email).toEqual(newUserData.email);
        });
    });

    it(`should respond with 500 on error`, () => {
      return request(app)
        .patch(`/api/users/0`)
        .expect(500)
        .then(({ body }) => {
          expect(body.name).toEqual("CastError");
        });
    });
  });

  describe("POST api/users/reset-password", () => {
    beforeAll(() => {
      process.env.NODE_ENV = "auth-test";
    });

    afterAll(() => {
      process.env.NODE_ENV = "test";
    });

    it(`should respond with user for proper request`, () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const userId = usersTestDataManager.collection[randomIndex]._id;
      const token = authService.sign(userId);
      return request(app)
        .post(`api/users/reset-password`)
        .set("Authorization", "Bearer " + token)
        .send({ newPassword: "test2" })
        .expect(200)
        .then(({ body }) => {
          expect(body._id).toEqual(userId);
        });
    });
    it(`should respond with 400 for bad request`, () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const userId = usersTestDataManager.collection[randomIndex]._id;
      const token = authService.sign(userId);
      return request(app)
        .post(`api/users/reset-password`)
        .set("Authorization", "Bearer " + token)
        .send({})
        .expect(400)
        .then(response => {
          expect(response.text).toEqual("Missing auth or password.");
        });
    });

    it(`should respond with 401 for no auth`, () => {
      return request(app)
        .post(`api/users/reset-password`)
        .expect(401)
        .then(response => {
          expect(response.text).toEqual("Unauthorized.");
        });
    });
  });
});
