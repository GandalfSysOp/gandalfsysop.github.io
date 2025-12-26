const GAS_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

const PEOPLE = {};

/* =======================
   API
======================= */
async function apiGet(path) {
  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text);
    throw new Error(text);
  }
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Only preload people
  await loadPeople();
}

/* =======================
   PEOPLE
======================= */
async function loadPeople() {
  const data = await apiGet("v3/people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* =======================
   ANNOUNCEMENTS
======================= */
async function loadAnnouncements() {
  const tbody = document.getElementById("announcementTable");
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-4">
        Loading announcements…
      </td>
    </tr>`;

  const res = await apiGet("v4/announcements");

  document.getElementById("totalCount").innerText =
    res.total_count ?? 0;

  renderAnnouncements(res.announcements || []);
}

/* =======================
   RENDER
======================= */
function renderAnnouncements(list) {
  const tbody = document.getElementById("announcementTable");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No announcements found
        </td>
      </tr>`;
    return;
  }

  list.forEach((a, index) => {
    const rowId = `expand-${index}`;

    const assignedNames =
      (a.assigned || [])
        .map(id => PEOPLE[id] || id)
        .join(", ") || "—";

    const creator = PEOPLE[a.created_by] || a.created_by || "—";

    tbody.innerHTML += `
      <tr>
        <td>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="toggleRow('${rowId}')">+</button>
        </td>

        <td class="wrap fw-semibold">${a.title}</td>

        <td class="wrap">${assignedNames}</td>

        <td>
          ${a.pinned
            ? `<span class="badge bg-warning text-dark">Pinned</span>`
            : "—"}
        </td>

        <td>
          <span class="badge ${
            a.status === "active" ? "bg-success" : "bg-secondary"
          }">
            ${a.status}
          </span>
        </td>

        <td>${a.comments?.count ?? 0}</td>

        <td>${a.created_at || "—"}</td>

        <td>${creator}</td>
      </tr>

      <tr id="${rowId}" style="display:none;background:#fafafa;">
        <td colspan="8">
          <div class="p-3">

            <div><strong>ID:</strong> ${a.id}</div>

            <div><strong>Description:</strong>
              ${stripHtml(a.description) || "—"}
            </div>

            <div><strong>Updated At:</strong> ${a.updated_at || "—"}</div>
            <div><strong>Updated By:</strong>
              ${PEOPLE[a.updated_by] || a.updated_by || "—"}
            </div>

            <div><strong>Valid Till:</strong>
              ${a.valid_till?.text || "—"}
            </div>

            <div><strong>Comments Allowed:</strong>
              ${a.comments_allowed ? "Yes" : "No"}
            </div>

            <div><strong>Hide Subscribers:</strong>
              ${a.hide_subscribers ? "Yes" : "No"}
            </div>

            <div><strong>Deleted:</strong>
              ${a.deleted ? "Yes" : "No"}
            </div>

            <div><strong>Seen By:</strong>
              ${(a.seen || []).map(id => PEOPLE[id] || id).join(", ") || "—"}
            </div>

            <div><strong>Attachments:</strong>
              ${(a.attachments || []).length}
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

/* =======================
   HELPERS
======================= */
function toggleRow(id) {
  const row = document.getElementById(id);
  row.style.display =
    row.style.display === "none" ? "table-row" : "none";
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
