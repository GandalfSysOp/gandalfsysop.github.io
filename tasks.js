const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxzz2qn2wFZgB0q2j2rTSraDkD8sFZFDqQKv-5L0GYDdce_cKVpRhkpGOkkpBHWg55U/exec";

/* =======================
   LOOKUP CACHES
======================= */
const PEOPLE = {};
const LABELS = {};

/* =======================
   API
======================= */
async function apiGet(path) {
  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text);
    throw new Error(text);
  }
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadPeople();
  await loadLabels();
  await loadProjects();
}

/* =======================
   PEOPLE
======================= */
async function loadPeople() {
  const data = await apiGet("v3/people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* =======================
   LABELS
======================= */
async function loadLabels() {
  const data = await apiGet("v3/labels");
  data.forEach(l => {
    LABELS[l.id] = l.name;
  });
}

/* =======================
   PROJECTS
======================= */
async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;

  const projects = await apiGet("v3/projects");
  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* =======================
   FETCH TASKS
======================= */
async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Select project and enter tasklist ID");
    return;
  }

  const path = `v3/projects/${projectId}/todolists/${tasklistId}/tasks`;
  const tasks = await apiGet(path);

  document.getElementById("taskCount").innerText = tasks.length;
  renderTasks(tasks);
}

/* =======================
   RENDER TASKS
======================= */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  tasks.forEach((t, index) => {
    const creatorId = t.creator?.id || t.creator;
    const creatorName = PEOPLE[creatorId] || creatorId || "—";

    const assignedNames =
      (t.assigned || []).map(id => PEOPLE[id] || id).join(", ") || "—";

    const archived = Boolean(t.archived); // ✅ FIXED

    const rowId = `expand-${index}`;

    tbody.innerHTML += `
      <tr>
        <td>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="toggleRow('${rowId}')">+</button>
        </td>

        <td class="wrap"><strong>${t.title || "—"}</strong></td>
        <td class="wrap">${stripHtml(t.description)}</td>
        <td>${assignedNames}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.percent_progress ?? 0}%</td>
        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${creatorName}</td>
        <td>${t.created_at || "—"}</td>
      </tr>

      <tr id="${rowId}" style="display:none;background:#fafafa;">
        <td colspan="10">
          <div class="p-2">

            <div><strong>Ticket ID:</strong> ${t.ticket || "—"}</div>
            <div><strong>Archived:</strong> ${archived ? "True" : "False"}</div>
            <div><strong>Parent ID:</strong> ${t.parent_id || "—"}</div>
            <div><strong>Subtasks:</strong> ${t.sub_tasks ?? 0}</div>

            <hr/>

            <div><strong>Estimated Hours:</strong> ${t.estimated_hours ?? "—"}</div>
            <div><strong>Estimated Hrs:</strong> ${t.estimated_hrs ?? "—"}</div>
            <div><strong>Estimated Minutes:</strong> ${t.estimated_mins ?? "—"}</div>

            <div><strong>Logged Hours:</strong> ${t.logged_hours ?? "—"}</div>
            <div><strong>Logged Minutes:</strong> ${t.logged_mins ?? "—"}</div>

            <hr/>

            <div><strong>Attachments:</strong> ${(t.attachments || []).length}</div>
            <div><strong>Comments:</strong> ${t.comments ?? 0}</div>

            <div><strong>Updated At:</strong> ${t.updated_at || "—"}</div>
            <div><strong>Updated By:</strong>
              ${PEOPLE[t.updated_by] || t.updated_by || "—"}
            </div>

            <div class="mt-2">
              <strong>Custom Fields:</strong><br/>
              ${renderAllCustomFields(t)}
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

/* =======================
   HELPERS
======================= */
function toggleRow(id) {
  const row = document.getElementById(id);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

/* ✅ FIXED: handles BOTH custom_fields[] and custom_field_* */
function renderAllCustomFields(task) {
  const results = [];

  // Array-based fields
  if (Array.isArray(task.custom_fields)) {
    task.custom_fields.forEach(f => {
      results.push(`${f.title}: ${f.value ?? "—"}`);
    });
  }

  // Flattened custom_field_XXXX keys
  Object.keys(task).forEach(key => {
    if (key.startsWith("custom_field_")) {
      results.push(`${key.replace("custom_field_", "CF ")}: ${task[key] ?? "—"}`);
    }
  });

  return results.length ? results.join("<br/>") : "—";
}
