const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzoLhRhFe9Y6ufl2DVFwh9mEWdRTelfD1EA7xSesXOWXsmYH9NoeXOJmIrJcYs3Miy9tg/exec";

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
  return PEOPLE_MAP[id] || id;
}

/* ================= ACTION ================= */

async function fetchGroups() {
  const container = document.getElementById("output");
  container.innerHTML = "Loading…";

  await loadPeople();

  const groups = await apiGet("groups");
  renderGroups(groups);
}

/* ================= RENDER ================= */

function renderGroups(groups) {
  const container = document.getElementById("output");

  if (!Array.isArray(groups) || !groups.length) {
    container.innerHTML = "<p>No groups found</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Owner Group</th>
          <th>People</th>
          <th>Active / Suspended</th>
          <th>Created At</th>
          <th>Assigned Members</th>
          <th>Sort</th>
        </tr>
      </thead>
      <tbody>
  `;

  groups.forEach(g => {
    html += `
      <tr>
        <td>${g.id}</td>
        <td>${g.name}</td>
        <td>
          <span class="badge ${g.owner_group ? "yes" : "no"}">
            ${g.owner_group ? "Yes" : "No"}
          </span>
        </td>
        <td>${g.people_count}</td>
        <td>
          ${g.active} <span class="muted">active</span><br>
          ${g.suspended} <span class="muted">suspended</span>
        </td>
        <td>${g.created_at || "-"}</td>
        <td class="assigned">
          ${
            g.assigned.length
              ? g.assigned.map(id => personName(id)).join("<br>")
              : "-"
          }
        </td>
        <td>${g.sort_index}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
