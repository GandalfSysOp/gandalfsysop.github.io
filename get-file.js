const API_BASE = "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

let projects = [];
let folders = [];
let files = [];

const projectSelect = document.getElementById("projectSelect");
const folderSelect = document.getElementById("folderSelect");
const fileSelect = document.getElementById("fileSelect");
const fileSearch = document.getElementById("fileSearch");
const fileDetails = document.getElementById("fileDetails");

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
});

/* ------------------ LOAD PROJECTS ------------------ */
async function loadProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  projects = await res.json();

  projectSelect.innerHTML = projects
    .map(p => `<option value="${p.id}">${p.title}</option>`)
    .join("");

  loadFolders();
}

projectSelect.addEventListener("change", loadFolders);

/* ------------------ LOAD FOLDERS ------------------ */
async function loadFolders() {
  const projectId = projectSelect.value;
  const res = await fetch(`${API_BASE}/projects/${projectId}/folders`);
  const root = await res.json();

  folders = root.children || [];

  folderSelect.innerHTML = folders
    .map(f => `<option value="${f.id}">${f.name}</option>`)
    .join("");

  loadFiles();
}

folderSelect.addEventListener("change", loadFiles);

/* ------------------ LOAD FILES ------------------ */
async function loadFiles() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;

  const res = await fetch(
    `${API_BASE}/projects/${projectId}/folders/${folderId}/files`
  );
  files = await res.json();

  renderFileDropdown(files);
}

/* ------------------ SEARCHABLE FILE DROPDOWN ------------------ */
fileSearch.addEventListener("input", () => {
  const q = fileSearch.value.toLowerCase();
  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(q)
  );
  renderFileDropdown(filtered);
});

function renderFileDropdown(list) {
  fileSelect.innerHTML = list
    .map(f => `<option value="${f.id}">${f.name}</option>`)
    .join("");
}

/* ------------------ FETCH FILE DETAILS ------------------ */
async function fetchFileDetails() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;
  const fileId = fileSelect.value;

  const res = await fetch(
    `${API_BASE}/projects/${projectId}/folders/${folderId}/files/${fileId}`
  );
  const file = await res.json();

  renderFileDetails(file);
}

/* ------------------ RENDER FILE DETAILS ------------------ */
function renderFileDetails(f) {
  fileDetails.innerHTML = `
    <div class="card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <h6 class="mb-1">${f.name}</h6>
          <div class="text-muted small">${f.file_type?.toUpperCase()} • ${f.byte_size} bytes</div>
        </div>
        <div class="expand" onclick="toggleDetails()">
          <i class="bi bi-chevron-down"></i>
        </div>
      </div>

      <div id="extraDetails" class="hidden mt-3">
        ${renderField("ID", f.id)}
        ${renderField("Created At", f.created_at)}
        ${renderField("Updated At", f.updated_at)}
        ${renderField("Proof Version", f.proof_version)}
        ${renderField("Version Count", f.version_count)}
        ${renderField("By Me", f.by_me)}
        ${renderField("Approved Count", f.approved_count)}
        ${renderField("Source", f.source)}
        ${renderLinks(f.url)}
      </div>
    </div>
  `;
}

function renderField(label, value) {
  return `
    <div class="row mb-1">
      <div class="col-4 label">${label}</div>
      <div class="col-8 value">${value ?? "-"}</div>
    </div>
  `;
}

function renderLinks(url) {
  if (!url) return "";
  return `
    <div class="mt-2">
      <a href="${url.view}" target="_blank">View</a> |
      <a href="${url.download}" target="_blank">Download</a> |
      <a href="${url.share}" target="_blank">Share</a>
    </div>
  `;
}

/* ------------------ TOGGLE ------------------ */
function toggleDetails() {
  document.getElementById("extraDetails").classList.toggle("hidden");
}
