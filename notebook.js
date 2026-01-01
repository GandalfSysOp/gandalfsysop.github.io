const API_BASE = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

let peopleMap = {};
let projectMap = {};
let notebooksCache = {};

document.addEventListener("DOMContentLoaded", async () => {
  await preloadLookups();
  await loadProjects();
});

async function apiGet(path) {
  const res = await fetch(`${API_BASE}?path=${encodeURIComponent(path)}`);
  return res.json();
}

/* ---------- preload people & projects ---------- */
async function preloadLookups() {
  const people = await apiGet("people");
  people.forEach(p => {
    peopleMap[p.id] = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  });

  const projects = await apiGet("projects");
  projects.forEach(p => {
    projectMap[p.id] = p.title;
  });
}

/* ---------- load projects ---------- */
async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = "";

  Object.entries(projectMap).forEach(([id, name]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

/* ---------- fetch notebooks ---------- */
async function fetchNotebooks() {
  const projectId = document.getElementById("projectSelect").value;
  const data = await apiGet(`projects/${projectId}/notebooks`);

  const notebooks = data.notebooks || [];
  notebooksCache = {};

  notebooks.forEach(n => notebooksCache[n.id] = n);

  document.getElementById("countText").textContent =
    `Total Notebooks: ${notebooks.length}`;

  renderNotebooks(notebooks);
}

/* ---------- render table ---------- */
function renderNotebooks(list) {
  const tbody = document.getElementById("notebooksBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML =
      `<tr><td colspan="8" class="text-center text-muted">No notebooks found</td></tr>`;
    return;
  }

  list.forEach(nb => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="expand" onclick="toggleNotebook(${nb.id})">
        <i class="bi bi-chevron-right"></i>
      </td>
      <td>${nb.title}</td>
      <td>${nb.private ? "Yes" : "No"}</td>
      <td>${nb.pinned ? "Yes" : "No"}</td>
      <td>${nb.note_count}</td>
      <td>${nb.comments}</td>
      <td>${peopleMap[nb.creator?.id] || nb.creator?.id}</td>
      <td>${formatDate(nb.updated_at)}</td>
    `;
    tbody.appendChild(tr);

    const expand = document.createElement("tr");
    expand.id = `nb-${nb.id}`;
    expand.style.display = "none";
    expand.className = "expanded-row";
    expand.innerHTML = `
      <td colspan="8">
        <div class="row g-2">
          <div class="col-md-4"><span class="label">Notebook ID</span><div class="value">${nb.id}</div></div>
          <div class="col-md-4"><span class="label">Project</span><div class="value">${projectMap[nb.project.id]}</div></div>
          <div class="col-md-4"><span class="label">By Me</span><div class="value">${nb.by_me}</div></div>
          <div class="col-md-4"><span class="label">Modified At</span><div class="value">${formatDate(nb.modified_at)}</div></div>
          <div class="col-md-8"><span class="label">Description</span><div class="value">${nb.description || "-"}</div></div>
        </div>
      </td>
    `;
    tbody.appendChild(expand);
  });
}

/* ---------- toggle expand ---------- */
function toggleNotebook(id) {
  const row = document.getElementById(`nb-${id}`);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ---------- helpers ---------- */
function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt) ? "-" : dt.toLocaleString();
}
