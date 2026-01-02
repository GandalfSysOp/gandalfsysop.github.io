const GAS_URL = "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

const projectSelect = document.getElementById("projectSelect");
const listSelect = document.getElementById("listSelect");
const body = document.getElementById("tasksBody");
const countText = document.getElementById("countText");

/* ---------------- helpers ---------------- */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  return res.json();
}

function formatDate(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
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
      <option value="${l.id}">
        ${l.title}
      </option>
    `;
  });

  listSelect.disabled = false;
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

  // ✅ SUPPORT BOTH RESPONSE SHAPES
  const tasks = Array.isArray(data)
    ? data
    : data.todos || [];

  countText.textContent = `Total Tasks: ${tasks.length}`;

  if (!tasks.length) {
    body.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    body.innerHTML += `
      <tr>
        <td>${t.ticket || "-"}</td>

        <td>
          <strong>${t.title}</strong><br>
          <small class="text-muted">
            ${t.list_name || ""}
          </small>
        </td>

        <td>${t.stage_name || "-"}</td>

        <td>
          ${t.estimated_hours ?? t.estimated_hrs ?? 0}h
          ${t.estimated_mins ?? 0}m
        </td>

        <td>
          ${t.logged_hours ?? 0}h
          ${t.logged_mins ?? 0}m
        </td>

        <td>${t.sub_tasks ?? 0}</td>

        <td>${t.percent_progress ?? 0}%</td>

        <td>${formatDate(t.created_at)}</td>

        <td>${formatDate(t.updated_at)}</td>
      </tr>
    `;
  });
}
