const req = require("supertest");
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
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo test cases for l10", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(2000, () => {});
    agent = req.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Signing In", async () => {
    const resSignup = await agent.get("/signup");
    const csrfToken = extractCsrfToken(resSignup);
    const resPostSignup = await agent.post("/users").send({
      firstname: "Test",
      lastname: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(resPostSignup.statusCode).toBe(302);
  });

  test("Signing out", async () => {
    let resTodos = await agent.get("/todos");
    expect(resTodos.statusCode).toBe(200);

    const resSignout = await agent.get("/signout");
    expect(resSignout.statusCode).toBe(302);
    expect(resSignout.header["location"]).toBe("/login");

    resTodos = await agent.get("/todos");
    expect(resTodos.statusCode).toBe(302);
  });

  test("Create new todo Item", async () => {
    const agentNewTodo = req.agent(server);
    await login(agentNewTodo, "user.a@test.com", "12345678");
    const resTodos = await agentNewTodo.get("/todos");
    const csrfToken = extractCsrfToken(resTodos);
    const resPostTodo = await agentNewTodo.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(resPostTodo.statusCode).toBe(302);
  });

  test("Updating the todos", async () => {
    const agentUpdate = req.agent(server);
    await login(agentUpdate, "user.a@test.com", "12345678");

    let resTodos = await agentUpdate.get("/todos");
    let csrfToken = extractCsrfToken(resTodos);

    const resPostTodo = await agentUpdate.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(resPostTodo.statusCode).toBe(302);

    resTodos = await agentUpdate.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(resTodos.text);

    if (parsedGroupedResponse.dueToday && parsedGroupedResponse.dueToday.length > 0) {
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
      const status = !latestTodo.completed;

      resTodos = await agentUpdate.get("/todos");
      csrfToken = extractCsrfToken(resTodos);
      const resPutTodo = await agentUpdate.put(/todos/${latestTodo.id}).send({
        _csrf: csrfToken,
        completed: status,
      });

      const parsedUpdateResponse = JSON.parse(resPutTodo.text);
      expect(parsedUpdateResponse.completed).toBe(status);
    } else {
      console.error("No more todos found in 'dueToday'.");
    }
  });

  test("Delete using userID", async () => {
    const agentDelete = req.agent(server);
    await login(agentDelete, "user.a@test.com", "12345678");

    let resTodos = await agentDelete.get("/todos");
    let csrfToken = extractCsrfToken(resTodos);

    const resPostTodo = await agentDelete.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(resPostTodo.statusCode).toBe(302);

    resTodos = await agentDelete.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(resTodos.text);

    if (parsedGroupedResponse.dueToday && parsedGroupedResponse.dueToday.length > 0) {
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

      resTodos = await agentDelete.get("/todos");
      csrfToken = extractCsrfToken(resTodos);
      const resDeleteTodo = await agentDelete
        .delete(/todos/${latestTodo.id})
        .send({ _csrf: csrfToken });

      const parsedDeleteResponse = JSON.parse(resDeleteTodo.text);
      expect(parsedDeleteResponse.success).toBe(true);
    } else {
      console.error("No more todos found in 'dueToday'.");
    }
  });
});