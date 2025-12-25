const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let PEOPLE = {};
let PROJECTS = {};
let start = 0;
let limit = 100;
let total = 0;

/* ================= API ================= */

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?path=${encodeURIComponent(
    path + (qs ? "?" + qs : "")
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOAD DROPDOWNS ================= */

async function loadPeople() {
  const response = await apiGet("people");
  const data = response.data || response;

  const select = document.getElementById("assignedFilter");

  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    select.appendChild(opt);
  });
}

async function loadProjects() {
  const response = await apiGet("projects");
  const data = response.data || response;

  const select = document.getElementById("projectFilter");

  (function walk(obj) {
    if (!obj || typeof obj !== "object") return;

    if (obj.id && obj.title) {
      PROJECTS[obj.id] = obj.title;

      const opt = document.createElement("option");
      opt.value = obj.id;
      opt.textContent = obj.title;
      select.appendChild(opt);
    }

    Object.values(obj).forEach(walk);
  })(data);
}

/* ================= FORMAT HELPERS ================= */

function assignedNames(arr) {
  if (!Array.isArray(arr) || !arr.length) return "—";
  return arr.map(id => PEOPLE[id] || id).join(", ");
}

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  const assignedSelected = [
    ...document.getElementById("assignedFilter").selectedOptions
  ].map(o => o.value);

  const projectSelected = [
    ...document.getElementById("projectFilter").selectedOptions
  ].map(o => o.value);

  const completedVal = document.getElementById("completedFilter").value;
  const includeSubVal = document.getElementById("subtaskFilter").value;
  limit = Number(document.getElementById("limitFilter").value);

  // IMPORTANT: only send params that actually filter
  const params = { start, limit };

  if (assignedSelected.length) {
    params.assigned = assignedSelected.join(",");
  }

  if (projectSelected.length) {
    params.projects = projectSelected.join(",");
  }

  if (completedVal !== "all") {
    params.completed = completedVal;
  }

  if (includeSubVal === "false") {
    params.include_subtasks = false;
  }

  // 🔑 GOOGLE APPS SCRIPT RESPONSE FIX
  const response = await apiGet("alltodo", params);
  const data = response.data || response;

  total = data.total_count || 0;
  renderTasks(data.todos || []);
  renderPageInfo();
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          No tasks found
        </td>
      </tr>
    `;
    return;
  }

  tasks.forEach(task => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${task.ticket || "—"}</td>
      <td>${task.title}</td>
      <td>${task.project?.name || "—"}</td>
      <td>${assignedNames(task.assigned)}</td>
      <td>${task.stage?.name || "—"}</td>
      <td>${task.completed ? "Yes" : "No"}</td>
      <td>${task.due_date || "—"}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderPageInfo() {
  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + limit, total);

  document.getElementById("pageInfo").textContent =
    `Showing ${from}–${to} of ${total}`;
}

/* ================= PAGINATION ================= */

function nextPage() {
  if (start + limit < total) {
    start += limit;
    fetchTasks();
  }
}

function prevPage() {
  if (start > 0) {
    start = Math.max(0, start - limit);
    fetchTasks();
  }
}

function applyFilters() {
  start = 0;
  fetchTasks();
}

/* ================= INIT ================= */

(async function init() {
  try {
    await Promise.all([loadPeople(), loadProjects()]);
    fetchTasks();
  } catch (e) {
    console.error("Initialization error:", e);
  }
})();
