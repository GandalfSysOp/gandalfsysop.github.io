const BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOOKUPS ================= */

let PEOPLE = {}, PROJECTS = {}, FOLDERS = {}, TASKLISTS = {};

/* ================= LOADERS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE).length) return;
  (await apiGet("people")).forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const sel = projectSelect;
  sel.innerHTML = `<option value="">Select project</option>`;
  (await apiGet("projects")).forEach(p => {
    PROJECTS[p.id] = p.title;
    sel.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

async function loadFolders(pid) {
  FOLDERS = {};
  folderSelect.innerHTML = `<option value="">Select folder</option>`;
  const root = await apiGet(`projects/${pid}/folders`);

  (function walk(f){
    FOLDERS[f.id] = f.name;
    folderSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    (f.children || []).forEach(walk);
  })(root);
}

async function loadFiles(pid,fid) {
  fileSelect.innerHTML = `<option value="">Select file</option>`;
  (await apiGet(`projects/${pid}/folders/${fid}/files`))
    .forEach(f => {
      fileSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
}

/* ================= HELPERS ================= */

const person = id => PEOPLE[id] || id;
const project = id => PROJECTS[id] || id;
const folder = id => FOLDERS[id] || id;

function toggle(id) {
  document.getElementById(id).classList.toggle("d-none");
}

/* ================= RENDER ================= */

function renderFile(f) {
  const tbody = document.getElementById("fileBody");
  tbody.innerHTML = "";

  const rowId = `d_${f.id}`;

  tbody.innerHTML += `
<tr>
<td class="expand" onclick="toggle('${rowId}')">
  <i class="bi bi-chevron-right"></i>
</td>
<td>${f.name}</td>
<td>${f.file_type}</td>
<td>${(f.byte_size/1024).toFixed(1)}</td>
<td>${person(f.creator?.id)}</td>
<td>${project(f.project?.id)}</td>
<td>${folder(f.folder?.id)}</td>
<td>${new Date(f.created_at).toLocaleString()}</td>
</tr>

<tr id="${rowId}" class="details d-none">
<td colspan="8">
  <div class="row g-2">
    <div class="col-md-4"><span class="label">Approved By</span><div class="value">${person(f.approved_by)}</div></div>
    <div class="col-md-4"><span class="label">Updated By</span><div class="value">${person(f.updated_by)}</div></div>
    <div class="col-md-4"><span class="label">Notify</span><div class="value">${(f.notify||[]).map(person).join(", ")}</div></div>

    <div class="col-md-4"><span class="label">List</span><div class="value">${f.list_id || "-"}</div></div>
    <div class="col-md-4"><span class="label">Proof Count</span><div class="value">${f.proof_count}</div></div>
    <div class="col-md-4"><span class="label">Version</span><div class="value">${f.version?.count}</div></div>

    <div class="col-md-12"><span class="label">Download</span>
      <div class="value"><a href="${f.url?.download}" target="_blank">${f.url?.download}</a></div>
    </div>
  </div>
</td>
</tr>`;
}

/* ================= ACTION ================= */

async function fetchFileDetails() {
  await Promise.all([loadPeople()]);
  const f = await apiGet(`projects/${projectSelect.value}/folders/${folderSelect.value}/files/${fileSelect.value}`);
  renderFile(f);
}

/* ================= EVENTS ================= */

projectSelect.onchange = () => loadFolders(projectSelect.value);
folderSelect.onchange = () => loadFiles(projectSelect.value,folderSelect.value);

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadProjects);
