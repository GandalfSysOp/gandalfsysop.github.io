const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

const PEOPLE = {};
const LABELS = {};

/* ---------- API ---------- */
async function apiGet(path) {
  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  const text = await res.text();
  return JSON.parse(text);
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadPeople();
  await loadLabels();
  await loadProjects();
}

/* ---------- LOOKUPS ---------- */
async function loadPeople() {
  const data = await apiGet("v3/people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadLabels() {
  const data = await apiGet("v3/labels");
  data.forEach(l => {
    LABELS[l.id] = l.name;
  });
}

async function loadProjects() {
  const projects = await apiGet("v3/projects");
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;
  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ---------- TASKS ---------- */
async function fetchTasks() {
  const projectId = projectSelect.value;
  const tasklistId = tasklistIdInput.value.trim();

  if (!projectId || !tasklistId) {
    alert("Select project and enter tasklist ID");
    return;
  }

  const tasks = await apiGet(
    `v3/projects/${projectId}/todolists/${tasklistId}/tasks`
  );

  document.getElementById("taskCount").innerText = tasks.length;
  renderTasks(tasks);
}

/* ---------- RENDER ---------- */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  tasks.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td>${t.ticket || "—"}</td>

        <td class="wrap"><strong>${t.title}</strong></td>

        <td class="wrap">${stripHtml(t.description)}</td>

        <td>${(t.assigned || []).map(id => PEOPLE[id] || id).join(", ") || "—"}</td>

        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>

        <td>${t.percent_progress ?? 0}%</td>
        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${t.task_archived ? "Yes" : "No"}</td>

        <td>${formatEst(t)}</td>
        <td>${formatLogged(t)}</td>

        <td>${(t.attachments || []).length}</td>
        <td>${t.comments ?? 0}</td>

        <td>${(t.labels || []).map(id => LABELS[id] || id).join(", ") || "—"}</td>

        <td>${formatCustom(t.custom_fields)}</td>

        <td>${PEOPLE[t.creator?.id] || t.creator?.id || "—"}</td>
        <td>${t.created_at || "—"}</td>
        <td>${t.updated_at || "—"}</td>
        <td>${PEOPLE[t.updated_by] || t.updated_by || "—"}</td>

        <td>${t.parent_id || "—"}</td>
        <td>${t.sub_tasks ?? 0}</td>
      </tr>
    `;
  });
}

/* ---------- HELPERS ---------- */
function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatEst(t) {
  return [
    t.estimated_hours,
    t.estimated_hrs,
    t.estimated_mins
  ].filter(v => v !== null && v !== undefined).join(" / ") || "—";
}

function formatLogged(t) {
  return [
    t.logged_hours,
    t.logged_mins
  ].filter(v => v !== null && v !== undefined).join(" / ") || "—";
}

function formatCustom(fields) {
  if (!Array.isArray(fields) || !fields.length) return "—";
  return fields.map(f => f.title).join(", ");
}
