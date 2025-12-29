/* ===============================
   CONFIG
================================ */
const API_BASE = "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ===============================
   GLOBAL CACHES
================================ */
const peopleMap = {};
const projectMap = {};
const folderMap = {};

/* ===============================
   UTILITIES
================================ */
function safeDate(val) {
  return val ? new Date(val).toLocaleString() : "-";
}

function safeSize(bytes) {
  return typeof bytes === "number"
    ? `${(bytes / 1024).toFixed(1)} KB`
    : "-";
}

function toggle(id) {
  document.getElementById(id).classList.toggle("d-none");
}

/* ===============================
   NAME RESOLVERS
================================ */
function personName(id) {
  return id && peopleMap[id] ? peopleMap[id] : id ?? "-";
}

function projectName(id) {
  return id && projectMap[id] ? projectMap[id] : id ?? "-";
}

function folderName(id) {
  return id && folderMap[id] ? folderMap[id] : id ?? "-";
}

/* ===============================
   API FETCH
================================ */
async function apiGet(path) {
  const res = await fetch(`${API_BASE}/${path}`);
  if (!res.ok) throw new Error("API Error");
  return res.json();
}

/* ===============================
   PRELOAD DATA
================================ */
async function preloadLookups() {
  const [people, projects] = await Promise.all([
    apiGet("people"),
    apiGet("projects")
  ]);

  people.forEach(p => {
    peopleMap[p.id] = p.name;
  });

  projects.forEach(p => {
    projectMap[p.id] = p.title;
  });
}

/* ===============================
   LOAD PROJECTS
================================ */
async function loadProjects() {
  await preloadLookups();

  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = `<option value="">Select Project</option>`;
  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* ===============================
   LOAD FOLDERS
================================ */
async function loadFolders(projectId) {
  const data = await apiGet(`projects/${projectId}/folders`);

  folderMap[data.id] = data.name;

  const folders = data.children || [];
  const select = document.getElementById("folderSelect");

  select.innerHTML = `<option value="">Select Folder</option>`;
  folders.forEach(f => {
    folderMap[f.id] = f.name;
    select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
  });
}

/* ===============================
   NORMALIZE FILE
================================ */
function normalizeFile(raw) {
  return {
    id: raw.id,
    name: raw.name || "-",
    type: raw.file_type || "-",
    size: safeSize(raw.byte_size),

    created_at: safeDate(raw.created_at),
    updated_at: safeDate(raw.updated_at),

    creator: raw.creator?.id ?? null,
    updated_by: raw.updated_by ?? null,

    project: raw.project?.id ?? null,
    folder: raw.folder?.id ?? null,

    by_me: raw.by_me ?? false,
    source: raw.source || "-",

    notify: Array.isArray(raw.notify) ? raw.notify : [],

    connected_id: raw.connected?.id ?? "-",
    connected_with: raw.connected?.with ?? "-",

    version_count: raw.version?.count ?? "-",
    current_version: raw.version?.current ?? "-",

    urls: {
      download: raw.url?.download || null,
      view: raw.url?.view || null,
      share: raw.url?.share || null,
      proofing: raw.url?.proofing || null
    }
  };
}

/* ===============================
   FETCH FILE DETAILS
================================ */
async function fetchFileDetails() {
  const pid = projectSelect.value;
  const fid = folderSelect.value;
  const fileId = fileSelect.value;

  const raw = await apiGet(
    `projects/${pid}/folders/${fid}/files/${fileId}`
  );

  const file = normalizeFile(raw);
  renderFile(file);
}

/* ===============================
   RENDER FILE
================================ */
function renderFile(f) {
  const tbody = document.getElementById("fileBody");
  tbody.innerHTML = "";

  const detailId = `detail_${f.id}`;

  tbody.innerHTML = `
<tr>
  <td class="expand" onclick="toggle('${detailId}')">▶</td>
  <td>${f.name}</td>
  <td>${f.type}</td>
  <td>${f.size}</td>
  <td>${personName(f.creator)}</td>
  <td>${projectName(f.project)}</td>
  <td>${folderName(f.folder)}</td>
  <td>${f.created_at}</td>
</tr>

<tr id="${detailId}" class="d-none bg-light">
<td colspan="8">
  <div class="row g-3">

    <div class="col-md-4"><b>Updated By</b><br>${personName(f.updated_by)}</div>
    <div class="col-md-4"><b>Updated At</b><br>${f.updated_at}</div>
    <div class="col-md-4"><b>By Me</b><br>${f.by_me}</div>

    <div class="col-md-4"><b>Connected With</b><br>${f.connected_with}</div>
    <div class="col-md-4"><b>Connected ID</b><br>${f.connected_id}</div>

    <div class="col-md-4"><b>Version Count</b><br>${f.version_count}</div>
    <div class="col-md-4"><b>Current Version</b><br>${f.current_version}</div>

    <div class="col-md-8">
      <b>Notify</b><br>
      ${f.notify.length ? f.notify.map(personName).join(", ") : "-"}
    </div>

    <div class="col-md-12">
      <b>Links</b><br>
      ${f.urls.download ? `<a href="${f.urls.download}" target="_blank">Download</a>` : "-"} |
      ${f.urls.view ? `<a href="${f.urls.view}" target="_blank">View</a>` : "-"} |
      ${f.urls.share ? `<a href="${f.urls.share}" target="_blank">Share</a>` : "-"} |
      ${f.urls.proofing ? `<a href="${f.urls.proofing}" target="_blank">Proofing</a>` : "-"}
    </div>

  </div>
</td>
</tr>`;
}

/* ===============================
   EVENTS
================================ */
document.addEventListener("DOMContentLoaded", loadProjects);

projectSelect.addEventListener("change", () => {
  if (projectSelect.value) loadFolders(projectSelect.value);
});
