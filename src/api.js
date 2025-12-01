const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const handle = async (res) => {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.status === 204 ? null : res.json();
};

export const fetchEntries = () => fetch(`${BASE_URL}/api/entries`).then(handle);

export const createEntry = (payload) =>
  fetch(`${BASE_URL}/api/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);

export const deleteEntry = (id) =>
  fetch(`${BASE_URL}/api/entries/${id}`, { method: "DELETE" }).then(handle);

export const updateEntry = (id, payload) =>
  fetch(`${BASE_URL}/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
