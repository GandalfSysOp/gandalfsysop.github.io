const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzG4IrtIkFgaQmVWeu9wr3VaXUbxYQSBai8H0uzLZvKgTIvS621u8Fih4zwbiYJ68qk/exec";

/* ================= LOOKUP ================= */

let PEOPLE_MAP = {};
let PROJECTS = [];

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOADERS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  PROJECTS = await apiGet("projects");
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;
  PROJECTS.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ================= HELPERS ================= */

function personName(id) {
  return PEOPLE_MAP[id] || id || "-";
}

function boolBadge(val) {
  return val
    ? `<span class="badge bg-success">Yes</span>`
    : `<span class="badge bg-secondary">No</span>`;
}

function toggle(id) {
  const el = document.getElementById(id);
  el.classList.toggle("d-none");
}

/* ================= RENDER ================= */

function renderTopics(topics) {
  const container = document.getElementById("topicsContainer");
  container.innerHTML = "";

  if (!topics.length) {
    container.innerHTML =
      `<div class="text-center text-muted py-4">No discussions found</div>`;
    return;
  }

  document.getElementById("countText").innerText =
    `${topics.length} discussion(s)`;

  topics.forEach((t, i) => {
    const expandId = `expand-${i}`;

    container.innerHTML += `
      <div class="card p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${t.title}</strong>
            <div class="text-muted small">
              Created ${new Date(t.created_at).toLocaleString()}
            </div>
          </div>
          <button class="btn btn-sm btn-outline-primary"
            onclick="toggle('${expandId}')">
            Details
          </button>
        </div>

        <div id="${expandId}" class="mt-3 d-none">
          <div class="field-row">
            <div class="label">ID</div>
            <div class="value">${t.id}</div>
          </div>

          <div class="field-row">
            <div class="label">Description</div>
            <div class="value">${t.description || "-"}</div>
          </div>

          <div class="field-row">
            <div class="label">Pinned</div>
            <div class="value">${boolBadge(t.pinned)}</div>
          </div>

          <div class="field-row">
            <div class="label">Private</div>
            <div class="value">${boolBadge(t.private)}</div>
          </div>

          <div class="field-row">
            <div class="label">Archived</div>
            <div class="value">${boolBadge(t.archived)}</div>
          </div>

          <div class="field-row">
            <div class="label">Comments</div>
            <div class="value">${t.comments?.count ?? 0}</div>
          </div>

          <div class="field-row">
            <div class="label">Reply Email</div>
            <div class="value">${t.reply_email || "-"}</div>
          </div>

          <div class="field-row">
            <div class="label">Assigned</div>
            <div class="value">
              ${(t.assigned || []).map(personName).join(", ") || "-"}
            </div>
          </div>

          <div class="field-row">
            <div class="label">Created By</div>
            <div class="value">${personName(t.creator?.id)}</div>
          </div>

          <div class="field-row">
            <div class="label">Updated By</div>
            <div class="value">${personName(t.updated_by)}</div>
          </div>

          <div class="field-row">
            <div class="label">By Me</div>
            <div class="value">${boolBadge(t.by_me)}</div>
          </div>
        </div>
      </div>
    `;
  });
}

/* ================= ACTION ================= */

async function fetchTopics() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return alert("Select a project");

  await loadPeople();

  const data = await apiGet(`projects/${projectId}/topics`);

  // 🔥 NORMALIZE RESPONSE
  const topics = Array.isArray(data)
    ? data
    : Array.isArray(data.topics)
      ? data.topics
      : [];

  renderTopics(topics);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();
});
