const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

const projectSelect = document.getElementById("projectSelect");
const listSelect = document.getElementById("listSelect");
const body = document.getElementById("tasksBody");
const countText = document.getElementById("countText");

/* ---------------- API ---------------- */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  return res.json();
}

/* ---------------- helpers ---------------- */

function formatDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
}

function safe(v) {
  return v === null || v === undefined || v === "" ? "-" : v;
}

function decodeHTML(html) {
  if (!html) return "-";
  const el = document.createElement("textarea");
  el.innerHTML = html;
  return el.value;
}

/* ---------------- load projects ---------------- */

document.addEventListener("DOMContentLoaded", loadProjects);

async function loadProjects() {
  const projects = await apiGet("projects");

  projectSelect.innerHTML = `<option value="">Select project</option>`;
  projects.forEach(p => {
    projectSelect.innerHTML += `
      <option value="${p.id}">${p.title}</option>
    `;
  });

  projectSelect.addEventListener("change", loadTasklists);
}

/* ---------------- load tasklists ---------------- */

async function loadTasklists() {
  const projectId = projectSelect.value;

  listSelect.disabled = true;
  listSelect.innerHTML = `<option>Loading...</option>`;

  if (!projectId) return;

  const data = await apiGet(`projects/${projectId}/todolists`);
  const lists = Array.isArray(data) ? data : data.todolists;

  listSelect.innerHTML = `<option value="">Select tasklist</option>`;

  lists.forEach(l => {
    listSelect.innerHTML += `
      <option value="${l.id}">${l.title}</option>
    `;
  });

  listSelect.disabled = false;
}

/* ---------------- expand toggle ---------------- */

function toggle(id) {
  const row = document.getElementById(`exp-${id}`);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ---------------- fetch tasks ---------------- */

async function fetchTasks() {
  body.innerHTML = "";
  countText.textContent = "";

  const projectId = projectSelect.value;
  const listId = listSelect.value;

  if (!projectId || !listId) {
    alert("Select project and tasklist");
    return;
  }

  const data = await apiGet(
    `projects/${projectId}/todolists/${listId}/tasks`
  );

  const tasks = Array.isArray(data) ? data : data.todos || [];

  countText.textContent = `Total Tasks: ${tasks.length}`;

  if (!tasks.length) {
    body.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    /* -------- main row -------- */

    body.innerHTML += `
      <tr>
        <td class="expand" onclick="toggle(${t.id})">▶</td>

        <td>${safe(t.ticket)}</td>

        <td>
          <strong>${t.title}</strong><br>
          <small class="text-muted">${safe(t.list_name)}</small>
        </td>

        <td>${safe(t.stage_name)}</td>

        <td>
          ${t.estimated_hours ?? t.estimated_hrs ?? 0}h
          ${t.estimated_mins ?? 0}m
        </td>

        <td>
          ${t.logged_hours ?? 0}h
          ${t.logged_mins ?? 0}m
        </td>

        <td>${safe(t.sub_tasks)}</td>

        <td>${safe(t.percent_progress)}%</td>

        <td>${formatDate(t.created_at)}</td>

        <td>${formatDate(t.updated_at)}</td>
      </tr>

      <!-- expanded row -->
      <tr id="exp-${t.id}" style="display:none;background:#f8fafc;">
        <td colspan="10">
          <div class="row g-3 p-3">

            <div class="col-md-3"><b>Start Date</b><br>${safe(t.start_date)}</div>
            <div class="col-md-3"><b>End Date</b><br>${safe(t.EndDate || t.due_date)}</div>
            <div class="col-md-3"><b>Completed</b><br>${safe(t.completed)}</div>
            <div class="col-md-3"><b>Archived</b><br>${safe(t.archived || t.task_archived)}</div>

            <div class="col-md-3"><b>Creator</b><br>${safe(t.creator)}</div>
            <div class="col-md-3"><b>Updated By</b><br>${safe(t.updated_by)}</div>
            <div class="col-md-3"><b>Parent ID</b><br>${safe(t.parent_id)}</div>
            <div class="col-md-3"><b>Associate Milestone</b><br>${safe(t.associate_milestone)}</div>

            <div class="col-md-6">
              <b>Assigned</b><br>
              ${Array.isArray(t.assigned) && t.assigned.length
                ? t.assigned.join(", ")
                : "-"}
            </div>

            <div class="col-md-6">
              <b>Attachments</b><br>
              ${t.attachments?.length || 0}
            </div>

            <div class="col-md-12">
              <b>Description</b>
              <div class="border rounded p-2 mt-1 bg-white">
                ${decodeHTML(t.description)}
              </div>
            </div>

            <div class="col-md-12">
              <b>Custom Fields</b>
              <pre class="bg-dark text-light p-2 rounded small">
${JSON.stringify(t.custom_fields, null, 2)}
              </pre>
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}
