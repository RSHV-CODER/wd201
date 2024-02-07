/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Todo, User } = require("./models");

const bodyParser = require("body-parser");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const path = require("path");
const flash = require("connect-flash");

app.use(flash());
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use(session({
  secret: "my-super-secret-key-66498466848",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

// Passport Configuration
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ where: { email: username } });
    if (!user) return done(null, false, { message: "Invalid E-mail" });
    const result = await bcrypt.compare(password, user.password);
    if (result) return done(null, user);
    return done(null, false, { message: "Invalid password" });
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findByPk(id).then(user => done(null, user)).catch(error => done(error)));

// Routes
app.get("/", (request, response) => {
  if (request.isAuthenticated()) return response.redirect("/todos");
  response.render("index", { csrfToken: request.csrfToken() });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  const Overdue = await Todo.OverdueTodos(loggedInUser);
  const DueToday = await Todo.dueTodayTodos(loggedInUser);
  const DueLater = await Todo.dueLaterTodos(loggedInUser);
  const Complete = await Todo.CompletedTodos(loggedInUser);
  if (request.accepts("html")) {
    response.render("todos", {
      title: "Todo application",
      Overdue,
      DueToday,
      DueLater,
      Complete,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ Overdue, DueToday, DueLater, Complete });
  }
});

app.get("/signup", (request, response) => {
  if (request.isAuthenticated()) return response.redirect("/todos");
  response.render("signup", { title: "Signup", csrfToken: request.csrfToken() });
});

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  const trimmedPassword = request.body.password.trim();
  if (request.body.firstName.length === 0) {
    request.flash("error", "First name required");
    return response.redirect("/signup");
  } else if (request.body.email.length === 0) {
    request.flash("error", "Email is required");
    return response.redirect("/signup");
  } else if (trimmedPassword.length === 0) {
    request.flash("error", "Password is required");
    return response.redirect("/signup");
  }
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    });
    request.login(user, (err) => { if (err) console.log(err); response.redirect("/todos"); });
  } catch (error) { console.log(error); }
});

app.get("/login", (request, response) => {
  if (request.isAuthenticated()) return response.redirect("/todos");
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post("/session", passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), (request, response) => response.redirect("/todos"));

app.get("/signout", (request, response, next) => request.logout(err => { if (err) return next(err); response.redirect("/"); }));

app.get("/", (_request, response) => response.send("Hello World"));

app.get("/todos", async (_, response) => {
  try {
    console.log("Processing list of all Todos ...");
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) { console.log(error); return response.status(500).json({ error: "Internal Server Error" }); }
});

app.get("/todos/:id", async (request, response) => {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) { console.log(error); return response.status(422).json(error); }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  if (request.body.title.trim().length === 0 || request.body.dueDate.trim().length === 0) {
    request.flash("error", "Todo title and due date cannot be empty");
    return response.redirect("/todos");
  }
  try {
    await Todo.addTodo({ title: request.body.title, dueDate: request.body.dueDate, userId: request.user.id });
    return response.redirect("/todos");
  } catch (error) { console.log(error); return response.status(422).json(error); }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) { console.log(error); return response.status(422).json(error); }
});

app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  try {
    await Todo.remove(request.params.id, loggedInUser);
    return response.json({ success: true });
  } catch (error) { console.log(error); return response.status(500).json(error); }
});

module.exports = app;
