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

/* ================= DEEP FIND TODOS ================= */

/**
 * Recursively search an object to find:
 * - an array of task-like objects
 * - total_count if present
 */
function extractTodosDeep(obj) {
  let foundTodos = null;
  let foundTotal = null;

  function walk(node) {
    if (!node || typeof node !== "object") return;

    // Found todos
    if (Array.isArray(node.todos)) {
      foundTodos = node.todos;
      if (typeof node.total_count === "number") {
        foundTotal = node.total_count;
      }
    }

    Object.values(node).forEach(walk);
  }

  walk(obj);

  return {
    todos: foundTodos || [],
    total_count: foundTotal ?? (foundTodos ? foundTodos.length : 0)
  };
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

    console.log("RAW RESPONSE FROM GAS:", response);

    const extracted = extractTodosDeep(response);

    console.log("EXTRACTED TODOS:", extracted);

    CURRENT_TASKS = extracted.todos;
    total = extracted.total_count;

    renderTasks(CURRENT_TASKS);
    renderPageInfo();
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!tasks || !tasks.length) {
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
