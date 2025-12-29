const API_BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

// -------------------- SAFE API CALL --------------------
async function apiGet(path) {
  const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API failed");
  return res.json();
}

// -------------------- LOOKUPS --------------------
const peopleMap = {};
const projectMap = {};
const folderMap = {};

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

// -------------------- LOAD PROJECTS --------------------
async function loadProjects() {
  await preloadLookups();

  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = `<option value="">Select Project</option>`;
  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });

  select.onchange = loadFolders;
}

// -------------------- LOAD FOLDERS --------------------
async function loadFolders() {
  const projectId = projectSelect.value;
  if (!projectId) return;

  const data = await apiGet(`projects/${projectId}/folders`);
  folderSelect.innerHTML = `<option value="">Select Folder</option>`;

  function walk(folder) {
    folderMap[folder.id] = folder.name;
    folderSelect.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
    folder.children?.forEach(walk);
  }

  walk(data);
  folderSelect.onchange = loadFiles;
}

// -------------------- LOAD FILES --------------------
async function loadFiles() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;
  if (!folderId) return;

  const files = await apiGet(`projects/${projectId}/folders/${folderId}/files`);
  fileSelect.innerHTML = `<option value="">Select File</option>`;

  files.forEach(f => {
    fileSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
  });
}

// -------------------- FILE DETAILS --------------------
async function fetchFileDetails() {
  const projectId = projectSelect.value;
  const folderId = folderSelect.value;
  const fileId = fileSelect.value;
  if (!fileId) return;

  const file = await apiGet(
    `projects/${projectId}/folders/${folderId}/files/${fileId}`
  );

  const rows = {
    "File Name": file.name,
    "File Type": file.file_type,
    "Size (KB)": (file.byte_size / 1024).toFixed(2),
    "Created At": new Date(file.created_at).toLocaleString(),
    "Updated At": new Date(file.updated_at).toLocaleString(),
    "Creator": peopleMap[file.creator?.id] || file.creator?.id,
    "Updated By": peopleMap[file.updated_by] || file.updated_by,
    "Project": projectMap[file.project?.id],
    "Folder": folderMap[file.folder?.id],
    "Approved Count": file.approved_count,
    "Proof Version": file.proof_version,
    "Source": file.source,
    "Download URL": `<a href="${file.url?.download}" target="_blank">Download</a>`,
    "View URL": `<a href="${file.url?.view}" target="_blank">View</a>`
  };

  const tbody = document.getElementById("fileDetails");
  tbody.innerHTML = "";

  Object.entries(rows).forEach(([k, v]) => {
    tbody.innerHTML += `
      <tr>
        <th>${k}</th>
        <td>${v ?? "-"}</td>
      </tr>
    `;
  });
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", loadProjects);
