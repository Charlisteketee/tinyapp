const express = require("express");
const morgan = require('morgan');
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

// Configuration
app.set("view engine", "ejs");

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); // creates and populates req.body
app.use(cookieParser()); // creates and populates req.cookies

// Databases
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: "1234",
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: "5678",
  },
};

// Helpers
const findUserWithEmail = (email) => {
  for (const userID in users) {
    const user = users[userID];

    if (user.email === email) {
      return user;
    }
  }

  return null;
};

// Function to generate random ID's for URLS and users
function generateRandomString() {
  const id = Math.random().toString(36).substring(2, 5);
  return id;
};

// GET / register
app.get("/register", (req, res) => {
  let userID = req.cookies["userID"]; // replaces the "userID" with the name of the cookie
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

  // did they NOT give us an email or password
  if (!email || !password) {
    return res.status(400).send("Please provide an email and password");
  }

  const foundUser = findUserWithEmail(email);

  // did we find an existing user
  if (foundUser) {
    return res.status(400).send("A user with that email already exists");
  }

  // the email is unique! create a new user object
  const userID = generateRandomString();

  const user = {
    id: userID,
    email: email,
    password: password,
  };
 
 // Store randomly generated userID in users database
 users[userID] = user;

 // Set a cookie with the userID
 res.cookie("userID", userID);
 res.redirect("/urls");
});

// GET / login
app.get("/login", (req, res) => {
  let userID = req.cookies["userID"]; // replaces the "userID" with the name of the cookie
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

  const foundUser = findUserWithEmail(email); 

  // did NOT find a user
  if (!foundUser) {
    return res.status(403).send("No user with that email found");
  }

  // email and password does NOT match
  if (foundUser.password !== password) {
    return res.status(403).send("Passwords do not match");
  }

  // The HAPPY PATH - user is who they say they are

  // Set a cookie with the userID
  res.cookie("userID", foundUser.id);

  res.redirect("/urls"); // WHERE ARE WE GOING AFTER LOGGING IN??
});

// POST / Logout
app.post("/logout", (req, res) => {
  res.clearCookie("userID"); // clears the userID cookie
  res.redirect("/login");
});

// GET / URLS main page
app.get("/urls", (req, res) => {
  let userID = req.cookies["userID"]; // replaces the "userID" with the name of the cookie
  const templateVars = { 
    user: users[userID],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

// GET / URLS show page
app.get("/urls", (req, res) => {
  let userID = req.cookies["userID"]; // replaces the "userID" with the name of the cookie
  const templateVars = { 
    user: users[userID],
    urls: urlDatabase,
  };
  res.render("urls_show", templateVars);
});

// GET / new URLS
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.userID];
  const templateVars = { 
    user: user,
    urls: urlDatabase,
  };
  res.render("urls_new", templateVars);
});

// POST / generate short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  // Store randomly generated short URL in urlDatabase
  urlDatabase[shortURL] = longURL;

  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`); // Redirect to the dynamically generated id page
});

// POST / delete URL 
app.post("/urls/:id/delete", (req, res) => {
  const urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete]; 

  res.redirect("/urls/");
});

// Add a POST route to update the value of the stored long URL
app.post("/urls/:id/update", (req, res) => {
  const urlToUpdate = req.params.id;
  const newLongURL = req.body.updatedLongURL;

  // Update the value of the stored long URL
  urlDatabase[urlToUpdate] = newLongURL;

  res.redirect("/urls");
});

// GET / URL show page
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    const templateVars = { id: shortURL, longURL: longURL };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("URL not found");
  }
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL); // res.redirect sends a 302 Found status code
  } else {
    res.status(404).send("URL not found"); // Handles client requests for a non-existant id
  }
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

// in separate terminal or browser type curl http://localhost:8080/urls.json to see JSON representation of the 'urlDatabase'
// or /hello to see hello world (world in bold)
// curl -i http://localhost:8080/hello to see the response headers (one on each line), followed by the HTML content that the /hello path responds with: <html><body>Hello <b>World</b></body></html>
