const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

/* ---------- SAFE API ---------- */
async function apiGet(path) {
  if (!path) throw new Error("Missing API path");

  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Non-JSON response from GAS:", text);
    throw new Error(text);
  }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", loadProjects);

/* ---------- PROJECTS ---------- */
async function loadProjects() {
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = `<option value="">Select project</option>`;

  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ---------- TASKS ---------- */
async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Please select a project and enter a tasklist ID");
    return;
  }

  const path = `projects/${projectId}/todolists/${tasklistId}/tasks`;

  let response;
  try {
    response = await apiGet(path);
  } catch (err) {
    alert(err.message);
    return;
  }

  console.log("NETWORK DATA", response);

  // 🔥 This endpoint returns ARRAY
  const tasks = Array.isArray(response) ? response : [];

  renderTasks(tasks);
}

/* ---------- RENDER ---------- */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
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
