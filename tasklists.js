const BASE_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

let PEOPLE = {};

/* ================= HELPERS ================= */

function safeJsonParse(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function apiGet(path) {
  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ================= LOAD PEOPLE ================= */

async function loadPeople() {
  const res = await apiGet("v3/people");
  const people = Array.isArray(res) ? res : res.data || [];

  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* ================= FETCH TASKLISTS ================= */

async function fetchTasklists() {
  const projectId = document.getElementById("projectId").value.trim();
  if (!projectId) {
    alert("Please enter a Project ID");
    return;
  }

  const res = await apiGet(`v3/projects/${projectId}/todolists`);
  const lists = Array.isArray(res) ? res : res.todolists || [];

  renderTasklists(lists);
}

/* ================= RENDER ================= */

function renderTasklists(lists) {
  const tbody = document.getElementById("tasklistTable");
  tbody.innerHTML = "";

  if (!lists.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="17" class="text-center muted">No tasklists found</td>
      </tr>
    `;
    return;
  }

  lists.forEach(list => {
    const assigned =
      list.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    const workflow =
      list.workflow_name ||
      list.workflow?.name ||
      (list.workflow ? `ID: ${list.workflow}` : "—");

    const customFieldsArr = safeJsonParse(list.custom_fields);

    const customFields =
      customFieldsArr.length
        ? customFieldsArr.map(cf => cf.title).join(", ")
        : "—";

    tbody.innerHTML += `
      <tr>
        <td>${list.id}</td>
        <td>${list.title}</td>
        <td>${list.private ? "Yes" : "No"}</td>
        <td>${list.archived ? "Yes" : "No"}</td>
        <td>${list.completed_count ?? "—"}</td>
        <td>${list.remaining_count ?? "—"}</td>
        <td>${workflow}</td>
        <td>${assigned}</td>
        <td>${list.show_in_gantt ? "Yes" : "No"}</td>
        <td>${list.show_in_kanban ? "Yes" : "No"}</td>
        <td>${list.time_tracking ? "Yes" : "No"}</td>
        <td>${list.by_me ? "Yes" : "No"}</td>
        <td>${list.reply_email || "—"}</td>
        <td>
          ${
            list.form_task
              ? `<a href="${list.form_task}" target="_blank">Open</a>`
              : "—"
          }
        </td>
        <td>${customFields}</td>
        <td>${list.created_at || "—"}</td>
        <td>${list.updated_at || "—"}</td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadPeople();
})();
