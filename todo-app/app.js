const express = require("express");
const path = require("path");
const app = express();
const { Todo, User } = require("./models");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStrategy = require("passport-local");
const bcrypt = require('bcrypt');
const flash = require("connect-flash");

const saltRounds = 10;

app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({
  secret: "my-super-secret-key-15261562217281726",
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ where: { email: username } });
    const result = await bcrypt.compare(password, user.password);
    
    if (result) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid given password" });
    }
  } catch (error) {
    return done(null, false, { message: "Invalid registered email" });
  }
}));

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.get("/", async (request, response) => {
  try {
    const allTodos = await Todo.getTodo();
    if (request.accepts("html")) {
      response.render('index', {
        allTodos
      });
    } else {
      response.json({
        allTodos
      });
    }
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const loggedInUser = req.user.id;
  const allItems = await Todo.getTodos();
  const overDue = await Todo.overdue(loggedInUser);
  const dueLater = await Todo.dueLater(loggedInUser);
  const dueToday = await Todo.dueToday(loggedInUser);
  const completedItems = await Todo.completed(loggedInUser);

  if (req.accepts("html")) {
    res.render("todo", {
      title: "Todo application",
      allItems,
      overDue,
      dueLater,
      dueToday,
      completedItems,
      user: req.user,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      overDue,
      dueLater,
      dueToday,
      completedItems,
    });
  }
});

app.get("/todos/:id", async (req, res) => {
  try {
    const getTodos = await Todo.findByPk(req.params.id);
    return res.json(getTodos);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (!req.body.title) {
    req.flash("error", "Empty title not allowed");
    res.redirect("/todos");
  }
  if (!req.body.dueDate) {
    req.flash("error", "Blank dueDate not allowed");
    res.redirect("/todos");
  }
  try {
    const todo = await Todo.addTodo({
      title: req.body.title, 
      dueDate: req.body.dueDate,
      userId: req.user.id,
    });
    req.flash("success", "Todo Item added successfully");
    return res.redirect('/todos');
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

// ... (continued for other routes)

module.exports = app;

