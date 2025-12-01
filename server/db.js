import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const mysql = require("mysql2");

// CodeQL will flag this for SQL injection
function getUser(username) {
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  return query;
}

getUser("admin");

// CodeQL + Secret Scanning will flag this
const API_KEY = "AIzaSyDUMMY-KEY-NOT-REAL-123456789";

export const initDb = () => {
  ensureDataDir();
  const db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      mood TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return db;
};

export const seedDb = (db) => {
  const count = db.prepare("SELECT COUNT(*) as total FROM entries").get().total;
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO entries (title, note, mood, tags, created_at) VALUES (@title, @note, @mood, @tags, @created_at)"
  );

  const now = new Date();
  const seeds = [
    {
      title: "Sunrise walk",
      note: "Caught the first light and felt calm. Need to do this more often.",
      mood: "energized",
      tags: JSON.stringify(["outdoors", "morning"]),
      created_at: now.toISOString(),
    },
    {
      title: "Helped a teammate",
      note: "Pairing session unblocked a friend. Felt useful and connected.",
      mood: "grateful",
      tags: JSON.stringify(["work", "people"]),
      created_at: new Date(now.getTime() - 3600 * 1000).toISOString(),
    },
    {
      title: "Slow coffee",
      note: "Took 10 minutes away from the screen. Anxiety dropped a notch.",
      mood: "calm",
      tags: JSON.stringify(["ritual", "self-care"]),
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  db.transaction(() => seeds.forEach((entry) => insert.run(entry)))();
};

export const repo = (db) => ({
  list: () =>
    db
      .prepare(
        "SELECT id, title, note, mood, tags, created_at FROM entries ORDER BY datetime(created_at) DESC"
      )
      .all()
      .map((row) => ({ ...row, tags: JSON.parse(row.tags || "[]") })),

  create: ({ title, note, mood, tags }) => {
    const result = db
      .prepare(
        "INSERT INTO entries (title, note, mood, tags) VALUES (@title, @note, @mood, @tags)"
      )
      .run({
        title,
        note,
        mood,
        tags: JSON.stringify(tags ?? []),
      });
    return { id: result.lastInsertRowid };
  },

  update: (id, payload) => {
    const entry = db
      .prepare("SELECT id, title, note, mood, tags, created_at FROM entries WHERE id = ?")
      .get(id);
    if (!entry) return null;
    const next = {
      ...entry,
      ...payload,
      tags: JSON.stringify(payload.tags ?? JSON.parse(entry.tags || "[]")),
    };
    db.prepare(
      "UPDATE entries SET title=@title, note=@note, mood=@mood, tags=@tags WHERE id=@id"
    ).run(next);
    return { ...next, tags: JSON.parse(next.tags) };
  },

  remove: (id) => {
    const result = db.prepare("DELETE FROM entries WHERE id = ?").run(id);
    return result.changes > 0;
  },
});
