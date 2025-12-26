const BASE_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

/* ================= STATE ================= */

let PEOPLE = {};
let ALL_ITEMS = [];

/* ================= HELPERS ================= */

function unwrapArray(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ================= LOAD PEOPLE ================= */

async function loadPeople() {
  const res = await apiGet("v3/people");
  const people = unwrapArray(res);

  const select = document.getElementById("assignedFilter");

  people.forEach(p => {
    const name = `${p.first_name} ${p.last_name}`.trim();
    PEOPLE[p.id] = name || p.id;

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = name || p.id;
    select.appendChild(opt);
  });
}

/* ================= FETCH ================= */

async function fetchCalendar() {
  const res = await apiGet("v3/allcalendars");
  ALL_ITEMS = unwrapArray(res);
  applyFilters();
}

/* ================= FILTERS ================= */

function applyFilters() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const assigned = document.getElementById("assignedFilter").value;

  let filtered = [...ALL_ITEMS];

  if (from) {
    filtered = filtered.filter(i => i.start?.slice(0, 10) >= from);
  }

  if (to) {
    filtered = filtered.filter(i => i.end?.slice(0, 10) <= to);
  }

  if (assigned === "none") {
    filtered = filtered.filter(i => !i.assigned || i.assigned.length === 0);
  } else if (assigned !== "all") {
    const uid = Number(assigned);
    filtered = filtered.filter(i => i.assigned?.includes(uid));
  }

  render(filtered);
}

/* ================= RENDER ================= */

function render(items) {
  const eventBody = document.getElementById("eventTable");
  const taskBody = document.getElementById("taskTable");

  eventBody.innerHTML = "";
  taskBody.innerHTML = "";

  items.forEach(item => {
    const assignedNames =
      item.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    /* EVENTS + MILESTONES */
    if (item.type === "Events" || item.type === "Milestones") {
      eventBody.innerHTML += `
        <tr>
          <td>${item.type}</td>
          <td>${item.title}</td>
          <td>${item.project_name || "—"}</td>
          <td>${item.start || "—"}</td>
          <td>${item.end || "—"}</td>
          <td>${item.all_day ? "Yes" : "No"}</td>
          <td>${assignedNames}</td>
        </tr>
      `;
    }

    /* TASKS */
    if (item.section === "tasks" || item.type === "Tasks") {

      const ticket = item.ticket ?? "—";

      const listName =
        item.list_name ||
        item.list?.name ||
        (item.list_id ? `ID: ${item.list_id}` : "—");

      const workflowName =
        item.workflow_name ||
        item.workflow?.name ||
        (item.workflow ? `ID: ${item.workflow}` : "—");

      const stageName =
        item.stage_name ||
        item.stage?.name ||
        (item.stage ? `ID: ${item.stage}` : "—");

      taskBody.innerHTML += `
        <tr>
          <td>${ticket}</td>
          <td>${item.title}</td>
          <td>${item.project_name || "—"}</td>
          <td>${listName}</td>
          <td>${workflowName}</td>
          <td>${stageName}</td>
          <td>${item.start || "—"}</td>
          <td>${item.end || "—"}</td>
          <td>${item.completed ? "Yes" : "No"}</td>
          <td>${assignedNames}</td>
          <td>${item.by_me ? "Yes" : "No"}</td>
        </tr>
      `;
    }
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadPeople();
})();
