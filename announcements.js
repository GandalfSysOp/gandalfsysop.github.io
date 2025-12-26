const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzoLhRhFe9Y6ufl2DVFwh9mEWdRTelfD1EA7xSesXOWXsmYH9NoeXOJmIrJcYs3Miy9tg/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
}

/* ================= PEOPLE MAP ================= */

let PEOPLE_MAP = {};

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;

  const people = await apiGet("people");

  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

function personName(id) {
  return PEOPLE_MAP[id] || id;
}

/* ================= FETCH ================= */

async function fetchAnnouncements() {
  document.getElementById("list").innerHTML = "Loading…";

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
      <div class="title">${a.title}</div>

      <div class="meta">
        Created: ${a.created_at} |
        Updated: ${a.updated_at}
      </div>

      <div class="meta">
        Status: <span class="badge">${a.status}</span>
        ${a.pinned ? '<span class="badge">Pinned</span>' : ""}
        ${a.by_me ? '<span class="badge">By me</span>' : ""}
      </div>

      <div class="assigned">
        <strong>Assigned:</strong>
        ${a.assigned.map(id => personName(id)).join(", ") || "-"}
      </div>

      <div class="meta">
        Comments: ${a.comments?.count || 0} |
        Attachments: ${a.attachments.length}
      </div>
    `;

    container.appendChild(div);
  });
}
