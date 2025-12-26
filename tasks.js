const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

/* ---------- API ---------- */
async function apiGet(path) {
  if (!path) throw new Error("Missing API path");

  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadProjects();
}

/* ---------- PROJECTS ---------- */
async function loadProjects() {
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = `<option value="">Select project</option>`;

  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });

  select.addEventListener("change", loadTasklists);
}

/* ---------- TASKLISTS ---------- */
async function loadTasklists() {
  const projectId = projectSelect.value;
  const select = document.getElementById("tasklistSelect");

  select.innerHTML = `<option value="">Select tasklist</option>`;
  document.getElementById("taskTable").innerHTML = "";

  if (!projectId) return;

  const res = await apiGet(`projects/${projectId}/todolists`);
  const lists = res.todolists || [];

  lists.forEach(l => {
    select.innerHTML += `<option value="${l.id}">${l.title}</option>`;
  });
}

/* ---------- TASKS ---------- */
async function fetchTasks() {
  const projectId = projectSelect.value;
  const listId = tasklistSelect.value;

  if (!projectId || !listId) {
    alert("Select project and tasklist");
    return;
  }

  const path = `projects/${projectId}/todolists/${listId}/tasks`;
  const data = await apiGet(path);

  console.log("NETWORK DATA", data);

  // 🔥 CRITICAL FIX: this endpoint returns ARRAY
  const tasks = Array.isArray(data) ? data : [];

  renderTasks(tasks);
}

/* ---------- RENDER ---------- */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="text-center text-muted">
        No tasks found
      </td></tr>`;
    return;
  }

  tasks.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td>${t.ticket || "—"}</td>
        <td>${t.title}</td>
        <td>${t.project_name || "—"}</td>
        <td>${t.list_name || "—"}</td>
        <td>${t.workflow_name || "—"}</td>
        <td>${t.stage_name || "—"}</td>
        <td>${(t.assigned || []).join(", ") || "—"}</td>
        <td>${t.completed ? "Yes" : "No"}</td>
      </tr>
    `;
  });
}
