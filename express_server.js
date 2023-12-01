////////////////////////////////////////////////////////////////////////////////////
// Requires / Packages
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const helpers = require("./helpers");

////////////////////////////////////////////////////////////////////////////////////
// Variables/Set-Up
///////////////////////////////////////////////////////////////////////////////////
const app = express();
const PORT = 8080; // default port 8080
const salt = bcrypt.genSaltSync(10);

////////////////////////////////////////////////////////////////////////////////////
// Configuration
///////////////////////////////////////////////////////////////////////////////////
app.set("view engine", "ejs");

////////////////////////////////////////////////////////////////////////////////////
// Middleware
///////////////////////////////////////////////////////////////////////////////////
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); // creates and populates req.body
app.use(cookieParser()); // creates and populates req.cookies
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

////////////////////////////////////////////////////////////////////////////////////
// Databases
///////////////////////////////////////////////////////////////////////////////////
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abc",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "def",
  },
};

const users = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: bcrypt.hashSync("1234", salt),
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: bcrypt.hashSync("5678", salt),
  },
};


////////////////////////////////////////////////////////////////////////////////////
// Routes
///////////////////////////////////////////////////////////////////////////////////

// GET / register
app.get("/register", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  
  // check if the user is already logged in
  if (userID) {
    return res.redirect("/urls");
  }
  
  const templateVars = {
    id: req.params.id,
    user: users[userID], // Looks up the user object in the users object using the userID
    urls: urlDatabase,
  };
  res.render("urls_registration", templateVars);
});


// POST / register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // if they did NOT give us an email or password
  if (!email || !password) {
    return res.status(400).send("Please provide an email and password");
  }

  const foundUser = helpers.findUserWithEmail(email, users);

  // did we find an existing user
  if (foundUser) {
    return res.status(400).send("A user with that email already exists");
  }

  // the email is unique! create a new user object
  const userID = helpers.generateRandomString();

  // hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = {
    id: userID,
    email: email,
    password: hashedPassword, // store hashed password
  };
 
  // Store randomly generated userID in users database
  users[userID] = user;

  // Set a cookie with the userID
  req.session.userID = userID; // will be encrypted

  res.redirect("/urls");
});


// GET / login
app.get("/login", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  
  // check if the user is already logged in
  if (userID) {
    return res.redirect("/urls");
  }

  const templateVars = {
    id: req.params.id,
    user: users[userID], // Looks up the user object in the users object using the userID
    urls: urlDatabase,
  };
  res.render("urls_login", templateVars);
});


// POST / login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // did NOT give us an email or password
  if (!email || !password) {
    return res.status(403).send("Please provide an email and password");
  }

  const foundUser = helpers.findUserWithEmail(email, users);

  // did NOT find a user
  if (!foundUser) {
    return res.status(403).send("No user with that email found");
  }

  console.log("Found user:", foundUser);

  // Check if the user has a valid password
  if (!foundUser.password) {
    console.error("User has no password:", foundUser);
    return res.status(500).send("Internal server error"); // Handle the error appropriately
  }

  // email and password does NOT match
  const passwordsMatch = bcrypt.compareSync(password, foundUser.password); // makes sure it matches the encrypted password
  if (!passwordsMatch) {
    return res.status(403).send("Passwords do not match");
  }

  // The HAPPY PATH - user is who they say they are

  // Set a cookie with the userID
  req.session.userID = foundUser.id; // will be encrypted

  res.redirect("/urls"); // WHERE ARE WE GOING AFTER LOGGING IN??
});


// POST / Logout
app.post("/logout", (req, res) => {
  req.session = null; // clears the userID cookie
  console.log("Session after logout:", req.session); // check if it cleared the cookies
  res.redirect("/login");
});


// GET / urls
app.get("/urls", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  const userUrls = helpers.urlsForUser(userID, urlDatabase);

  const templateVars = {
    user: users[userID],
    urls: userUrls,
  };

  res.render("urls_index", templateVars);
});


// POST / urls
app.post("/urls", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  const shortURL = helpers.generateRandomString();
  const longURL = req.body.longURL;

  // check if they are logged in
  if (!userID) {
    return res.status(403).send("You must be logged in to generate shortened URLS");
  }

  // Store randomly generated short URL in urlDatabase
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID,
  };

  res.redirect(`/urls/${shortURL}`); // Redirect to the dynamically generated id page
});


// GET / urls/new
app.get("/urls/new", (req, res) => {
  const user = users[req.session.userID];
  
  // check if they are logged in
  if (!user) {
    return res.redirect("/login");
  }
  
  const templateVars = {
    user: user,
    urls: urlDatabase,
  };
  res.render("urls_new", templateVars);
});


// GET / urls/:id
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  const userID = req.session.userID;

  // Check if the user is logged in
  if (!userID) {
    res.status(401).send("You must be logged in to view this URL.");
    return;
  }

  // Check if the URL exists
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }


  // Check if the URL belongs to the currently logged-in user
  if (url.userID === req.session.userID) {
    const templateVars = {
      user: users[req.session.userID], // include the logged-in user in templateVars
      urls: urlDatabase,
      id: shortURL,
      longURL: url.longURL,
    };

    res.render("urls_show", templateVars);
  } else {
    res.status(403).send("You do not have permission to view this URL.");
  }
});


// POST / urls/:id
app.post("urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;

  if (!userID) {
    return res.status(401).send("Please log in");
  }

  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found");
  }

  if (userID === urlDatabase[id].userID) {
    urlDatabase[id].longURL = req.body.longURL;
    return res.redirect("/urls");
  } else {
    return res.status(403).send("You do not have authorization to edit this.");
  }
});


// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  const urlToDelete = req.params.id;
  const userID = req.session.userID;

  if (!urlToDelete || !urlDatabase[urlToDelete]) {
    return res.status(404).send("URL not found");
  }

  // Check if the user is not logged in
  if (!userID) {
    return res.status(401).send("You must be logged in to delete this URL");
  }

  // Check if the URL belongs to the currently logged-in user
  if (urlDatabase[urlToDelete].userID === userID) {
    // Delete the URL
    delete urlDatabase[urlToDelete];
    return res.redirect("/urls/");
  } else {
    // User does not own the URL
    return res.status(403).send("You don't have permission to delete this URL");
  }
});


// POST /urls/:id/update
app.post("/urls/:id/update", (req, res) => {
  const urlToUpdate = req.params.id;
  const newLongURL = req.body.updatedLongURL;
  const userID = req.session.userID;

  // Check if the requested URL exists
  if (!urlDatabase[urlToUpdate]) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the user is not logged in
  if (!userID) {
    res.status(401).send("You must be logged in to update this URL");
    return;
  }

  // Check if the URL belongs to the currently logged-in user
  if (urlDatabase[urlToUpdate].userID === userID) {
    // Update the value of the stored long URL
    urlDatabase[urlToUpdate].longURL = newLongURL;
    res.redirect("/urls");
  } else {
    // User does not own the URL
    res.status(403).send("You don't have permission to update this URL");
  }
});


// GET / u/:id
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const id = urlDatabase[shortURL];

  if (!id) {
    res.status(404).send("URL not found");
    return;
  }

  const longURL = id.longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


module.exports = { urlDatabase, users };
// in separate terminal or browser type curl http://localhost:8080/urls.json to see JSON representation of the 'urlDatabase'
// or /hello to see hello world (world in bold)
// curl -i http://localhost:8080/hello to see the response headers (one on each line), followed by the HTML content that the /hello path responds with: <html><body>Hello <b>World</b></body></html>
