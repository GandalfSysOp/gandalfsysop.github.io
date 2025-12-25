const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let start = 0;
let limit = 100;
let total = 0;

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(
    `${path}?start=${start}&limit=${limit}`
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= FIELD FILTER ================= */

const EXCLUDED_FIELDS = new Set([
  "baseline_start_date",
  "baseline_end_date",
  "rrule",
  "template",
  "form_task",
  "user_stages"
]);

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  const response = await apiGet("alltodo");
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
        <td class="text-center text-muted">
          No tasks found
        </td>
      </tr>
    `;
    return;
  }

  tasks.forEach(task => {
    const tr = document.createElement("tr");

    // Build ONE cell with structured fields
    let html = `<td style="white-space:normal;">`;

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
        <div style="margin-bottom:4px;">
          <strong>${key}</strong>: ${value}
        </div>
      `;
    });

    html += `</td>`;
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

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  fetchTasks();
});
