const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let start = 0;
let limit = 100;
let total = 0;

let PEOPLE = {};
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

/* ================= NORMALIZE ================= */

function normalizeAllTodoResponse(res) {
  if (Array.isArray(res)) return { todos: res, total_count: res.length };
  if (res.todos) return res;
  if (res.data?.todos) return res.data;
  return { todos: [], total_count: 0 };
}

/* ================= LOAD PEOPLE ================= */

async function loadPeople() {
  const res = await apiGet("people");
  const people = res.data || res;

  const sel = document.getElementById("assignedFilter");
  sel.innerHTML = `<option value="">All</option>`;

  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    sel.appendChild(opt);
  });
}

/* ================= FETCH TASKS ================= */

async function fetchTasks(extraParams = {}) {
  await loadPeople();

  const params = {
    start,
    limit,
    ...extraParams
  };

  const res = await apiGet("alltodo", params);
  const { todos, total_count } = normalizeAllTodoResponse(res);

  CURRENT_TASKS = todos;
  total = total_count;

  renderTasks();
  renderPageInfo();
}

/* ================= FILTERS ================= */

function applyFilters() {
  const assigned = document.getElementById("assignedFilter").value;
  const completed = document.getElementById("completedFilter").value;

  const params = {};
  if (assigned) params.assigned = assigned;
  if (completed) params.completed = completed;

  start = 0;
  fetchTasks(params);
}

/* ================= RENDER ================= */

function renderTasks() {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!CURRENT_TASKS.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">No tasks found</td>
      </tr>`;
    return;
  }

  CURRENT_TASKS.forEach((t, i) => {
    const assigned =
      t.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";
    const creator = PEOPLE[t.creator?.id] || t.creator?.id || "—";

    tbody.innerHTML += `
      <tr>
        <td>
          <button class="btn btn-sm btn-link" onclick="toggleDetails(${i})">+</button>
        </td>
        <td>${t.ticket}</td>
        <td>${t.title}</td>
        <td>${t.project?.name || "—"}</td>
        <td>${assigned}</td>
        <td>${creator}</td>
        <td>${t.completed ? "Completed" : "Open"}</td>
        <td>${t.due_date || "—"}</td>
      </tr>

      <tr id="details-${i}" class="details-row" style="display:none">
        <td colspan="8">
          ${renderDetails(t)}
        </td>
      </tr>
    `;
  });
}

function renderDetails(t) {
  return `
    <div class="row g-3">
      <div class="col-md-4"><span class="detail-label">Description:</span> ${t.description || "—"}</div>
      <div class="col-md-4"><span class="detail-label">Start Date:</span> ${t.start_date || "—"}</div>
      <div class="col-md-4"><span class="detail-label">Parent ID:</span> ${t.parent_id || "—"}</div>

      <div class="col-md-4"><span class="detail-label">Estimated:</span> ${t.estimated_hours || 0}h ${t.estimated_mins || 0}m</div>
      <div class="col-md-4"><span class="detail-label">Logged:</span> ${t.logged_hours || 0}h ${t.logged_mins || 0}m</div>
      <div class="col-md-4"><span class="detail-label">Progress:</span> ${t.percent_progress || 0}%</div>

      <div class="col-md-4"><span class="detail-label">Labels:</span> ${t.labels?.join(", ") || "—"}</div>
      <div class="col-md-4"><span class="detail-label">Attachments:</span> ${t.attachments?.length || 0}</div>
      <div class="col-md-4"><span class="detail-label">By Me:</span> ${t.by_me ? "Yes" : "No"}</div>

      <div class="col-md-6"><span class="detail-label">Created:</span> ${t.created_at}</div>
      <div class="col-md-6"><span class="detail-label">Updated:</span> ${t.updated_at}</div>

      <div class="col-md-12">
        <span class="detail-label">Custom Fields:</span>
        <pre class="mb-0">${JSON.stringify(t.custom_fields || [], null, 2)}</pre>
      </div>
    </div>
  `;
}

function toggleDetails(i) {
  const row = document.getElementById(`details-${i}`);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ================= PAGINATION ================= */

function renderPageInfo() {
  const from = total ? start + 1 : 0;
  const to = Math.min(start + limit, total);
  document.getElementById("pageInfo").textContent =
    `Showing ${from}–${to} of ${total}`;
}

function nextPage() {
  start += limit;
  fetchTasks();
}

function prevPage() {
  start = Math.max(0, start - limit);
  fetchTasks();
}
