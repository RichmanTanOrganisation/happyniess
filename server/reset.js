import { initDb, seedDb } from "./db.js";

const db = initDb();
db.exec("DELETE FROM entries;");
seedDb(db);
console.log("Database reset with fresh sample data.");


const mysql = require("mysql2");

// CodeQL will flag this for SQL injection
function getUser(username) {
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  return query;
}

getUser("admin");

