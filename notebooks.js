const API_BASE = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

let PEOPLE_MAP = {};
let PROJECT_MAP = {};

document.addEventListener("DOMContentLoaded", async () => {
  await preloadLookups();
  await loadProjects();
});

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${API_BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PRELOAD LOOKUPS ================= */

async function preloadLookups() {
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] =
      `${p.first_name || ""} ${p.last_name || ""}`.trim() || `ID ${p.id}`;
  });

  const projects = await apiGet("projects");
  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
  });
}

/* ================= LOAD PROJECTS ================= */

async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = "";

  Object.entries(PROJECT_MAP).forEach(([id, title]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = title;
    select.appendChild(opt);
  });
}

/* ================= FETCH NOTEBOOKS ================= */

async function fetchNotebooks() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  const data = await apiGet(`projects/${projectId}/notebooks`);

  // 🔥 FIX: API sometimes returns ARRAY directly
  const notebooks = Array.isArray(data)
    ? data
    : data.notebooks || [];

  document.getElementById("countText").textContent =
    `Total Notebooks: ${notebooks.length}`;

  renderNotebooks(notebooks);
}

/* ================= RENDER ================= */

function renderNotebooks(notebooks) {
  const tbody = document.getElementById("notebooksBody");
  tbody.innerHTML = "";

  if (!notebooks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">
          No notebooks found
        </td>
      </tr>`;
    return;
  }

  notebooks.forEach(nb => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="expand" onclick="toggleNotebook(${nb.id})">
        <i class="bi bi-chevron-right"></i>
      </td>
      <td>${nb.title || "-"}</td>
      <td>${nb.private ? "Yes" : "No"}</td>
      <td>${nb.pinned ? "Yes" : "No"}</td>
      <td>${nb.note_count ?? "-"}</td>
      <td>${nb.comments ?? "-"}</td>
      <td>${PEOPLE_MAP[nb.creator?.id] || nb.creator?.id || "-"}</td>
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
          <div class="col-md-4">
            <div class="label">Notebook ID</div>
            <div class="value">${nb.id}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Project</div>
            <div class="value">${PROJECT_MAP[nb.project?.id] || nb.project?.id}</div>
          </div>
          <div class="col-md-4">
            <div class="label">By Me</div>
            <div class="value">${nb.by_me}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Created At</div>
            <div class="value">${formatDate(nb.created_at)}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Updated At</div>
            <div class="value">${formatDate(nb.updated_at)}</div>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(expand);
  });
}

/* ================= TOGGLE ================= */

function toggleNotebook(id) {
  const row = document.getElementById(`nb-${id}`);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ================= HELPERS ================= */

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleString();
}
