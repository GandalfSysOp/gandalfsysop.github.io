/***********************
 * CONFIG
 ***********************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";
/* ================= LOOKUPS ================= */

let PEOPLE_MAP = {};
let PROJECT_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PRELOAD ================= */

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

  const notebooks = Array.isArray(res)
    ? res
    : Array.isArray(res.notebooks)
    ? res.notebooks
    : [];

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
  const projectId = document.getElementById("projectSelect")?.value;
  const notebookId = document.getElementById("notebookSelect")?.value;

  const body =
    document.getElementById("notesBody") ||
    document.getElementById("notesContainer");

  const count =
    document.getElementById("countText") ||
    document.getElementById("notesCount");

  if (!body) {
    console.error("❌ Notes container not found in HTML");
    alert("Notes container missing in HTML");
    return;
  }

  body.innerHTML = "";
  if (count) count.textContent = "";

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

  if (count) count.textContent = `Total Notes: ${notes.length}`;

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
      <td colspan="7">
        <div class="card mb-3 shadow-sm">
          <div class="card-body">

            <!-- Title -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">
                📝 ${n.title || "Untitled Note"}
              </h6>
              <span
                style="
                  width:14px;
                  height:14px;
                  border-radius:50%;
                  background:${n.color || "#ccc"};
                  display:inline-block;
                "
                title="Color"
              ></span>
            </div>

            <!-- Meta -->
            <div class="text-muted small mb-2">
              <strong>Private:</strong> ${n.private ? "Yes" : "No"} &nbsp;|&nbsp;
              <strong>Comments:</strong> ${n.comments ?? 0}
            </div>

            <!-- People -->
            <div class="mb-2">
              <div><strong>Creator:</strong> ${personName(n.creator?.id)}</div>
              <div><strong>Assigned:</strong> ${listPeople(n.assigned)}</div>
            </div>

            <!-- Dates -->
            <div class="mb-2 small text-muted">
              <div><strong>Created:</strong> ${formatDate(n.created_at)}</div>
              <div><strong>Updated:</strong> ${formatDate(n.updated_at)}</div>
            </div>

            <!-- Preview -->
            ${
              n.preview
                ? `
                <div class="mt-3">
                  <strong>Preview:</strong>
                  <div class="border rounded p-2 bg-light mt-1"
                       style="white-space:pre-wrap">
                    ${n.preview}
                  </div>
                </div>
              `
                : ""
            }

          </div>
        </div>
      </td>
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
    ?.addEventListener("change", loadNotebooks);
});
