const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let start = 0;
let limit = 100;
let total = 0;
let CURRENT_TASKS = [];

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(
    `${path}?start=${start}&limit=${limit}`
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= SAFE UNWRAP ================= */

function unwrapTodos(response) {
  let obj = response;

  // Drill down until we find `todos`
  while (obj && typeof obj === "object") {
    if (Array.isArray(obj.todos)) {
      return obj;
    }
    if (obj.data) {
      obj = obj.data;
    } else {
      break;
    }
  }

  return { total_count: 0, todos: [] };
}

/* ================= EXCLUDED FIELDS ================= */

const EXCLUDED_FIELDS = new Set([
  "baseline_start_date",
  "baseline_end_date",
  "rrule",
  "template",
  "form_task",
  "user_stages"
]);

/* ================= FETCH ================= */

async function fetchTasks() {
  try {
    const response = await apiGet("alltodo");

    // 🔑 THIS IS THE CRITICAL LINE
    const data = unwrapTodos(response);

    console.log("UNWRAPPED DATA:", data); // keep this for now

    CURRENT_TASKS = data.todos;
    total = data.total_count || data.todos.length;

    applyClientFilters();
    renderPageInfo();
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

/* ================= CLIENT-SIDE FILTERING ================= */

function applyClientFilters() {
  renderTasks(CURRENT_TASKS);
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!tasks || !tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td class="text-center text-muted">No tasks found</td>
      </tr>
    `;
    return;
  }

  tasks.forEach(task => {
    let html = `<td>`;

    Object.keys(task).forEach(key => {
      if (EXCLUDED_FIELDS.has(key)) return;

      let value = task[key];

      if (value === null || value === undefined) {
        value = "-";
      } else if (Array.isArray(value)) {
        value = value.length ? JSON.stringify(value) : "[]";
      } else if (typeof value === "object") {
        value = JSON.stringify(value);
      }

      html += `
        <div style="margin-bottom:4px">
          <strong>${key}</strong>: ${value}
        </div>
      `;
    });

    html += `</td>`;

    const tr = document.createElement("tr");
    tr.innerHTML = html;
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
