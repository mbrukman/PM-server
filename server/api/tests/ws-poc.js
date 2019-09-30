// const request = require("supertest");
// const apiURL = "localhost:3000/api";
// const agentURL = "http://127.0.0.1:1080";

// const sampleAgentData = {
//   attributes: [],
//   key:
//     "f4906394fecd8d1f5f74ac0bd1d15c0cada4a0eb1c242adf083e3f48733e62299e6ca484ba9b0e5fd3f9b833e36872bd94dafd7f18fcb05bdf337e9351498676",
//   name: "test-agent",
//   publicUrl: agentURL,
//   url: agentURL
// };

// describe("PoC of agent communication", () => {
//   beforeAll(() => {
//     return request(apiURL)
//       .post("/agents/add")
//       .send(sampleAgentData);
//   });

//   describe(`GET /status`, () => {
//     it.only(`should respond with the agents`, async done => {
//       global.io.on("notification", ({ type, message, title }) => {
//         console.log(type, message, title);
//         done();
//       });
//     });
//   });
// });
