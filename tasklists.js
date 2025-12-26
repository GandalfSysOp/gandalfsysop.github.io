const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

let PEOPLE = {};
let PROJECTS = {};

/* ---------- helpers ---------- */

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
  const res = await fetch(
    `${GAS_URL}?path=${encodeURIComponent(path)}`
  );
  return res.json();
}

/* ---------- preload data ---------- */

async function loadPeople() {
  const res = await apiGet("v3/people");
  const people = Array.isArray(res) ? res : res.data || [];
  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const res = await apiGet("v3/projects");
  const projects = Array.isArray(res) ? res : res.projects || [];
  projects.forEach(p => {
    PROJECTS[p.id] = p.title;
  });
}

/* ---------- fetch tasklists ---------- */

async function fetchTasklists() {
  const projectId = document.getElementById("projectId").value.trim();
  if (!projectId) {
    alert("Please enter Project ID");
    return;
  }

  const res = await apiGet(`v3/projects/${projectId}/todolists`);

  const listsRaw =
    Array.isArray(res)
      ? res
      : res.todolists || [];

  // 🔒 HARD FILTER — only this project
  const lists = listsRaw.filter(
    l => String(l.project) === String(projectId)
  );

  renderTasklists(lists);
}

/* ---------- render ---------- */

function renderTasklists(lists) {
  const tbody = document.getElementById("tasklistTable");
  tbody.innerHTML = "";

  if (!lists.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="20" class="text-center muted">No tasklists found</td>
      </tr>`;
    return;
  }

  lists.forEach(list => {
    const assigned =
      list.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    const creator = PEOPLE[list.creator] || list.creator || "—";
    const updatedBy = PEOPLE[list.updated_by] || list.updated_by || "—";

    const workflow =
      list.workflow_name ||
      list.workflow?.name ||
      (list.workflow ? `ID: ${list.workflow}` : "—");

    const customFieldsArr = safeJsonParse(list.custom_fields);
    const customFields =
      customFieldsArr.length
        ? customFieldsArr.map(cf => cf.title).join(", ")
        : "—";

    const userStagesArr = safeJsonParse(list.user_stages);
    const userStages =
      userStagesArr.length
        ? userStagesArr
            .map(u =>
              `${PEOPLE[u.id] || u.id}: ${u.stages.join(", ")}`
            )
            .join(" | ")
        : "—";

    tbody.innerHTML += `
      <tr>
        <td><strong>${list.id}</strong> – ${list.title}</td>
        <td>${PROJECTS[list.project] || list.project}</td>
        <td>${list.private ? "Yes" : "No"}</td>
        <td>${list.archived ? "Yes" : "No"}</td>
        <td>
          Completed: ${list.completed_count ?? 0}<br>
          Remaining: ${list.remaining_count ?? 0}
        </td>
        <td>${workflow}</td>
        <td>${assigned}</td>
        <td>${creator}</td>
        <td>${updatedBy}</td>
        <td>${list.by_me ? "Yes" : "No"}</td>
        <td>${list.milestone_id ?? "—"}</td>
        <td>${list.show_in_gantt ? "Yes" : "No"}</td>
        <td>${list.time_tracking ? "Yes" : "No"}</td>
        <td>${list.reply_email || "—"}</td>
        <td>${list.timesheet_id ?? "—"}</td>
        <td>${userStages}</td>
        <td>
          ${list.form_task
            ? `<a href="${list.form_task}" target="_blank">Open</a>`
            : "—"}
        </td>
        <td>${customFields}</td>
        <td>${list.created_at || "—"}</td>
        <td>${list.updated_at || "—"}</td>
      </tr>
    `;
  });
}

/* ---------- init ---------- */

(async function init() {
  await loadPeople();
  await loadProjects();
})();
