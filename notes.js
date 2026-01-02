const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= LOOKUPS ================= */

let PEOPLE_MAP = {};
let PROJECT_MAP = {};
let NOTEBOOK_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadPeople();
  await loadProjects();
});

/* ================= LOADERS ================= */

async function loadPeople() {
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.title;
    select.appendChild(opt);
  });

  select.addEventListener("change", loadNotebooks);
}

async function loadNotebooks() {
  const projectId = projectSelect.value;
  const notebookSelect = document.getElementById("notebookSelect");

  notebookSelect.innerHTML =
    `<option value="">Select notebook</option>`;
  notebookSelect.disabled = true;

  if (!projectId) return;

  const res = await apiGet(`projects/${projectId}/notebooks`);

  // 🔧 FIX: API returns ARRAY, not object
  const notebooks = Array.isArray(res)
    ? res
    : res.notebooks || [];

  notebooks.forEach(n => {
    NOTEBOOK_MAP[n.id] = n.title;

    const opt = document.createElement("option");
    opt.value = n.id;
    opt.textContent = n.title;
    notebookSelect.appendChild(opt);
  });

  notebookSelect.disabled = false;
}

/* ================= ACTION ================= */

async function fetchNotes() {
  const projectId = projectSelect.value;
  const notebookId = notebookSelect.value;

  if (!projectId || !notebookId) {
    alert("Please select project and notebook");
    return;
  }

  const res = await apiGet(
    `projects/${projectId}/notebooks/${notebookId}/notes`
  );

  const notes = res.notes || [];
  document.getElementById("countText").textContent =
    `Total Notes: ${notes.length}`;

  renderNotes(notes);
}

/* ================= RENDER ================= */

function renderNotes(notes) {
  const tbody = document.getElementById("notesBody");
  tbody.innerHTML = "";

  if (!notes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted">
          No notes found
        </td>
      </tr>`;
    return;
  }

  notes.forEach(n => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${n.title}</strong></td>

      <td>
        <span class="badge-color" style="background:${n.color || "#ccc"}"></span>
        ${n.color || "-"}
      </td>

      <td>${n.private ? "Yes" : "No"}</td>

      <td>${formatPeople(n.assigned)}</td>

      <td>${PEOPLE_MAP[n.creator?.id] || n.creator?.id || "-"}</td>

      <td>${PEOPLE_MAP[n.updated_by] || n.updated_by || "-"}</td>

      <td>${n.comments || 0}</td>

      <td><div class="preview">${escapeHtml(n.preview || "")}</div></td>

      <td>${formatDate(n.updated_at)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ================= HELPERS ================= */

function formatPeople(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";
  return ids.map(id => PEOPLE_MAP[id] || id).join(", ");
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
