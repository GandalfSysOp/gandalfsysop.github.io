const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

let PEOPLE_MAP = {};
let PROJECTS = [];
let TOPICS = [];

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

function bool(val) {
  return val ? "Yes" : "No";
}

/* ================= TOPICS ================= */

async function loadTopics() {
  const projectId = document.getElementById("projectSelect").value;
  const topicSelect = document.getElementById("topicSelect");
  topicSelect.innerHTML = `<option value="">Select discussion</option>`;

  if (!projectId) return;

  const data = await apiGet(`projects/${projectId}/topics`);

  TOPICS = Array.isArray(data)
    ? data
    : Array.isArray(data.topics)
      ? data.topics
      : [];

  TOPICS.forEach(t => {
    topicSelect.innerHTML +=
      `<option value="${t.id}">${t.title}</option>`;
  });

  document.getElementById("metaInfo").innerText =
    `Topics: ${TOPICS.length}`;
}

/* ================= RENDER ================= */

function renderDiscussion(topic, project) {
  const container = document.getElementById("discussionDetails");
  container.innerHTML = "";

  container.innerHTML = `
    <div class="card p-3">
      <h6 class="mb-3">${topic.title}</h6>

      <div class="field-row">
        <div class="label">Project</div>
        <div class="value">${project.title}</div>
      </div>

      <div class="field-row">
        <div class="label">Topic ID</div>
        <div class="value">${topic.id}</div>
      </div>

      <div class="field-row">
        <div class="label">Description</div>
        <div class="value">${topic.description || "-"}</div>
      </div>

      <div class="field-row">
        <div class="label">Pinned</div>
        <div class="value">${bool(topic.pinned)}</div>
      </div>

      <div class="field-row">
        <div class="label">Private</div>
        <div class="value">${bool(topic.private)}</div>
      </div>

      <div class="field-row">
        <div class="label">Archived</div>
        <div class="value">${bool(topic.archived)}</div>
      </div>

      <div class="field-row">
        <div class="label">Comments</div>
        <div class="value">${topic.comments?.count ?? 0}</div>
      </div>

      <div class="field-row">
        <div class="label">Assigned</div>
        <div class="value">
          ${(topic.assigned || []).map(personName).join(", ") || "-"}
        </div>
      </div>

      <div class="field-row">
        <div class="label">Created At</div>
        <div class="value">${topic.created_at}</div>
      </div>

      <div class="field-row">
        <div class="label">Updated At</div>
        <div class="value">${topic.updated_at}</div>
      </div>

      <div class="field-row">
        <div class="label">Created By</div>
        <div class="value">${personName(topic.creator?.id)}</div>
      </div>

      <div class="field-row">
        <div class="label">Updated By</div>
        <div class="value">${personName(topic.updated_by)}</div>
      </div>

      <div class="field-row">
        <div class="label">By Me</div>
        <div class="value">${bool(topic.by_me)}</div>
      </div>

      <div class="field-row">
        <div class="label">Reply Email</div>
        <div class="value">${topic.reply_email || "-"}</div>
      </div>
    </div>
  `;
}

/* ================= ACTION ================= */

async function fetchDiscussion() {
  const projectId = document.getElementById("projectSelect").value;
  const topicId = document.getElementById("topicSelect").value;

  if (!projectId || !topicId)
    return alert("Select both project and discussion");

  await loadPeople();

  const data = await apiGet(`projects/${projectId}/topics/${topicId}`);
  const topic =
    data?.topics?.[0] || data?.[0];

  const project = PROJECTS.find(p => p.id == projectId);

  renderDiscussion(topic, project);

  document.getElementById("metaInfo").innerText =
    `Projects: ${PROJECTS.length} • Topics: ${TOPICS.length}`;
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();
  document
    .getElementById("projectSelect")
    .addEventListener("change", loadTopics);
});
