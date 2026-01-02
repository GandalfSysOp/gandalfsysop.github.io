const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/***********************
 * GLOBAL LOOKUPS
 ***********************/
let PEOPLE_MAP = {};
let PROJECT_MAP = {};
let NOTEBOOK_MAP = {};

/***********************
 * GENERIC API GET
 ***********************/
async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("API failed");
  return res.json();
}

/***********************
 * UTILITIES
 ***********************/
function personName(id) {
  if (!id) return "-";
  return PEOPLE_MAP[id] || `ID: ${id}`;
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleString();
}

/***********************
 * PRELOAD PEOPLE
 ***********************/
async function loadPeople() {
  const data = await apiGet("people");
  data.forEach(p => {
    PEOPLE_MAP[p.id] = p.name;
  });
}

/***********************
 * LOAD PROJECTS
 ***********************/
async function loadProjects() {
  const data = await apiGet("projects");

  const projectSelect = document.getElementById("projectSelect");
  projectSelect.innerHTML = `<option value="">Select project</option>`;

  data.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
    projectSelect.innerHTML += `
      <option value="${p.id}">${p.title}</option>
    `;
  });
}

/***********************
 * LOAD NOTEBOOKS (FIXED)
 ***********************/
async function loadNotebooks() {
  const projectId = document.getElementById("projectSelect").value;
  const notebookSelect = document.getElementById("notebookSelect");
  const notesContainer = document.getElementById("notesContainer");

  // Reset UI
  notebookSelect.innerHTML = `<option value="">Select notebook</option>`;
  notesContainer.innerHTML = "";

  if (!projectId) return;

  const res = await apiGet(`projects/${projectId}/notebooks`);

  // 🔥 CRITICAL FIX: handle both response shapes
  const notebooks = Array.isArray(res)
    ? res
    : Array.isArray(res.notebooks)
    ? res.notebooks
    : [];

  NOTEBOOK_MAP = {};

  notebooks.forEach(nb => {
    NOTEBOOK_MAP[nb.id] = nb.title;
    notebookSelect.innerHTML += `
      <option value="${nb.id}">${nb.title}</option>
    `;
  });
}

/***********************
 * FETCH NOTES
 ***********************/
async function fetchNotes() {
  const projectId = document.getElementById("projectSelect").value;
  const notebookId = document.getElementById("notebookSelect").value;

  if (!projectId || !notebookId) {
    alert("Please select project and notebook");
    return;
  }

  const res = await apiGet(
    `projects/${projectId}/notebooks/${notebookId}/notes`
  );

  const notes = Array.isArray(res)
    ? res
    : Array.isArray(res.notes)
    ? res.notes
    : [];

  renderNotes(notes);
}

/***********************
 * RENDER NOTES
 ***********************/
function renderNotes(notes) {
  const container = document.getElementById("notesContainer");

  if (!notes.length) {
    container.innerHTML =
      `<div class="text-muted">No notes found</div>`;
    return;
  }

  let html = `
    <table class="table table-sm table-bordered align-middle">
      <thead>
        <tr>
          <th>Title</th>
          <th>Color</th>
          <th>Private</th>
          <th>Creator</th>
          <th>Assigned</th>
          <th>Comments</th>
          <th>Created</th>
          <th>Updated</th>
          <th>Updated By</th>
        </tr>
      </thead>
      <tbody>
  `;

  notes.forEach(n => {
    const creator = personName(n.creator?.id);
    const updatedBy = personName(n.updated_by);
    const assigned = Array.isArray(n.assigned)
      ? n.assigned.map(personName).join(", ")
      : "-";

    html += `
      <tr>
        <td>${n.title || "-"}</td>
        <td>
          <span style="
            display:inline-block;
            width:12px;
            height:12px;
            background:${n.color || "#ccc"};
          "></span>
        </td>
        <td>${n.private ? "Yes" : "No"}</td>
        <td>${creator}</td>
        <td>${assigned}</td>
        <td>${n.comments ?? 0}</td>
        <td>${formatDate(n.created_at)}</td>
        <td>${formatDate(n.updated_at)}</td>
        <td>${updatedBy}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", async () => {
  await loadPeople();
  await loadProjects();
});
