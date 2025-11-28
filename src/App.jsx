import { useEffect, useMemo, useState } from "react";
import { createEntry, deleteEntry, fetchEntries } from "./api.js";

const moods = ["grateful", "calm", "energized", "optimistic", "curious"];

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("");

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(moods[0]);
  const [tags, setTags] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
      alert("Could not load entries. Is the API running on port 4000?");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !note.trim()) return;
    setSaving(true);
    try {
      await createEntry({
        title: title.trim(),
        note: note.trim(),
        mood,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setTitle("");
      setNote("");
      setTags("");
      setMood(moods[0]);
      refresh();
    } catch (err) {
      console.error(err);
      alert("Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete entry.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((entry) => {
      const matchesQuery =
        entry.title.toLowerCase().includes(q) || entry.note.toLowerCase().includes(q);
      const matchesMood = moodFilter ? entry.mood === moodFilter : true;
      return matchesQuery && matchesMood;
    });
  }, [entries, query, moodFilter]);

  const stats = useMemo(() => {
    const moodsCount = entries.reduce((acc, item) => {
      acc[item.mood] = (acc[item.mood] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: entries.length,
      topMood:
        Object.entries(moodsCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      tags: entries.flatMap((e) => e.tags ?? []).length,
    };
  }, [entries]);

  return (
    <div className="app">
      <section className="hero">
        <div>
          <h1>Happy Notes</h1>
          <p>
            Quick check-ins for moments of gratitude, calm, or curiosity. Capture small wins,
            spot patterns, and keep the mood momentum going.
          </p>
          <div className="metrics" style={{ marginTop: 14 }}>
            <span className="pill">
              <strong>{stats.total}</strong> entries
            </span>
            <span className="pill">
              <strong>{stats.topMood}</strong> vibe trending
            </span>
            <span className="pill">
              <strong>{stats.tags}</strong> tags logged
            </span>
          </div>
        </div>
        <div className="filters">
          <input
            placeholder="Search notes or feelings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
            <option value="">All moods</option>
            {moods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button className="ghost-btn" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h2>
            Add a note <small>{saving ? "Saving..." : "Keep it short and honest."}</small>
          </h2>
          <form onSubmit={handleCreate}>
            <label>
              Title
              <input
                placeholder="What lifted you up?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label>
              Details
              <textarea
                placeholder="What happened, and how did it make you feel?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </label>
            <div className="inline">
              <label style={{ flex: 1 }}>
                Mood
                <select value={mood} onChange={(e) => setMood(e.target.value)}>
                  {moods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ flex: 2 }}>
                Tags
                <input
                  placeholder="Comma separated e.g. outdoors, friends"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </label>
            </div>
            <button className="solid-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Log it"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>
            Recent entries <small>{filtered.length} showing</small>
          </h2>
          {filtered.length === 0 ? (
            <div className="empty">No entries yet. Start with one small win.</div>
          ) : (
            <div className="list">
              {filtered.map((entry) => (
                <article key={entry.id} className="card">
                  <header>
                    <h3 className="title">{entry.title}</h3>
                    <span className={`mood ${entry.mood}`}>{entry.mood}</span>
                  </header>
                  <p className="note">{entry.note}</p>
                  {entry.tags?.length ? (
                    <div className="tags">
                      {entry.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="meta">
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                    <div className="actions">
                      <button className="ghost-btn" onClick={() => handleDelete(entry.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
