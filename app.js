const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= NORMALIZER ================= */
/* This is the KEY fix */

function normalizeProjects(json) {
  // drill until we find something iterable
  let cursor = json;

  for (let i = 0; i < 4; i++) {
    if (Array.isArray(cursor)) return cursor;

    if (cursor && typeof cursor === "object") {
      if (Array.isArray(cursor.projects)) return cursor.projects;
      if (cursor.projects && typeof cursor.projects === "object") {
        return Object.values(cursor.projects);
      }
      if (cursor.data) cursor = cursor.data;
      else break;
    }
  }

  return [];
}

/* ================= FORMATTERS ================= */

const formatDate = d => d ? new Date(d).toLocaleDateString() : "-";
const formatStatus = s => s?.id ?? "-";
const formatCategory = c => c?.id ?? "-";
const formatUser = u => u?.id ?? "-";

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return a.map(id => `<div class="assigned-id">${id}</div>`).join("");
}

/* ================= JSON OUTPUT ================= */

function setOutput(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');

  document.getElementById("output").innerHTML = json;
}

/* ================= PROJECTS ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = normalizeProjects(json);

  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  if (!projects.length) {
    table.innerHTML =
      `<tr><td colspan="13" class="text-center text-muted">No projects found</td></tr>`;
  }

  projects.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.description || "-"}</td>
      <td>${formatDate(p.start_date)}</td>
      <td>${formatDate(p.end_date)}</td>
      <td>${formatStatus(p.status)}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${formatCategory(p.category)}</td>
      <td>${formatUser(p.creator)}</td>
      <td>${formatUser(p.manager)}</td>
      <td>${p.category_name || "-"}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });

  setOutput(json);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = normalizeProjects(json);

  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.description || "-"}</td>
      <td>${formatDate(p.start_date)}</td>
      <td>${formatDate(p.end_date)}</td>
      <td>${formatStatus(p.status)}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${formatCategory(p.category)}</td>
      <td>${formatUser(p.creator)}</td>
      <td>${formatUser(p.manager)}</td>
      <td>${p.category_name || "-"}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });

  setOutput(json);
}
