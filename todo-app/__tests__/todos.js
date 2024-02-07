/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  describe("Authentication", () => {
    test("Sign up", async () => {
      let res = await agent.get("/signup");
      const csrfToken = extractCsrfToken(res);
      res = await agent.post("/users").send({
        firstName: "Test",
        lastName: "User A",
        email: "user.a@test.com",
        password: "12345678",
        _csrf: csrfToken,
      });
      expect(res.statusCode).toBe(302);
    });

    test("Sign out", async () => {
      let res = await agent.get("/todos");
      expect(res.statusCode).toBe(302);
      res = await agent.get("/signout");
      expect(res.statusCode).toBe(302);
      res = await agent.get("/todos");
      expect(res.statusCode).toBe(302);
    });
  });

  describe("Todo Operations", () => {
    beforeEach(async () => {
      await login(agent, "user.a@test.com", "12345678");
    });

    test("Creates a todo and responds with json at /todos POST endpoint", async () => {
      const res = await agent.get("/todos");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      });
      expect(response.statusCode).toBe(302);
    });

    test("Marks a todo with given ID as complete", async () => {
      const res = await agent.get("/todos");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      });
      const todoId = response.body.id;
      const markCompleteResponse = await agent.put(`/todos/${todoId}`).send({
        _csrf: csrfToken,
        completed: true,
      });
      expect(markCompleteResponse.body.completed).toBe(true);
    });

    test("Marks a todo with given ID as incomplete", async () => {
      const res = await agent.get("/todos");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: true,
        _csrf: csrfToken,
      });
      const todoId = response.body.id;
      const markIncompleteResponse = await agent.put(`/todos/${todoId}`).send({
        _csrf: csrfToken,
        completed: false,
      });
      expect(markIncompleteResponse.body.completed).toBe(false);
    });

    test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
      const res = await agent.get("/todos");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/todos").send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      });
      const todoId = response.body.id;
      const deleteResponse = await agent.delete(`/todos/${todoId}`).send({
        _csrf: csrfToken,
      });
      expect(deleteResponse.body.success).toBe(true);
    });
  });
});
