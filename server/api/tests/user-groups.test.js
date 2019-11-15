const {
  generateGroupUser,
  generateGroupUserCollection
} = require("./factories/user-group.factory");
const { TestDataManager } = require("./factories");
const UserGroupModel = require("../../api/models/user-group.model");
const request = require("supertest");

const baseApiURL = "http://127.0.0.1:3000/api";

describe("All user group endpoints are working as expected.", () => {
  let testDataManager;

  beforeEach(() => {
    testDataManager = new TestDataManager(UserGroupModel);
    return testDataManager.generateInitialCollection(
      generateGroupUserCollection(),
      {},
      null
    );
  });

  describe("PATCH api/user-groups", () => {
    it("should respond with updated user group", () => {
      const user = testDataManager.collection[0];
      const id = user._id.toString();
      const name = "ET Go Home";
      return request(baseApiURL)
        .patch(`/user-groups/${id}`)
        .send({ name })
        .expect(200)
        .then(({ body }) => {
          expect(body._id).toBe(id);
          expect(body.name).toEqual(name);
        });
    });
    it("should respond with updated user groups", () => {
      const userGroups = testDataManager.collection;

      const userGroupCollection = {};
      userGroups.forEach(userGroup => {
        userGroupCollection[userGroup._id] = {
          name: "new name",
          description: "new desc"
        };
      });
      return request(baseApiURL)
        .patch(`/user-groups`)
        .send(userGroupCollection)
        .expect(200)
        .then(({ body }) => {
          body.forEach(({ name, description, _id }) => {
            expect(userGroupCollection[_id].name).toBe(name);
            expect(userGroupCollection[_id].description).toBe(description);
          });
        });
    });
  });

  describe("GET api/user-groups", () => {
    it(`should respond with a group`, () => {
      const userGroup = testDataManager.collection[0];
      const id = userGroup._id.toString();
      return request(baseApiURL)
        .get(`/user-groups/${id}`)
        .expect(200)
        .then(({ body }) => {
          expect(body._id).toEqual(id);
          expect(body.name).toEqual(userGroup.name);
          expect(body.description).toEqual(userGroup.description);
        });
    });
    it(`should respond with list of groups`, () => {
      return request(baseApiURL)
        .get("/user-groups?options={}")
        .expect(200)
        .then(({ body }) => {
          expect(body.items.length).toEqual(testDataManager.collection.length);
          expect(body.totalCount).toEqual(testDataManager.collection.length);
        });
    });
    it(`should respond with list of groups without queryparams`, () => {
      return request(baseApiURL)
        .get("/user-groups")
        .expect(200)
        .then(({ body }) => {
          expect(body.items.length).toEqual(testDataManager.collection.length);
          expect(body.totalCount).toEqual(testDataManager.collection.length);
        });
    });
  });

  describe("POST /user-group, save new user-group", () => {
    it("should create, save and return new user-group", () => {
      const expected = generateGroupUser();
      testDataManager.pushToCollection(expected);

      return request(baseApiURL)
        .post(`/user-groups`)
        .send(expected)
        .expect(200)
        .expect("Content-Type", /json/)
        .then(({ body }) => {
          expect.assertions(3);
          expect(body.name).toBe(expected.name);
          expect(body._id).toBe(expected._id);
          expect(body.description).toBe(expected.description);
        });
    });

    it("should not create", done => {
      return request(baseApiURL)
        .post(`/user-groups`)
        .send()
        .expect(500, done);
    });
  });

  describe("DELETE /user-groups, Delete previously created user group", () => {
    it("should respond with OK and deleted count", () => {
      const userGroup = testDataManager.collection[0];
      return request(baseApiURL)
        .del(`/user-groups/${userGroup._id}`)
        .expect(200)
        .then(({ body }) => {
          expect(body.deletedCount).toBe(1);
          testDataManager.removeFromCollection(userGroup);
        });
    });
    it("should respond with 500", () => {
      return request(baseApiURL)
        .del(`/user-groups/${undefined}`)
        .expect(500);
    });
  });
});
