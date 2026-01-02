const BASE_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";
/* ================= LOOKUPS ================= */

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
  const projectSelect = document.getElementById("projectSelect");

  projectSelect.innerHTML = `<option value="">Select project</option>`;

  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
    projectSelect.innerHTML +=
      `<option value="${p.id}">${p.title}</option>`;
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
  const tasklistSelect = document.getElementById("tasklistSelect");

  tasklistSelect.innerHTML = `<option value="">Select tasklist</option>`;
  if (!projectId) return;

  const lists = await apiGet(`projects/${projectId}/todolists`);

  lists.forEach(l => {
    tasklistSelect.innerHTML +=
      `<option value="${l.id}">${l.title}</option>`;
  });
}

/* ================= TASKS ================= */

async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const listId = document.getElementById("tasklistSelect").value;
  const body = document.getElementById("tasksBody");

  body.innerHTML = "";

  if (!projectId || !listId) {
    alert("Please select project and tasklist");
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
        <td style="max-width:300px">${t.title}</td>
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
          <div class="p-3 small">
            <b>Description</b><br>
            ${decodeHTML(t.description)}<br><br>

            <b>Assigned:</b> ${peopleList(t.assigned)}<br>
            <b>Creator:</b> ${person(t.creator)}<br>
            <b>Updated By:</b> ${person(t.updated_by)}<br>
            <b>Start:</b> ${t.StartDate || t.start_date}<br>
            <b>End:</b> ${t.EndDate || t.due_date}<br>
            <b>Baseline:</b> ${t.BaselineStartDate} → ${t.BaselineEndDate}<br>
            <b>Estimate:</b> ${t.estimated_hours ?? t.estimated_hrs ?? 0}h ${t.estimated_mins ?? 0}m<br>
            <b>Logged:</b> ${t.logged_hours ?? 0}h ${t.logged_mins ?? 0}m<br>
            <b>Archived:</b> ${t.archived}<br>
            <b>History:</b><br>${t.task_history || "-"}
          </div>
        </td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();

  // 🔑 THIS WAS MISSING — THE ACTUAL FIX
  document
    .getElementById("projectSelect")
    .addEventListener("change", loadTasklists);
});
