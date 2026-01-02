const BASE_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";
/* ================= LOOKUP MAPS ================= */

let PEOPLE_MAP = {};
let PROJECT_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PRELOAD ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = `<option value="">Select project</option>`;
  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ================= HELPERS ================= */

function person(id) {
  return PEOPLE_MAP[id] || id || "-";
}

function peopleList(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";
  return ids.map(id => person(id)).join(", ");
}

function decodeHTML(html) {
  if (!html) return "-";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function toggle(id) {
  const row = document.getElementById(id);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ================= TASKLIST ================= */

async function loadTasklists() {
  const projectId = document.getElementById("projectSelect").value;
  const select = document.getElementById("tasklistSelect");

  select.innerHTML = `<option value="">Select tasklist</option>`;
  if (!projectId) return;

  const lists = await apiGet(`projects/${projectId}/todolists`);
  lists.forEach(l => {
    select.innerHTML += `<option value="${l.id}">${l.title}</option>`;
  });
}

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const listId = document.getElementById("tasklistSelect").value;
  const body = document.getElementById("tasksBody");

  body.innerHTML = "";

  if (!projectId || !listId) {
    alert("Select project and tasklist");
    return;
  }

  await loadPeople();

  const res = await apiGet(
    `projects/${projectId}/todolists/${listId}/tasks`
  );

  const tasks = res.todos || res;

  document.getElementById("countText").textContent =
    `Total Tasks: ${tasks.length}`;

  if (!tasks.length) {
    body.innerHTML =
      `<tr><td colspan="10" class="text-center text-muted">No tasks found</td></tr>`;
    return;
  }

  tasks.forEach(t => {
    body.innerHTML += `
      <tr>
        <td class="expand" onclick="toggle('exp-${t.id}')">+</td>
        <td>${t.ticket}</td>
        <td style="max-width:280px;white-space:normal">${t.title}</td>
        <td>${t.stage_name || "-"}</td>
        <td>${t.percent_progress || 0}%</td>
        <td>${t.completed}</td>
        <td>${t.sub_tasks}</td>
        <td>${t.comments}</td>
        <td>${new Date(t.created_at).toLocaleDateString()}</td>
        <td>${new Date(t.updated_at).toLocaleDateString()}</td>
      </tr>

      <tr id="exp-${t.id}" style="display:none;background:#f8fafc">
        <td colspan="10">
          <div class="row g-3 p-3 small">

            <div class="col-md-3"><b>Project</b><br>${t.project_name}</div>
            <div class="col-md-3"><b>List</b><br>${t.list_name}</div>
            <div class="col-md-3"><b>Workflow</b><br>${t.workflow_name}</div>
            <div class="col-md-3"><b>Stage</b><br>${t.stage_name}</div>

            <hr>

            <div class="col-md-3"><b>Start</b><br>${t.StartDate || t.start_date}</div>
            <div class="col-md-3"><b>End</b><br>${t.EndDate || t.due_date}</div>
            <div class="col-md-3"><b>Baseline Start</b><br>${t.BaselineStartDate}</div>
            <div class="col-md-3"><b>Baseline End</b><br>${t.BaselineEndDate}</div>

            <hr>

            <div class="col-md-3"><b>Assigned</b><br>${peopleList(t.assigned)}</div>
            <div class="col-md-3"><b>Creator</b><br>${person(t.creator)}</div>
            <div class="col-md-3"><b>Updated By</b><br>${person(t.updated_by)}</div>
            <div class="col-md-3"><b>Parent ID</b><br>${t.parent_id ?? "-"}</div>

            <hr>

            <div class="col-md-3"><b>Estimated</b><br>
              ${t.estimated_hours ?? t.estimated_hrs ?? 0}h ${t.estimated_mins ?? 0}m
            </div>

            <div class="col-md-3"><b>Logged</b><br>
              ${t.logged_hours ?? 0}h ${t.logged_mins ?? 0}m
            </div>

            <div class="col-md-3"><b>Archived</b><br>${t.archived}</div>
            <div class="col-md-3"><b>Completed</b><br>${t.completed}</div>

            <hr>

            <div class="col-md-6">
              <b>Description</b>
              <div class="border rounded p-2 bg-white">
                ${decodeHTML(t.description)}
              </div>
            </div>

            <div class="col-md-6">
              <b>Task History</b>
              <div class="border rounded p-2 bg-white" style="max-height:180px;overflow:auto">
                ${t.task_history || "-"}
              </div>
            </div>

            <hr>

            <div class="col-md-6">
              <b>Custom Fields</b>
              <pre class="bg-dark text-light p-2 rounded small">
${JSON.stringify(t.custom_fields, null, 2)}
              </pre>
            </div>

            <div class="col-md-6">
              <b>Recurrence</b>
              <pre class="bg-dark text-light p-2 rounded small">
${JSON.stringify(t.rrule, null, 2)}
              </pre>
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadProjects);
