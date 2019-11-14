const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const User = require("../models/user.model");
const TestDataManager = require("../tests/factories/test-data-manager");
const app = "localhost:3000";
const { randomIdx } = require("./helpers");

describe("Auth tests", () => {
  const usersTestDataManager = new TestDataManager(User);

  beforeEach(async () => {
    await usersTestDataManager.generateInitialCollection(
      usersFactory.generateUsers()
    );
  });

  afterEach(async () => {
    usersTestDataManager.clear();
  });

  describe("POST api/auth/login", () => {
    it("should respond with status 200, user in body and a token in authorization header", () => {
      const randomIndex = randomIdx(usersTestDataManager.collection.length);
      const { email, password } = usersTestDataManager.collection[randomIndex];
      return request(app)
        .post(`/api/auth/login`)
        .expect("Authorization", /Bearer/)
        .send({ email, password })
        .expect(200)
        .then(({ body }) => {
          expect(body.email).toEqual(email);
        });
    });
  });
});
