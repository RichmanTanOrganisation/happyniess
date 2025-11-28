# Happy Notes

Full-stack React + Express app for quick gratitude/mood notes with a tiny SQLite backing store.

## Stack
- Vite + React 18, modern CSS
- Express API with SQLite (better-sqlite3), CORS enabled
- Single package with `concurrently` to run client + server

## Getting started
1) Install dependencies  
`npm install`

2) Run the API + frontend together  
`npm run dev`  
API: http://localhost:4000  
UI: http://localhost:5173 (proxied API so it works without CORS fuss)

3) Seed data again (optional)  
`npm run db:reset`

## Config
- Override API base for the client by setting `VITE_API_BASE` (defaults to `http://localhost:4000`).

## What’s inside
- `server/index.js` Express API with CRUD for entries.
- `server/db.js` SQLite setup + seed + repo helpers.
- `src/App.jsx` React UI (filters, entry list, add form).
- `src/api.js` small fetch helpers.

## Security testing note
- `fake_vuln_demo.txt` intentionally holds a dummy GitHub token pattern for scanner/alert testing. It is not real—delete after testing.
