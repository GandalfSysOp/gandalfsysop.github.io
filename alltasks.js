const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let PEOPLE = {};
let PROJECTS = {};
let LABELS = {};          // ✅ NEW (label id → name)
let CURRENT_TASKS = [];

/* ================= API ================= */

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?path=${encodeURIComponent(
    path + (qs ? "?" + qs : "")
  )}`;

  const res = await fetch(url);
  return res.json();
}

function normalizeAllTodoResponse(res) {
  if (Array.isArray(res)) return { todos: res };
  if (res.todos) return res;
  if (res.data?.todos) return res.data;
  return { todos: [] };
}

/* ================= LOAD LOOKUPS ================= */

async function loadPeople() {
  const res = await apiGet("people");
  const data = res.data || res;
  const sel = document.getElementById("assignedFilter");

  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    sel.appendChild(opt);
  });
}

async function loadProjects() {
  const res = await apiGet("projects");
  const sel = document.getElementById("projectFilter");

  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (o.id && o.title) {
      PROJECTS[o.id] = o.title;
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.title;
      sel.appendChild(opt);
    }
    Object.values(o).forEach(walk);
  })(res.data || res);
}

async function loadLabels() {
  const res = await apiGet("labels");
  const data = res.data || res;

  data.forEach(l => {
    LABELS[l.id] = l.name;
  });
}

/* ================= FETCH ================= */

async function fetchTasks() {
  let start = Number(document.getElementById("startInput").value || 0);
  let limit = Number(document.getElementById("limitInput").value || 100);

  if (limit > 100) {
    limit = 100;
    document.getElementById("limitInput").value = 100;
  }

  const assigned = document.getElementById("assignedFilter").value;
  const includeUnassigned =
    document.getElementById("includeUnassignedFilter").value;
  const project = document.getElementById("projectFilter").value;
  const completed = document.getElementById("completedFilter").value;
  const subtasks = document.getElementById("subtaskFilter").value;

  const params = {
    start,
    limit,
    completed
  };

  if (assigned === "all_assigned") {
    params.assigned = "all_assigned";
    params.include_unassigned = false;
  }
  else if (assigned) {
    params.assigned = assigned;
    params.include_unassigned = includeUnassigned === "true";
  }
  else {
    params.include_unassigned = true;
  }

  if (project) {
    params.projects = project;
  }

  if (subtasks === "false") {
    params.include_subtasks = false;
  }

  console.log("REQUEST PARAMS →", params);

  const res = await apiGet("alltodo", params);
  const { todos } = normalizeAllTodoResponse(res);

  CURRENT_TASKS = todos;
  renderTasks();
}

/* ================= RENDER ================= */

function renderTasks() {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!CURRENT_TASKS.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  CURRENT_TASKS.forEach((t, i) => {
    const assigned =
      t.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";
    const creator =
      PEOPLE[t.creator?.id] || t.creator?.id || "—";

    tbody.innerHTML += `
      <tr>
        <td>
          <button class="btn btn-link btn-sm" onclick="toggleDetails(${i})">+</button>
        </td>
        <td>${t.id}</td>
        <td>${t.ticket}</td>
        <td>${t.title}</td>
        <td>${t.project?.name || "—"}</td>
        <td>${assigned}</td>
        <td>${creator}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.completed ? "Completed" : "Open"}</td>
        <td>${t.by_me ? "Yes" : "No"}</td>
      </tr>

      <tr id="details-${i}" class="details-row" style="display:none">
        <td colspan="11">
          ${renderDetails(t)}
        </td>
      </tr>
    `;
  });
}

function renderDetails(t) {
  const labels =
    t.labels && t.labels.length
      ? t.labels.map(id => LABELS[id] || id).join(", ")
      : "—";

  const custom =
    t.custom_fields?.map(f => `${f.title}: ${f.value || "—"}`).join("<br>") || "—";

  return `
    <div class="row g-3">
      <div class="col-md-6">
        <span class="detail-label">Description:</span>
        ${t.description || "—"}
      </div>

      <div class="col-md-3">
        <span class="detail-label">Estimated:</span>
        ${t.estimated_hours || 0}h ${t.estimated_mins || 0}m
      </div>

      <div class="col-md-3">
        <span class="detail-label">Logged:</span>
        ${t.logged_hours || 0}h ${t.logged_mins || 0}m
      </div>

      <div class="col-md-3">
        <span class="detail-label">Progress:</span>
        ${t.percent_progress || 0}%
      </div>

      <div class="col-md-3">
        <span class="detail-label">Labels:</span>
        ${labels}
      </div>

      <div class="col-md-3">
        <span class="detail-label">Attachments:</span>
        ${t.attachments?.length || 0}
      </div>

      <div class="col-md-3">
        <span class="detail-label">Parent ID:</span>
        ${t.parent_id || "—"}
      </div>

      <div class="col-md-6">
        <span class="detail-label">Created:</span>
        ${t.created_at}
      </div>

      <div class="col-md-6">
        <span class="detail-label">Updated:</span>
        ${t.updated_at}
      </div>

      <div class="col-md-12">
        <span class="detail-label">Custom Fields:</span><br>
        ${custom}
      </div>
    </div>
  `;
}

function toggleDetails(i) {
  const row = document.getElementById(`details-${i}`);
  if (!row) return;
  row.style.display =
    row.style.display === "none" ? "table-row" : "none";
}

/* ================= INIT ================= */

(async function init() {
  await loadPeople();
  await loadProjects();
  await loadLabels();   // ✅ NEW
})();
