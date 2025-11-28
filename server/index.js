import express from "express";
import cors from "cors";
import { initDb, seedDb, repo } from "./db.js";

const PORT = process.env.PORT || 4000;

const db = initDb();
seedDb(db);
const store = repo(db);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/entries", (_req, res) => {
  res.json(store.list());
});

app.post("/api/entries", (req, res) => {
  const { title, note, mood, tags = [] } = req.body;
  if (!title || !note || !mood) {
    return res.status(400).json({ error: "title, note, and mood are required" });
  }
  const { id } = store.create({ title, note, mood, tags });
  res.status(201).json({ id });
});

app.patch("/api/entries/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const updated = store.update(id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

app.delete("/api/entries/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const ok = store.remove(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});


const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
console.log("Hello from vuln test. Args:", args);
