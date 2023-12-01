const { assert } = require('chai');
const { findUserWithEmail, urlsForUser } = require('../helpers.js');


const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const testUsers = {
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

const testUrlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abc",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "def",
  },
};

describe('findUserWithEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserWithEmail("a@a.com", testUsers);
    const expectedUserID = "abc";
    assert.equal(user.id, expectedUserID, "User ID should equal expectedUserID");
  });
  
  it('Should return null with an invalid email', function() {
    const user = findUserWithEmail("goofie@g.com", testUsers);
  
    // Check if user is null before accessing properties
    if (user === null) {
      assert.isNull(user, "User should be null");
    } else {
      assert.fail("User should be null");
    }
  });
  
});

describe('urlsForUser', function() {
  it('should return user URLs for a valid user ID', function() {
    const userID = "abc";
    const userUrls = urlsForUser(userID, testUrlDatabase);
    const expectedUrls = {
      b2xVn2: {
        longURL: "http://www.lighthouselabs.ca",
        userID: "abc",
      }
    };
    assert.deepStrictEqual(userUrls, expectedUrls, "User URLs should match expected URLs");
  });

  it('should return an empty object for an invalid user ID', function() {
    const userID = "invalidID";
    const userUrls = urlsForUser(userID);
    const expectedUrls = {};
    assert.deepEqual(userUrls, expectedUrls, "User URLs should be an empty object");
  });
});