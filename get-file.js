const GAS_BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOOKUPS ================= */

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
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;

  projects.forEach(p => {
    PROJECTS[p.id] = p.title;
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

async function loadFolders(projectId) {
  const root = await apiGet(`projects/${projectId}/folders`);
  const select = document.getElementById("folderSelect");
  select.innerHTML = `<option value="">Select folder</option>`;
  FOLDERS = {};

  function walk(folder) {
    FOLDERS[folder.id] = folder.name;
    select.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
    (folder.children || []).forEach(walk);
  }

  walk(root);
}

async function loadFiles(projectId, folderId) {
  const files = await apiGet(`projects/${projectId}/folders/${folderId}/files`);
  const select = document.getElementById("fileSelect");
  select.innerHTML = `<option value="">Select file</option>`;

  files.forEach(f => {
    select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
  });
}

/* ================= EVENTS ================= */

document.getElementById("projectSelect").addEventListener("change", async e => {
  const pid = e.target.value;
  if (!pid) return;
  await loadFolders(pid);
});

document.getElementById("folderSelect").addEventListener("change", async e => {
  const pid = projectSelect.value;
  const fid = e.target.value;
  if (!fid) return;
  await loadFiles(pid, fid);
});

/* ================= RENDER ================= */

function labelize(key) {
  return key.replace(/_/g, " ").toUpperCase();
}

function resolveValue(key, val) {
  if (val === null || val === undefined) return "-";

  if (key === "creator" || key === "updated_by") {
    return PEOPLE[val?.id || val] || val;
  }

  if (key === "project") {
    return PROJECTS[val.id] || val.id;
  }

  if (key === "folder") {
    return FOLDERS[val.id] || val.id;
  }

  if (Array.isArray(val)) {
    return val.map(v => PEOPLE[v] || v).join(", ");
  }

  if (typeof val === "object") {
    return Object.entries(val)
      .map(([k, v]) => `<div><strong>${k}:</strong> ${resolveValue(k, v)}</div>`)
      .join("");
  }

  return val.toString();
}

function renderFile(file) {
  const container = document.getElementById("fileDetails");
  container.innerHTML = "";

  Object.keys(file).forEach(key => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `
      <div class="label">${labelize(key)}</div>
      <div class="value">${resolveValue(key, file[key])}</div>
    `;
    container.appendChild(row);
  });
}

/* ================= ACTION ================= */

async function fetchFileDetails() {
  const pid = projectSelect.value;
  const fid = folderSelect.value;
  const fileId = fileSelect.value;

  if (!pid || !fid || !fileId) {
    alert("Select project, folder, and file");
    return;
  }

  await loadPeople();

  const data = await apiGet(
    `projects/${pid}/folders/${fid}/files/${fileId}`
  );

  renderFile(data);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();
});
