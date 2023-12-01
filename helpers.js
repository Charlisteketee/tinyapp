const urlDatabase = require("./express_server");
////////////////////////////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////////////////////////
const findUserWithEmail = (email, usersDatabase) => {
  for (const userID in usersDatabase) {
    const user = usersDatabase[userID];

    if (user.email === email) {
      return user;
    }
  }

  return null;
};

// Function to generate random ID's for URLS and users
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Function to filter URLs based on userID
const urlsForUser = (id, urlDatabase) => {
  const userUrls = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }

  return userUrls;
};

module.exports = {findUserWithEmail, generateRandomString, urlsForUser};