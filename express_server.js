////////////////////////////////////////////////////////////////////////////////////
// Requires / Packages
///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')

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
// Helpers
///////////////////////////////////////////////////////////////////////////////////
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

// Function to filter URLs based on userID
const urlsForUser = (id) => {
  const userUrls = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }

  return userUrls;
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
  };
  
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
  };

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
  const passwordsMatch = bcrypt.compareSync(password, foundUser.password); // makes sure it matches the encrypted password
    if(!passwordsMatch) {
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
  res.redirect("/login");
});

// GET / URLS main page
app.get("/urls", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  const userUrls = urlsForUser(userID);

  const templateVars = { 
    user: users[userID],
    urls: userUrls,
  };

  res.render("urls_index", templateVars);
});

// GET / URLS show page CHECK THIS - ARE THERE 2??
app.get("/urls", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  const url = urlDatabase[shortURL];


  const templateVars = { 
    user: users[userID],
    urls: urlDatabase[shortURL],
    longURL: url.longURL,
  };
  
  res.render("urls_show", templateVars);
});

// POST / generate short URL
app.post("/urls", (req, res) => {
  let userID = req.session["userID"]; // replaces the "userID" with the name of the cookie
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

    // check if they are logged in
    if (!userID) {
      return res.status(403).send("You must be logged in to generate shortened URLS");
    };

  // Store randomly generated short URL in urlDatabase
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID,
  };

  res.redirect(`/urls/${shortURL}`); // Redirect to the dynamically generated id page
});

// GET / new URLS
app.get("/urls/new", (req, res) => {
  const user = users[req.session.userID];
  
  // check if they are logged in
  if (!user) {
    return res.redirect("/login");
  };
  
  const templateVars = { 
    user: user,
    urls: urlDatabase,
  };
  res.render("urls_new", templateVars);
});


// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {
  const urlToDelete = req.params.id;
  const userID = req.session.userID;

  // Check if the requested URL exists
  if (!urlDatabase[urlToDelete]) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the user is not logged in
  if (!userID) {
    res.status(401).send("You must be logged in to delete this URL");
    return;
  }

  // Check if the URL belongs to the currently logged-in user
  if (urlDatabase[urlToDelete].userID === userID) {
    // Delete the URL
    delete urlDatabase[urlToDelete];
    res.redirect("/urls/");
  } else {
    // User does not own the URL
    res.status(403).send("You don't have permission to delete this URL");
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


// GET / urls/:id
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  const userID = req.session.userID;

   // Check if the user is logged in
   if (!userID) {
    res.status(401).send("You must be logged in to view this URL.");
    return;
  };

    // Check if the URL exists
    if (!url) {
      res.status(404).send("URL not found");
      return;
    };

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

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

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
