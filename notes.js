const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/**************** STATE ****************/
const PEOPLE_MAP = {};
const projectSelect = document.getElementById("projectSelect");
const notebookSelect = document.getElementById("notebookSelect");

/**************** HELPERS ****************/
async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("API failed");
  return res.json();
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleString();
}

/**************** PRELOAD PEOPLE ****************/
async function loadPeople() {
  const res = await apiGet("people");
  const list = Array.isArray(res) ? res : res.people || [];
  list.forEach(p => {
    PEOPLE_MAP[p.id] = p.name;
  });
}

/**************** LOAD PROJECTS ****************/
async function loadProjects() {
  const res = await apiGet("projects");
  const projects = Array.isArray(res) ? res : res.projects || [];

  projects.forEach(p => {
    projectSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${p.id}">${p.title}</option>`
    );
  });
}

/**************** LOAD NOTEBOOKS ****************/
async function loadNotebooks(projectId) {
  notebookSelect.innerHTML =
    `<option value="">Select notebook</option>`;
  notebookSelect.disabled = true;

  if (!projectId) return;

  const res = await apiGet(`projects/${projectId}/notebooks`);

  // 🔴 API RETURNS ARRAY
  const notebooks = Array.isArray(res)
    ? res
    : res.notebooks || [];

  notebooks.forEach(n => {
    notebookSelect.insertAdjacentHTML(
      "beforeend",
      `<option value="${n.id}">${n.title}</option>`
    );
  });

  notebookSelect.disabled = false;
}

/**************** FETCH NOTES ****************/
async function fetchNotes() {
  const projectId = projectSelect.value;
  const notebookId = notebookSelect.value;
  const container = document.getElementById("notesContainer");

  container.innerHTML = "";

  if (!projectId || !notebookId) return;

  const res = await apiGet(
    `projects/${projectId}/notebooks/${notebookId}/notes`
  );

  // 🔴 API RETURNS ARRAY
  const notes = Array.isArray(res)
    ? res
    : res.notes || [];

  if (!notes.length) {
    container.innerHTML =
      `<div class="text-muted small">No notes found</div>`;
    return;
  }

  renderNotes(notes);
}

/**************** RENDER ****************/
function renderNotes(notes) {
  const container = document.getElementById("notesContainer");

  notes.forEach(n => {
    const creator =
      PEOPLE_MAP[n.creator?.id] || n.creator?.id || "-";

    const updatedBy =
      PEOPLE_MAP[n.updated_by] || n.updated_by || "-";

    const assigned =
      Array.isArray(n.assigned)
        ? n.assigned.map(id => PEOPLE_MAP[id] || id).join(", ")
        : "-";

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between">
          <strong>${n.title}</strong>
          <span class="badge bg-secondary">
            ${n.private ? "Private" : "Public"}
          </span>
        </div>

        <div class="card-body small">
          <div class="mb-2">
            <span class="badge" style="background:${n.color || "#6c757d"}">
              Color
            </span>
          </div>

          <div><b>Creator:</b> ${creator}</div>
          <div><b>Updated By:</b> ${updatedBy}</div>
          <div><b>Assigned:</b> ${assigned}</div>
          <div><b>Comments:</b> ${n.comments}</div>
          <div><b>Created:</b> ${formatDate(n.created_at)}</div>
          <div><b>Updated:</b> ${formatDate(n.updated_at)}</div>

          <hr>
          <div>${n.preview || "<i>No preview</i>"}</div>
        </div>
      </div>
      `
    );
  });
}

/**************** EVENTS ****************/
projectSelect.addEventListener("change", e => {
  loadNotebooks(e.target.value);
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadPeople();
  await loadProjects();
});
