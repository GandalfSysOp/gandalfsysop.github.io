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

/* ================= UTIL ================= */

function decodeHtml(html) {
  if (!html) return "<em>No description</em>";
  const t = document.createElement("textarea");
  t.innerHTML = html;
  return t.value;
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadPeople();
  await loadAnnouncementDropdown();
}

/* ================= DROPDOWN ================= */

async function loadAnnouncementDropdown() {
  const select = document.getElementById("announcementSelect");

  const data = await apiGet("announcements");
  const announcements = data.announcements || [];

  select.innerHTML = `<option value="">Select announcement</option>`;

  announcements.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.id} – ${a.title}`;
    select.appendChild(opt);
  });
}

/* ================= ACTION ================= */

async function getSelectedAnnouncement() {
  const id = document.getElementById("announcementSelect").value;
  if (!id) return alert("Select an announcement");

  const container = document.getElementById("output");
  container.innerHTML = "Loading…";

  const data = await apiGet(`announcements/${id}`);
  const a = data.announcements?.[0];

  if (!a) {
    container.innerHTML = "<p>No announcement found</p>";
    return;
  }

  renderAnnouncement(a);
}

/* ================= RENDER ================= */

function renderAnnouncement(a) {
  const container = document.getElementById("output");

  container.innerHTML = `
    <div class="card">
      <div class="title">
        ${a.pinned ? "📌 " : ""}${a.title}
        <span class="meta">(ID: ${a.id})</span>
      </div>

      <div class="meta">
        Created: ${a.created_at} |
        Updated: ${a.updated_at}
      </div>

      <div class="meta">
        Created by: <strong>${personName(a.created_by)}</strong> |
        Updated by: <strong>${personName(a.updated_by)}</strong>
      </div>

      <div class="section">
        <span class="badge">${a.status}</span>
        ${a.pinned ? '<span class="badge">Pinned</span>' : ""}
        ${a.by_me ? '<span class="badge">By me</span>' : ""}
      </div>

      <div class="section">
        <div class="label">Description</div>
        <div class="description">
          ${decodeHtml(a.description)}
        </div>
      </div>

      <div class="section">
        <div class="label">Assigned</div>
        ${a.assigned.length ? a.assigned.map(personName).join(", ") : "-"}
      </div>

      <div class="section">
        <div class="label">Seen by</div>
        ${a.seen.length ? a.seen.map(personName).join(", ") : "-"}
      </div>

      <div class="meta">
        Comments: ${a.comments?.count || 0} |
        Attachments: ${a.attachments.length}
      </div>
    </div>
  `;
}
