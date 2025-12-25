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
  const url = `${BASE_URL}?path=${encodeURIComponent(path + (qs ? "?" + qs : ""))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOAD DROPDOWNS ================= */

async function loadPeople() {
  const people = await apiGet("people");
  const sel = document.getElementById("assignedFilter");

  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`;
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = PEOPLE[p.id];
    sel.appendChild(o);
  });
}

async function loadProjects() {
  const raw = await apiGet("projects");
  const sel = document.getElementById("projectFilter");

  (function walk(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.id && obj.title) {
      PROJECTS[obj.id] = obj.title;
      const o = document.createElement("option");
      o.value = obj.id;
      o.textContent = obj.title;
      sel.appendChild(o);
    }
    Object.values(obj).forEach(walk);
  })(raw);
}

/* ================= FORMAT ================= */

function assignedNames(arr) {
  if (!Array.isArray(arr) || !arr.length) return "—";
  return arr.map(id => PEOPLE[id] || id).join(", ");
}

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  const assigned = [...document.getElementById("assignedFilter").selectedOptions].map(o => o.value);
  const projects = [...document.getElementById("projectFilter").selectedOptions].map(o => o.value);
  const completed = document.getElementById("completedFilter").value;
  const includeSub = document.getElementById("subtaskFilter").value;
  limit = Number(document.getElementById("limitFilter").value);

  const params = { start, limit };

  if (assigned.length) params.assigned = assigned.join(",");
  if (projects.length) params.projects = projects.join(",");
  if (completed !== "all") params.completed = completed;
  if (includeSub === "false") params.include_subtasks = false;

  const data = await apiGet("alltodo", params);

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
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.ticket || "—"}</td>
      <td>${t.title}</td>
      <td>${t.project?.name || "—"}</td>
      <td>${assignedNames(t.assigned)}</td>
      <td>${t.stage?.name || "—"}</td>
      <td>${t.completed ? "Yes" : "No"}</td>
      <td>${t.due_date || "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPageInfo() {
  const from = start + 1;
  const to = Math.min(start + limit, total);
  document.getElementById("pageInfo").textContent =
    `Showing ${from}-${to} of ${total}`;
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
  await Promise.all([loadPeople(), loadProjects()]);
  fetchTasks();
})();
