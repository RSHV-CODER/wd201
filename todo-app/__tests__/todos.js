/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");
const { ensureLoggedIn } = require("connect-ensure-login");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login=async (agent,username,password)=>{
  let res=await agent.get("/login");
  let csrfToken=extractCsrfToken(res);
  res=await agent.post("/session").send({
    email:username,
    password:password,
    _csrf:csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => { });
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

  test("Sign up",async()=>{
    let res=await agent.get("/signup");
    const csrfToken=extractCsrfToken(res);
    res=await agent.post("/users").send({
      firstName:"Test",
      lastName:"User A",
      email:"user.a@test.com",
      password:"12345678",
      _csrf:csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out",async() => {
    let res=await agent.get("/todos");
    expect(res.statusCode).toBe(302);
    res= await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res= await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent=request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with given ID as complete", async () => {
    const agent=request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    // eslint-disable-next-line no-unused-vars
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
    .get("/todos")
    .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const countDueToday = parsedGroupedResponse.DueToday.length;
    const latestTodo = parsedGroupedResponse.DueToday[countDueToday - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed:false,
    });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Marks a todo with given ID as incomplete",async()=>{
    const agent=request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
    .get("/todos")
    .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const countDueToday = parsedGroupedResponse.DueToday.length;
    const latestTodo = parsedGroupedResponse.DueToday[countDueToday - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    
    const markInCompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed:false,
    });
    const parsedUpdateResponse = JSON.parse(markInCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);

    const groupedTodosResponse1 = await agent
    .get("/todos")
    .set("Accept", "application/json");
    const parsedGroupedResponse1 = JSON.parse(groupedTodosResponse1.text);
    const countDueToday1 = parsedGroupedResponse1.DueToday.length;
    const latestTodo1 = parsedGroupedResponse1.DueToday[countDueToday1 - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${latestTodo1.id}`).send({
      _csrf: csrfToken,
      completed:true,
    });
    const parsedUpdateResponse1 = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse1.completed).toBe(false);
  });


  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    const agent=request.agent(server);
    await login(agent,"user.a@test.com","12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Delete me",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
    .get("/todos")
    .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const countDueToday = parsedGroupedResponse.DueToday.length;
    const latestTodo = parsedGroupedResponse.DueToday[countDueToday - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const deleteResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const parsedUpdateResponse = JSON.parse(deleteResponse.text);
    expect(parsedUpdateResponse.success).toBe(true);
  });
});
