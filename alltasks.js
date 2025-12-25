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

/* ================= NORMALIZE RESPONSE ================= */

function normalizeAllTodoResponse(response) {
  // CASE 1: GAS returns array directly ✅
  if (Array.isArray(response)) {
    return {
      todos: response,
      total_count: response.length
    };
  }

  // CASE 2: { todos: [...] }
  if (Array.isArray(response.todos)) {
    return {
      todos: response.todos,
      total_count: response.total_count ?? response.todos.length
    };
  }

  // CASE 3: { data: { todos: [...] } }
  if (response.data && Array.isArray(response.data.todos)) {
    return {
      todos: response.data.todos,
      total_count: response.data.total_count ?? response.data.todos.length
    };
  }

  // Fallback (should never happen now)
  return { todos: [], total_count: 0 };
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

    console.log("RAW RESPONSE:", response);

    const { todos, total_count } =
      normalizeAllTodoResponse(response);

    console.log("NORMALIZED:", { todos, total_count });

    CURRENT_TASKS = todos;
    total = total_count;

    renderTasks(CURRENT_TASKS);
    renderPageInfo();
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td class="text-center text-muted">
          No tasks found
        </td>
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

/* ================= PAGINATION ================= */

function renderPageInfo() {
  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + limit, total);

  document.getElementById("pageInfo").textContent =
    `Showing ${from}–${to} of ${total}`;
}

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
