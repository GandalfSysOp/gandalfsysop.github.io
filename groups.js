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

function safe(val, fallback = "—") {
  return val === null || val === undefined ? fallback : val;
}

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
          <th>People Count</th>
          <th>Active / Suspended</th>
          <th>Created At</th>
          <th>Assigned Members</th>
          <th>Sort</th>
        </tr>
      </thead>
      <tbody>
  `;

  groups.forEach(g => {
    const peopleCount = safe(g.people_count, 0);
    const active = safe(g.active, 0);
    const suspended = safe(g.suspended, 0);
    const createdAt = safe(g.created_at);
    const sortIndex = safe(g.sort_index, 0);

    html += `
      <tr>
        <td>${g.id}</td>
        <td>${g.name}</td>
        <td>
          <span class="badge ${g.owner_group ? "yes" : "no"}">
            ${g.owner_group ? "Yes" : "No"}
          </span>
        </td>
        <td>${peopleCount}</td>
        <td>
          ${active} <span class="muted">active</span><br>
          ${suspended} <span class="muted">suspended</span>
        </td>
        <td>${createdAt}</td>
        <td class="assigned">
          ${
            Array.isArray(g.assigned) && g.assigned.length
              ? g.assigned.map(id => personName(id)).join("<br>")
              : "—"
          }
        </td>
        <td>${sortIndex}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
