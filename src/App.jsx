import { useEffect, useMemo, useState } from "react";
import { createEntry, deleteEntry, fetchEntries, updateEntry } from "./api.js";

const moods = ["grateful", "calm", "energized", "optimistic", "curious"];

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(moods[0]);
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState(null);

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
      const payload = {
        title: title.trim(),
        note: note.trim(),
        mood,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateEntry(editingId, payload);
      } else {
        await createEntry(payload);
      }
      setTitle("");
      setNote("");
      setTags("");
      setMood(moods[0]);
      setEditingId(null);
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
    const filteredEntries = entries.filter((entry) => {
      const matchesQuery =
        entry.title.toLowerCase().includes(q) || entry.note.toLowerCase().includes(q);
      const matchesMood = moodFilter ? entry.mood === moodFilter : true;
      const matchesTag = tagFilter ? entry.tags?.includes(tagFilter) : true;
      return matchesQuery && matchesMood && matchesTag;
    });

    return filteredEntries.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sort === "title") {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [entries, query, moodFilter, tagFilter, sort]);

  const stats = useMemo(() => {
    const moodsCount = entries.reduce((acc, item) => {
      acc[item.mood] = (acc[item.mood] ?? 0) + 1;
      return acc;
    }, {});
    const tagCounts = entries
      .flatMap((e) => e.tags ?? [])
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {});
    return {
      total: entries.length,
      topMood:
        Object.entries(moodsCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      tags: entries.flatMap((e) => e.tags ?? []).length,
      moodsCount,
      topTags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    };
  }, [entries]);

  const availableTags = useMemo(
    () =>
      Array.from(new Set(entries.flatMap((entry) => entry.tags ?? []))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [entries]
  );

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setNote(entry.note);
    setMood(entry.mood);
    setTags(entry.tags?.join(", ") || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setNote("");
    setTags("");
    setMood(moods[0]);
  };

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
          <div className="mood-chart">
            {moods.map((moodKey) => (
              <div key={moodKey} className="mood-bar">
                <span>{moodKey}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${((stats.moodsCount[moodKey] ?? 0) / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-count">{stats.moodsCount[moodKey] ?? 0}</span>
              </div>
            ))}
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
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
          </select>
          <button className="ghost-btn" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h2>
            {editingId ? "Edit note" : "Add a note"}{" "}
            <small>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update and press save."
                  : "Keep it short and honest."}
            </small>
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
              {saving ? "Saving..." : editingId ? "Save changes" : "Log it"}
            </button>
            {editingId ? (
              <button className="ghost-btn" type="button" onClick={cancelEdit}>
                Cancel edit
              </button>
            ) : null}
          </form>
        </section>

        <section className="panel">
          <h2>
            Recent entries{" "}
            <small>
              {filtered.length} showing {tagFilter ? `(tag: #${tagFilter})` : ""}
            </small>
          </h2>
          {stats.topTags.length ? (
            <div className="top-tags">
              {stats.topTags.map(([tag, count]) => (
                <button
                  key={tag}
                  className={`tag chip ${tagFilter === tag ? "active" : ""}`}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                >
                  #{tag} · {count}
                </button>
              ))}
            </div>
          ) : null}
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
                      <button className="ghost-btn" onClick={() => startEdit(entry)}>
                        Edit
                      </button>
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
