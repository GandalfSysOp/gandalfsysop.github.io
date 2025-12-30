const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  const text = await res.text();

  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

/* ================= PEOPLE ================= */

let PEOPLE_MAP = {};

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;

  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

function personName(id) {
  return PEOPLE_MAP[id] || id || "-";
}

/* ================= FETCH ================= */

async function fetchAnnouncements() {
  const list = document.getElementById("list");
  list.innerHTML = "Loading…";

  await loadPeople();

  const data = await apiGet("announcements");
  const announcements = data.announcements || [];

  document.getElementById("count").innerText =
    `Total announcements: ${data.total_count}`;

  renderAnnouncements(announcements);
}

/* ================= RENDER ================= */

function renderAnnouncements(items) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = "<p>No announcements found</p>";
    return;
  }

  items.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="title">
        ${a.pinned ? "📌 " : ""}${a.title}
        <span style="font-size:12px;color:#6b7280;">(ID: ${a.id})</span>
      </div>

      <div style="margin:6px 0;font-size:13px;">
        ${a.description || "<em>No description</em>"}
      </div>

      <div class="meta">
        Created by: <strong>${personName(a.created_by)}</strong> |
        Updated by: <strong>${personName(a.updated_by)}</strong>
      </div>

      <div class="meta">
        Created: ${a.created_at} |
        Updated: ${a.updated_at}
      </div>

      <div class="assigned">
        <strong>Assigned:</strong>
        ${a.assigned.length
          ? a.assigned.map(personName).join(", ")
          : "-"}
      </div>

      <div class="assigned">
        <strong>Seen by:</strong>
        ${a.seen.length
          ? a.seen.map(personName).join(", ")
          : "-"}
      </div>

      <div class="meta">
        Status: <span class="badge">${a.status}</span>
        ${a.pinned ? '<span class="badge">Pinned</span>' : ""}
        ${a.by_me ? '<span class="badge">By me</span>' : ""}
      </div>

      <div class="meta">
        Comments: ${a.comments?.count || 0} |
        Attachments: ${a.attachments.length}
      </div>
    `;

    container.appendChild(div);
  });
}
