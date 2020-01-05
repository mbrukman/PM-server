const request = require("supertest");

const app = "localhost:3000";
describe("Settings tests", () => {
  describe("GET api/settings", () => {
    it(`should respond with 'true' for valid db connection`, () => {
      return request(app)
        .get("/api/settings")
        .expect(200)
        .then(({ body }) => {
          expect(body.isSetup).toBe(true);
          expect(body.version).toBeDefined();
          expect(typeof body.version).toBe("string");
        });
    });
  });

  describe("POST api/settings/db", () => {
    it(`should respond with 204 after successful connection to given db uri`, () => {
      return request(app)
        .post("/api/settings/db")
        .send({ uri: process.env.DB_URI })
        .expect(204);
    });

    it(`should respond with 500 for missing req.body.uri`, () => {
      return request(app)
        .post("/api/settings/db")
        .send({})
        .expect(500)
        .then(({ text }) => {
          expect(text).toEqual("Missing parameters");
        });
    });
  });
});
