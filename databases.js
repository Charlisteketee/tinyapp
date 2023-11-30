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


module.exports = { urlDatabase, users };