const request = require("supertest");
const usersFactory = require("../tests/factories/users.factory");
const UserModel = require('../models/user.model');
const app = "localhost:3000";
describe("User tests", () => {
    const usersTestDataManager = new TestDataManager(UserModel);

    beforeEach(async () => {
        await usersTestDataManager.generateInitialCollection(
            usersFactory.generateMany()
        );
    })

    afterEach(async () => {
        usersTestDataManager.clear();
    })

    describe("POST api/users", () => {
        it(`should respond with list of users`, () => {
            return request(app)
                .post("/api/users")
                .send({ options: {} })
                .expect(200)
                .then(({ body }) => {
                    expect(body.items.length).toEqual(usersTestDataManager.collection.length)
                    expect(body.totalCount).toEqual(usersTestDataManager.collection.length)
                });
        });

        it(`should respond with 500`, (done) => {
            return request(app)
                .post("/api/users")
                .send()
                .expect(500, done)
        });
    });
});