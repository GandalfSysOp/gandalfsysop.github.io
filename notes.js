/***********************
 * CONFIG
 ***********************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= LOOKUP MAPS ================= */

let PEOPLE_MAP = {};
let PROJECT_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PRELOAD LOOKUPS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  });
}

async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;

  const projects = await apiGet("projects");
  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ================= HELPERS ================= */

function personName(id) {
  return PEOPLE_MAP[id] || `User ${id}`;
}

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d) ? "-" : d.toLocaleString();
}

function listPeople(arr) {
  if (!Array.isArray(arr) || !arr.length) return "-";
  return arr.map(personName).join(", ");
}

/* ================= NOTEBOOKS ================= */

async function loadNotebooks() {
  const projectId = document.getElementById("projectSelect").value;
  const notebookSelect = document.getElementById("notebookSelect");

  notebookSelect.innerHTML = `<option value="">Select notebook</option>`;
  notebookSelect.disabled = true;

  if (!projectId) return;

  const res = await apiGet(`projects/${projectId}/notebooks`);

  // ✅ FIX: normalize response
  const notebooks = Array.isArray(res)
    ? res
    : Array.isArray(res.notebooks)
    ? res.notebooks
    : [];

  if (!notebooks.length) return;

  notebooks.forEach(nb => {
    notebookSelect.innerHTML += `
      <option value="${nb.id}">
        ${nb.title || "Untitled Notebook"}
      </option>
    `;
  });

  notebookSelect.disabled = false;
}

/* ================= NOTES ================= */

async function fetchNotes() {
  const projectId = document.getElementById("projectSelect").value;
  const notebookId = document.getElementById("notebookSelect").value;
  const body = document.getElementById("notesBody");
  const count = document.getElementById("countText");

  body.innerHTML = "";
  count.textContent = "";

  if (!projectId || !notebookId) {
    alert("Select both project and notebook");
    return;
  }

  const res = await apiGet(
    `projects/${projectId}/notebooks/${notebookId}/notes`
  );

  const notes = Array.isArray(res.notes)
    ? res.notes
    : Array.isArray(res)
    ? res
    : [];

  count.textContent = `Total Notes: ${notes.length}`;

  if (!notes.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          No notes found
        </td>
      </tr>`;
    return;
  }

  notes.forEach(n => {
    body.innerHTML += `
      <tr>
        <td><strong>${n.title}</strong></td>
        <td>${n.private ? "Yes" : "No"}</td>
        <td>${listPeople(n.assigned)}</td>
        <td>${personName(n.creator?.id)}</td>
        <td>${formatDate(n.created_at)}</td>
        <td>${formatDate(n.updated_at)}</td>
        <td>${n.comments ?? 0}</td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadPeople();
  await loadProjects();

  document
    .getElementById("projectSelect")
    .addEventListener("change", loadNotebooks);
});
