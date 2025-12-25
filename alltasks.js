const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let PEOPLE_MAP = {};
let PROJECT_MAP = {};
let start = 0;
let limit = 100;
let totalCount = 0;

/* ================= API ================= */

async function apiGet(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?path=${encodeURIComponent(path + (query ? "?" + query : ""))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOAD LOOKUPS ================= */

async function loadPeople() {
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });

  const select = document.getElementById("assignedFilter");
  people.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE_MAP[p.id];
    select.appendChild(opt);
  });
}

async function loadProjects() {
  const data = await apiGet("projects");
  const projects = [];

  (function walk(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.id && obj.title) projects.push(obj);
    Object.values(obj).forEach(walk);
  })(data);

  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
  });

  const select = document.getElementById("projectFilter");
  projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.title;
    select.appendChild(opt);
  });
}

/* ================= FORMAT ================= */

const nameOf = id => PEOPLE_MAP[id] || id;

function formatAssigned(arr) {
  if (!Array.isArray(arr) || !arr.length) return "—";
  return arr.map(nameOf).join(", ");
}

function formatJsonPretty(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
}

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  const assigned = [...document.getElementById("assignedFilter").selectedOptions].map(o => o.value);
  const projects = [...document.getElementById("projectFilter").selectedOptions].map(o => o.value);

  const completed = document.getElementById("completedFilter").value;
  const includeSub = document.getElementById("subtaskFilter").value;
  limit = Number(document.getElementById("limitFilter").value);

  const params = {
    start,
    limit,
    include_unassigned: true,
    include_subtasks: includeSub,
    completed
  };

  if (assigned.length) params.assigned = assigned.join(",");
  else params.assigned = "all_assigned";

  if (projects.length) params.projects = projects.join(",");

  const json = await apiGet("alltodo", params);

  totalCount = json.total_count || 0;
  renderTasks(json.todos || []);
  renderPageInfo();
  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(json)}</pre>`;
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  tasks.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.ticket || "—"}</td>
      <td>${t.title}</td>
      <td>${t.project?.name || "—"}</td>
      <td>${formatAssigned(t.assigned)}</td>
      <td>${t.stage?.name || "—"}</td>
      <td>${t.completed ? "Yes" : "No"}</td>
      <td>${t.due_date || "—"}</td>
    `;
    tr.onclick = () => {
      document.getElementById("output").innerHTML =
        `<pre style="line-height:1.6">${formatJsonPretty(t)}</pre>`;
    };
    tbody.appendChild(tr);
  });
}

function renderPageInfo() {
  const from = start + 1;
  const to = Math.min(start + limit, totalCount);
  document.getElementById("pageInfo").textContent =
    `Showing ${from}–${to} of ${totalCount}`;
}

/* ================= PAGINATION ================= */

function nextPage() {
  if (start + limit < totalCount) {
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
