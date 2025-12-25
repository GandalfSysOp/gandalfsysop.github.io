const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let PEOPLE = {};
let ALL_CALENDAR_ITEMS = [];

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ================= LOAD PEOPLE ================= */

async function loadPeople() {
  const res = await apiGet("people");
  const data = res.data || res;

  const select = document.getElementById("assignedFilter");

  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    select.appendChild(opt);
  });
}

/* ================= FETCH (NO PARAMS) ================= */

async function fetchCalendar() {
  console.log("Fetching /allcalendars WITHOUT parameters");

  const res = await apiGet("allcalendars");

  if (!res || !Array.isArray(res.data)) {
    console.error("Invalid calendar response", res);
    alert("Calendar API rejected the request.");
    return;
  }

  ALL_CALENDAR_ITEMS = res.data;
  applyClientFilters();
}

/* ================= CLIENT-SIDE FILTERS ================= */

function applyClientFilters() {
  const view = document.getElementById("viewFilter").value;
  const assigned = document.getElementById("assignedFilter").value;

  let filtered = [...ALL_CALENDAR_ITEMS];

  // VIEW FILTER
  if (view !== "events,milestones,tasks") {
    const allowed = view.split(",");
    filtered = filtered.filter(item =>
      allowed.includes(item.type?.toLowerCase())
    );
  }

  // ASSIGNED FILTER
  if (assigned === "none") {
    filtered = filtered.filter(
      item => !item.assigned || item.assigned.length === 0
    );
  } else if (assigned !== "all") {
    const uid = Number(assigned);
    filtered = filtered.filter(
      item => item.assigned && item.assigned.includes(uid)
    );
  }

  renderCalendar(filtered);
}

/* ================= RENDER ================= */

function renderCalendar(items) {
  const tbody = document.getElementById("calendarTable");
  tbody.innerHTML = "";

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">
          No calendar items found
        </td>
      </tr>`;
    return;
  }

  items.forEach(item => {
    const assignedNames =
      item.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    tbody.innerHTML += `
      <tr>
        <td>${item.type}</td>
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>${item.project_name || "—"}</td>
        <td>${item.start}</td>
        <td>${item.end}</td>
        <td>${item.all_day ? "Yes" : "No"}</td>
        <td>${assignedNames}</td>
        <td>${item.completed ? "Yes" : "No"}</td>
        <td>${item.by_me ? "Yes" : "No"}</td>
      </tr>
    `;
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadPeople();
})();
