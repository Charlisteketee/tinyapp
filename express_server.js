const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Users database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Function to generate random ID's for URLS and users
function generateRandomString() {
  const length = 6;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};


app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
  };
  res.render("urls_registration", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});


// Add a POST route to handle registration
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // generate random user ID
  const userID = generateRandomString();
  // Create a new user object
  const newUser = {
    id: userID,
    email: email,
    password: password
  };
 // Store randomly generated userID in users database
 users[userID] = newUser;
 // Set a cookie with the userID
 res.cookie("user_ID", userID);
 res.redirect("/urls");
});

// Add a POST route to handle login 
app.post("/login", (req, res) => {
  console.log(req.body); // Log the request body to the console

  const username = req.body.username;

  // Set a cookie with the username
  res.cookie("username", username);

  res.redirect("/urls");
});

// Add a POST route to handle Logout
app.post("/logout", (req, res) => {
  res.clearCookie("username"); // clears the username cookie
  res.redirect("/urls");
});

// Add POST route to generate short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  // Store randomly generated short URL in urlDatabase
  urlDatabase[shortURL] = longURL;

  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`); // Redirect to the dynamically generated id page
});

// Add a POST route to handle deletion of a URL 
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
    res.redirect(longURL); // red.redirect sends a 302 Found status code
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
