/*
Create a function that takes in three parameters: 
1. contacts: an array of contact object
2. contactName: name of the contact for which you want to find a friend,
3. field: the field of friend we want to retieve

INPUT: contacts name and means of communicating with their friend

OUTPUT: the first friend in their contact list and their phone number or email
*/

// EXAMPLE DATA BELOW
const contacts = [
  {
    name: "Laurel",
    phone: "123 456 7890",
    email: "laurel@comics.com",
    friends: ["Hardy", "Abbott", "Costello"]
  },
  {
    name: "Hardy",
    phone: "321 654 0987",
    email: "hardy@hardyharhar.com",
    friends: ["Laurel", "Buster"]
  },
  {
    name: "Buster",
    phone: "987 654 3210",
    email: "buster@keaton.ca",
    friends: ["Hardy"]
  },
  {
    name: "Abbott",
    phone: "888 123 4567",
    email: "abbott@whosonfirst.co",
    friends: ["Costello", "Laurel"]
  },
  {
    name: "Costello",
    phone: "767 676 7676",
    email: "costello@imonfirst.co",
    friends: ["Abbott", "Laurel"]
  }
];

// function called find friend with the 3 parameters
const findFriend = (contacts, contactName, field) => {
  const contact = contacts.find(c => c.name === contactName);

  if (contact && contact.friends.length > 0) {
    const friendName = contact.friends[0];
    const friend = contacts.find(c => c.name === friendName);

    if (friend && friend[field] !== undefined) {
      return { name: friendName, [field]: friend[field] };
    }
  }

  return "Not found";
};

// Examples
console.log(findFriend(contacts, "Abbott", "phone")); // { name: "Costello", phone: "767 676 7676" }
console.log(findFriend(contacts, "Buster", "email")); // { name: "Hardy", email: "hardy@hardyharhar.com" }
console.log(findFriend(contacts, "Bob", "phone")); // "Not found"
console.log(findFriend(contacts, "Costello", "birthday")); // "Not found"




