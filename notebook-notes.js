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

/* ================= PRELOAD ================= */

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

/* ================= PROJECTS ================= */

async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = "";

  Object.entries(PROJECT_MAP).forEach(([id, title]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = title;
    select.appendChild(opt);
  });

  await loadNotebooks();
}

async function loadNotebooks() {
  const projectId = document.getElementById("projectSelect").value;
  const select = document.getElementById("notebookSelect");
  select.innerHTML = "";

  const data = await apiGet(`projects/${projectId}/notebooks`);
  const notebooks = Array.isArray(data)
    ? data
    : data.notebooks || [];

  notebooks.forEach(nb => {
    const opt = document.createElement("option");
    opt.value = nb.id;
    opt.textContent = nb.title;
    select.appendChild(opt);
  });
}

/* ================= FETCH ================= */

async function fetchNotebookNotes() {
  const projectId = document.getElementById("projectSelect").value;
  const notebookId = document.getElementById("notebookSelect").value;

  if (!projectId || !notebookId) return;

  const data = await apiGet(
    `projects/${projectId}/notebooks/${notebookId}`
  );

  const notebooks = Array.isArray(data)
    ? data
    : data.notebooks || [];

  document.getElementById("countText").textContent =
    `Total Notebooks: ${notebooks.length}`;

  renderNotebooks(notebooks);
}

/* ================= RENDER ================= */

function renderNotebooks(notebooks) {
  const tbody = document.getElementById("notesBody");
  tbody.innerHTML = "";

  if (!notebooks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          No data found
        </td>
      </tr>`;
    return;
  }

  notebooks.forEach(nb => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="expand" onclick="toggle(${nb.id})">
        <i class="bi bi-chevron-right"></i>
      </td>
      <td>${nb.title}</td>
      <td>${nb.pinned ? "Yes" : "No"}</td>
      <td>${nb.private ? "Yes" : "No"}</td>
      <td>${nb.note_count}</td>
      <td>${nb.comments}</td>
      <td>${formatDate(nb.updated_at)}</td>
    `;
    tbody.appendChild(tr);

    const expand = document.createElement("tr");
    expand.id = `exp-${nb.id}`;
    expand.style.display = "none";
    expand.className = "expanded-row";
    expand.innerHTML = `
      <td colspan="7">
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
            <div class="label">Creator</div>
            <div class="value">${PEOPLE_MAP[nb.creator?.id] || nb.creator?.id}</div>
          </div>
          <div class="col-md-4">
            <div class="label">By Me</div>
            <div class="value">${nb.by_me}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Created</div>
            <div class="value">${formatDate(nb.created_at)}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Modified</div>
            <div class="value">${formatDate(nb.modified_at)}</div>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(expand);
  });
}

/* ================= HELPERS ================= */

function toggle(id) {
  const row = document.getElementById(`exp-${id}`);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleString();
}
