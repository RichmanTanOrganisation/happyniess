import { initDb, seedDb } from "./db.js";

const db = initDb();
db.exec("DELETE FROM entries;");
seedDb(db);
console.log("Database reset with fresh sample data.");
