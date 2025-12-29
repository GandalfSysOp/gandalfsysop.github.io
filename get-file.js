const BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOOKUP MAPS ================= */

let PEOPLE = {};
let PROJECTS = {};
let FOLDERS = {};

/* ================= LOADERS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE).length) return;
  const data = await apiGet("people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const sel = document.getElementById("projectSelect");
  sel.innerHTML = `<option value="">Select project</option>`;
  const projects = await apiGet("projects");
  projects.forEach(p => {
    PROJECTS[p.id] = p.title;
    sel.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

async function loadFolders(pid) {
  const sel = document.getElementById("folderSelect");
  sel.innerHTML = `<option value="">Select folder</option>`;
  FOLDERS = {};

  const root = await apiGet(`projects/${pid}/folders`);

  function walk(folder) {
    FOLDERS[folder.id] = folder.name;
    sel.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
    (folder.children || []).forEach(walk);
  }

  walk(root);
}

async function loadFiles(pid, fid) {
  const sel = document.getElementById("fileSelect");
  sel.innerHTML = `<option value="">Select file</option>`;

  const files = await apiGet(`projects/${pid}/folders/${fid}/files`);
  files.forEach(f => {
    sel.innerHTML += `<option value="${f.id}">${f.name}</option>`;
  });
}

/* ================= HELPERS ================= */

const personName = id => PEOPLE[id] || `${id}`;
const projectName = id => PROJECTS[id] || `${id}`;
const folderName = id => FOLDERS[id] || `${id}`;

function toggle(id) {
  document.getElementById(id)?.classList.toggle("d-none");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "-";
  if (Array.isArray(v)) return v.join(", ");
  return v;
}

/* ================= RENDER ================= */

function renderFile(file) {
  const tbody = document.getElementById("fileBody");
  tbody.innerHTML = "";

  const rowId = `details_${file.id}`;

  tbody.innerHTML = `
<tr>
  <td class="expand" onclick="toggle('${rowId}')">
    <i class="bi bi-chevron-right"></i>
  </td>
  <td>${file.name}</td>
  <td>${file.file_type}</td>
  <td>${(file.byte_size / 1024).toFixed(1)}</td>
  <td>${personName(file.creator?.id)}</td>
  <td>${projectName(file.project?.id)}</td>
  <td>${folderName(file.folder?.id)}</td>
  <td>${new Date(file.created_at).toLocaleString()}</td>
</tr>

<tr id="${rowId}" class="d-none details">
<td colspan="8">
  <div class="row g-3">

    <div class="col-md-4"><div class="label">Approved By</div><div class="value">${personName(file.approved_by)}</div></div>
    <div class="col-md-4"><div class="label">Approved Count</div><div class="value">${safe(file.approved_count)}</div></div>
    <div class="col-md-4"><div class="label">Approved By Me</div><div class="value">${safe(file.approved_by_me)}</div></div>

    <div class="col-md-4"><div class="label">Updated By</div><div class="value">${personName(file.updated_by)}</div></div>
    <div class="col-md-4"><div class="label">Updated At</div><div class="value">${safe(file.updated_at)}</div></div>
    <div class="col-md-4"><div class="label">By Me</div><div class="value">${safe(file.by_me)}</div></div>

    <div class="col-md-4"><div class="label">Task List ID</div><div class="value">${safe(file.list_id)}</div></div>
    <div class="col-md-4"><div class="label">Connected With</div><div class="value">${safe(file.connected_with)}</div></div>
    <div class="col-md-4"><div class="label">Connected ID</div><div class="value">${safe(file.connected_id)}</div></div>

    <div class="col-md-4"><div class="label">Proof Count</div><div class="value">${safe(file.proof_count)}</div></div>
    <div class="col-md-4"><div class="label">Proof Version</div><div class="value">${safe(file.proof_version)}</div></div>
    <div class="col-md-4"><div class="label">Current Version</div><div class="value">${safe(file.current_version)}</div></div>

    <div class="col-md-6"><div class="label">Notify</div><div class="value">${(file.notify || []).map(personName).join(", ") || "-"}</div></div>
    <div class="col-md-6"><div class="label">Source</div><div class="value">${safe(file.source)}</div></div>

    <div class="col-md-12">
      <div class="label">Links</div>
      <div class="value">
        ${file.url?.download ? `<a href="${file.url.download}" target="_blank">Download</a>` : "-"} |
        ${file.url?.view ? `<a href="${file.url.view}" target="_blank">View</a>` : "-"} |
        ${file.url?.share ? `<a href="${file.url.share}" target="_blank">Share</a>` : "-"} |
        ${file.url?.proofing ? `<a href="${file.url.proofing}" target="_blank">Proofing</a>` : "-"}
      </div>
    </div>

  </div>
</td>
</tr>`;
}

/* ================= ACTION ================= */

async function fetchFileDetails() {
  await loadPeople();

  const pid = projectSelect.value;
  const fid = folderSelect.value;
  const fileId = fileSelect.value;

  if (!pid || !fid || !fileId) {
    alert("Select project, folder and file");
    return;
  }

  const file = await apiGet(
    `projects/${pid}/folders/${fid}/files/${fileId}`
  );

  renderFile(file);
}

/* ================= EVENTS ================= */

projectSelect.onchange = () => loadFolders(projectSelect.value);
folderSelect.onchange = () => loadFiles(projectSelect.value, folderSelect.value);

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadProjects);
