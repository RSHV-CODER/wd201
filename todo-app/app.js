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

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

// Passport Configuration
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  // Finding the user in the database
  User.findOne({ where: { email: username } })
    .then(async function (user) {
      // Comparing passwords using bcrypt
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Invalid password" });
      }
    })
    .catch((error) => {
      return done(null, false, { message: "Invalid E-mail" });
    });
}));

passport.serializeUser((user, done) => {
  // Serializing user in the session
  console.log("Serializing user in session", user.id)
  done(null, user.id)
});

passport.deserializeUser((id, done) => {
  // Deserializing user from the session
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error, null)
    })
});

// Homepage Route
app.get("/", async (request, response) => {
  // Redirect to todos if already authenticated
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

// Todos Route
app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  // Fetching todos based on different criteria
  const Overdue = await Todo.OverdueTodos(loggedInUser);
  const DueToday = await Todo.dueTodayTodos(loggedInUser);
  const DueLater = await Todo.dueLaterTodos(loggedInUser);
  const Complete = await Todo.CompletedTodos(loggedInUser);
  if (request.accepts("html")) {
    // Rendering HTML view for todos
    response.render("todos", {
      title: "Todo application",
      Overdue,
      DueToday,
      DueLater,
      Complete,
      csrfToken: request.csrfToken(),
    });
  } else {
    // Responding with JSON for API requests
    response.json({
      Overdue,
      DueToday,
      DueLater,
      Complete,
    });
  }
});

// Signup Route
app.get("/signup", (request, response) => {
  // Redirect to todos if already authenticated
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  // Rendering signup view
  response.render("signup", { title: "Signup", csrfToken: request.csrfToken() });
});

// User Creation Route
app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  console.log(hashedPwd)
  const trimmedPassword = request.body.password.trim();
  // Handling user creation
  if (request.body.firstName.length == 0) {
    request.flash("error", "First name required");
    return response.redirect("/signup");
  } else if (request.body.email.length == 0) {
    request.flash("error", "Email is required");
    return response.redirect("/signup");
  } else if (trimmedPassword.length == 0) {
    request.flash("error", "password is required");
    return response.redirect("/signup");
  }
  try {
    // Creating a new user
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    });
    // Logging in the user
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

// Login Route
app.get("/login", (request, response) => {
  // Redirect to todos if already authenticated
  if (request.isAuthenticated()) {
    return response.redirect("/todos");
  }
  // Rendering login view
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

// Authentication Route
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    // Redirect to todos on successful login
    console.log(request.user);
    response.redirect("/todos");
  }
);

// Signout Route
app.get("/signout", (request, response, next) => {
  // Logging out the user
  request.logout((err) => {
    if (err) { return next(err); }
    response.redirect("/");
  })
});

// Sample Route
app.get("/", function (request, response) {
  response.send("Hello World");
});

// Todos API Route
app.get("/todos", async function (_request, response) {
  try {
    console.log("Processing list of all Todos ...");
    // Fetching all todos
    const todos = await Todo.findAll();
    // Responding with JSON
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: "Internal Server Error" });
  }
});

// Single Todo API Route
app.get("/todos/:id", async function (request, response) {
  try {
    // Fetching a single todo by ID
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Create Todo API Route
app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Creating a todo", request.body);
  console.log(request.user);
  if (request.body.title.trim().length === 0) {
    request.flash("error", "Todo title cannot be empty");
    return response.redirect("/todos");
  }
  if (request.body.dueDate.trim().length === 0) {
    request.flash("error", "Todo due date cannot be empty");
    return response.redirect("/todos");
  }
  try {
    // Creating a new todo
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id
    });
    return response.redirect("/todos");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Update Todo API Route
app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    // Updating the completion status of a todo
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Delete Todo API Route
app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("Deleting a Todo with ID: ", request.params.id);
  const loggedInUser = request.user.id;
  try {
    // Removing a todo
    await Todo.remove(request.params.id, loggedInUser);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(500).json(error);
  }
});

module.exports = app;
