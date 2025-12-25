const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let PEOPLE = {};

/* ================= API ================= */

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?path=${encodeURIComponent(
    path + (qs ? "?" + qs : "")
  )}`;

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

/* ================= FETCH ================= */

async function fetchCalendar() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const view = document.getElementById("viewFilter").value;
  const assigned = document.getElementById("assignedFilter").value;

  if (!startDate || !endDate) {
    alert("Please select start and end dates");
    return;
  }

  // 🔒 STRICT ProofHub calendar params
  const params = {
    startDate,
    endDate,
    view,        // events,milestones,tasks
    assigned     // all | none | user_id
  };

  console.log("CALENDAR PARAMS →", params);

  const res = await apiGet("allcalendars", params);

  if (!res || !Array.isArray(res.data)) {
    console.error("Invalid calendar response", res);
    alert("Invalid calendar request (1301). Check parameters.");
    return;
  }

  renderCalendar(res.data);
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
    const assigned =
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
        <td>${assigned}</td>
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
