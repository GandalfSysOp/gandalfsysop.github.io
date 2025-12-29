const API_BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

// ---------------- API ----------------
async function apiGet(path) {
  const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// ---------------- LOOKUPS ----------------
const peopleMap = {};
const projectMap = {};
const folderMap = {};

function safeDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d) ? "-" : d.toLocaleString();
}

function nameFromPeople(id) {
  return peopleMap[id] || `#${id}`;
}

function namesFromPeople(ids = []) {
  return ids.map(id => nameFromPeople(id)).join(", ") || "-";
}

// ---------------- PRELOAD ----------------
async function preloadLookups() {
  const [people, projects] = await Promise.all([
    apiGet("people"),
    apiGet("projects")
  ]);

  people.forEach(p => {
    peopleMap[p.id] = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  });

  projects.forEach(p => {
    projectMap[p.id] = p.title;
  });
}

// ---------------- PROJECTS ----------------
async function loadProjects() {
  await preloadLookups();
  const projects = await apiGet("projects");

  projectSelect.innerHTML = `<option value="">Select Project</option>`;
  projects.forEach(p => {
    projectSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });

  projectSelect.onchange = loadFolders;
}

// ---------------- FOLDERS ----------------
async function loadFolders() {
  const projectId = projectSelect.value;
  if (!projectId) return;

  const root = await apiGet(`projects/${projectId}/folders`);
  folderSelect.innerHTML = `<option value="">Select Folder</option>`;

  function walk(folder) {
    folderMap[folder.id] = folder.name;
    folderSelect.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
    folder.children?.forEach(walk);
  }

  walk(root);
  folderSelect.onchange = loadFiles;
}

// ---------------- FILES ----------------
async function loadFiles() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;
  if (!folderId) return;

  const files = await apiGet(
    `projects/${projectId}/folders/${folderId}/files`
  );

  fileSelect.innerHTML = `<option value="">Select File</option>`;
  files.forEach(f => {
    fileSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
  });
}

// ---------------- FILE DETAILS ----------------
async function fetchFileDetails() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;
  const fileId = fileSelect.value;
  if (!fileId) return;

  let data = await apiGet(
    `projects/${projectId}/folders/${folderId}/files/${fileId}`
  );

  // ✅ CRITICAL FIX: unwrap array
  const file = Array.isArray(data) ? data[0] : data;

  const rows = {
  "File Name": file.name,
  "File Type": file.file_type,
  "Size (KB)": file.byte_size ? (file.byte_size / 1024).toFixed(2) : "-",
  "Source": file.source,

  "Created At": safeDate(file.created_at),
  "Updated At": safeDate(file.updated_at),

  "Creator": nameFromPeople(file.creator?.id),
  "Updated By": nameFromPeople(file.updated_by),

  "Approved By": namesFromPeople(file.approved_by),
  "Approved By Me": file.approved_by_me ? "Yes" : "No",
  "By Me": file.by_me ? "Yes" : "No",

  "Notify": namesFromPeople(file.notify),

  "Project": projectMap[file.project?.id],
  "Folder": folderMap[file.folder?.id],

  "Proof Count": file.proof_count,
  "Proof Version": file.proof_version,

  "Version Count": file.version?.count ?? file.version_count ?? "-",
  "Is Current Version": file.version?.current ? "Yes" : "No",
  "Main Version ID": file.version_main ?? "-",

  "Download": file.url?.download
    ? `<a href="${file.url.download}" target="_blank">Download</a>`
    : "-",

  "View": file.url?.view
    ? `<a href="${file.url.view}" target="_blank">View</a>`
    : "-",

  "Proofing": file.url?.proofing
    ? `<a href="${file.url.proofing}" target="_blank">Open Proofing</a>`
    : "-",

  "Share": file.url?.share
    ? `<a href="${file.url.share}" target="_blank">Share Link</a>`
    : "-"
};

  fileDetails.innerHTML = "";
  Object.entries(rows).forEach(([k, v]) => {
    fileDetails.innerHTML += `
      <tr>
        <th>${k}</th>
        <td>${v ?? "-"}</td>
      </tr>
    `;
  });
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", loadProjects);
