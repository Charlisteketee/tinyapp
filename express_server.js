const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

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

app.post("/urls/:id/update", (req, res) => {
  console.log("POST request received for updating URL");
  const urlToUpdate = req.params.id;
  const newLongURL = req.body.updatedLongURL;

  console.log("Updating URL:", urlToUpdate);
  console.log("New Long URL:", newLongURL);

  // Update the value of the stored long URL
  urlDatabase[urlToUpdate] = newLongURL;

  console.log("Redirecting to:", `/urls/${urlToUpdate}`);
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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const length = 6;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
// in separate terminal or browser type curl http://localhost:8080/urls.json to see JSON representation of the 'urlDatabase'
// or /hello to see hello world (world in bold)
// curl -i http://localhost:8080/hello to see the response headers (one on each line), followed by the HTML content that the /hello path responds with: <html><body>Hello <b>World</b></body></html>
