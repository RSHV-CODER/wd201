const http = require("http");
const fs = require("fs");

let homeContent = "";
let projectContent = "";
let regContent = "";

const args = require("minimist")(process.argv.slice(2));
console.log(args.port);

fs.readFile("home.html", (err, home) => {
  if (err) {
    console.error("Error reading home.html:", err);
    return;
  }
  homeContent = home;
});

fs.readFile("project.html", (err, project) => {
  if (err) {
    console.error("Error reading project.html:", err);
    return;
  }
  projectContent = project;
});

fs.readFile("registration.html", (err, reg) => {
  if (err) {
    console.error("Error reading registration.html:", err);
    return;
  }
  regContent = reg;
});

http.createServer((req, res) => {
  let url = req.url;
  if (url === "/project") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(projectContent);
    res.end();
  } else if (url === "/registration") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(regContent);
    res.end();
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(homeContent);
    res.end();
  }
}).listen(args.port);