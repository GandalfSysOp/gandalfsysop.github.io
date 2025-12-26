const GAS_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

let PEOPLE = {};

/* ---------- helpers ---------- */

function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

async function apiGet(path) {
  const res = await fetch(
    `${GAS_URL}?path=${encodeURIComponent(path)}`
  );
  return res.json();
}

/* ---------- preload people ---------- */

async function loadPeople() {
  const res = await apiGet("v3/people");
  const people = Array.isArray(res) ? res : res.data || [];
  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* ---------- fetch tasks ---------- */

async function fetchTasks() {
  const projectId = document.getElementById("projectId").value.trim();
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Please enter both Project ID and Tasklist ID");
    return;
  }

  const res = await apiGet(
    `v3/projects/${projectId}/todolists/${tasklistId}/tasks`
  );

  const tasks = res.todos || [];
  renderTasks(tasks);
}

/* ---------- render ---------- */

function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center muted">No tasks found</td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    const estimate =
      t.estimated_hours || t.estimated_mins
        ? `${t.estimated_hours || 0}h ${t.estimated_mins || 0}m`
        : "—";

    const logged =
      t.logged_hours || t.logged_mins
        ? `${t.logged_hours || 0}h ${t.logged_mins || 0}m`
        : "—";

    const assigned =
      t.assigned?.length ? t.assigned.join(", ") : "—";

    tbody.innerHTML += `
      <tr>
        <td><strong>${t.ticket}</strong> – ${t.title}</td>
        <td class="desc">${stripHtml(t.description)}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${t.percent_progress ?? 0}</td>
        <td>${t.sub_tasks ?? 0}</td>
        <td>${estimate}</td>
        <td>${logged}</td>
        <td>${t.project?.name || "—"}</td>
        <td>${t.list?.name || "—"}</td>
        <td>${t.workflow?.name || "—"}</td>
        <td>${t.stage?.name || "—"}</td>
        <td>${PEOPLE[t.creator?.id] || t.creator?.id || "—"}</td>
        <td>${assigned}</td>
        <td>${t.time_tracking ? "Yes" : "No"}</td>
        <td>${t.by_me ? "Yes" : "No"}</td>
        <td>${t.created_at}</td>
        <td>${t.updated_at}</td>
      </tr>
    `;
  });
}

/* ---------- init ---------- */

(async function init() {
  await loadPeople();
})();
