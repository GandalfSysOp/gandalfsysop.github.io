const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

let PEOPLE = {};

/* ================= HELPERS ================= */

function unwrap(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.todolists)) return res.todolists;
  return [];
}

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
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
  const lists = unwrap(res);

  renderTasklists(lists);
}

/* ================= RENDER ================= */

function renderTasklists(lists) {
  const tbody = document.getElementById("tasklistTable");
  tbody.innerHTML = "";

  if (!lists.length) {
    tbody.innerHTML = `<tr><td colspan="18" class="text-center">No tasklists found</td></tr>`;
    return;
  }

  lists.forEach(list => {
    const assigned =
      list.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    const workflow =
      list.workflow?.name || (list.workflow?.id ? `ID: ${list.workflow.id}` : "—");

    const milestone =
      list.milestone?.id ? list.milestone.id : "—";

    const creator =
      PEOPLE[list.creator?.id] || list.creator?.id || "—";

    const customFields = list.custom_fields?.length
      ? list.custom_fields
          .map(cf => `${cf.title} (${cf.type})`)
          .join(", ")
      : "—";

    tbody.innerHTML += `
      <tr>
        <td>${list.id}</td>
        <td>${list.title}</td>
        <td>${list.private ? "Yes" : "No"}</td>
        <td>${list.archived ? "Yes" : "No"}</td>
        <td>${list.completed_count}</td>
        <td>${list.remaining_count}</td>
        <td>${list.time_tracking ? "Yes" : "No"}</td>
        <td>${list.show_in_gantt ? "Yes" : "No"}</td>
        <td>${assigned}</td>
        <td>${workflow}</td>
        <td>${milestone}</td>
        <td>${creator}</td>
        <td>${list.reply_email || "—"}</td>
        <td>
          ${
            list.form_task
              ? `<a href="${list.form_task}" target="_blank">Open</a>`
              : "—"
          }
        </td>
        <td>${list.by_me ? "Yes" : "No"}</td>
        <td>${list.created_at}</td>
        <td>${list.updated_at}</td>
        <td>${customFields}</td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadPeople();
})();
