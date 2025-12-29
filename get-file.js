/* ================= CONFIG ================= */

const API_BASE =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API HELPER ================= */

async function apiGet(path) {
  const url = `${API_BASE}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API failed: ${res.status}`);
  }

  return res.json();
}

/* ================= STATE ================= */

let PROJECTS = [];
let FOLDERS = [];
let FILES = [];

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();

  document
    .getElementById("projectSelect")
    .addEventListener("change", loadFolders);

  document
    .getElementById("folderSelect")
    .addEventListener("change", loadFiles);
});

/* ================= LOAD PROJECTS ================= */

async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select Project</option>`;

  PROJECTS = await apiGet("projects");

  PROJECTS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.title;
    select.appendChild(opt);
  });
}

/* ================= LOAD FOLDERS ================= */

async function loadFolders() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  const select = document.getElementById("folderSelect");
  select.innerHTML = `<option value="">Select Folder</option>`;

  const data = await apiGet(`projects/${projectId}/folders`);

  FOLDERS = [];

  function flatten(folder) {
    FOLDERS.push(folder);
    (folder.children || []).forEach(flatten);
  }

  flatten(data);

  FOLDERS.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = `${"—".repeat(f.level - 1)} ${f.name}`;
    select.appendChild(opt);
  });
}

/* ================= LOAD FILES ================= */

async function loadFiles() {
  const projectId = document.getElementById("projectSelect").value;
  const folderId = document.getElementById("folderSelect").value;
  if (!projectId || !folderId) return;

  const select = document.getElementById("fileSelect");
  select.innerHTML = "";

  FILES = await apiGet(
    `projects/${projectId}/folders/${folderId}/files`
  );

  FILES.forEach(file => {
    const opt = document.createElement("option");
    opt.value = file.id;
    opt.textContent = `${file.name} (${file.file_type || "-"})`;
    select.appendChild(opt);
  });

  if (window.jQuery && $(select).select2) {
    $(select).select2({ width: "100%" });
  }
}

/* ================= FETCH FILE DETAILS ================= */

async function fetchFileDetails() {
  const projectId = document.getElementById("projectSelect").value;
  const folderId = document.getElementById("folderSelect").value;
  const fileId = document.getElementById("fileSelect").value;

  if (!projectId || !folderId || !fileId) {
    alert("Please select project, folder and file");
    return;
  }

  const data = await apiGet(
    `projects/${projectId}/folders/${folderId}/files/${fileId}`
  );

  renderFile(data);
}

/* ================= RENDER ================= */

function renderFile(file) {
  const container = document.getElementById("fileDetails");
  container.innerHTML = "";

  Object.entries(file).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "field-row";

    row.innerHTML = `
      <div class="label">${key.replace(/_/g, " ")}</div>
      <div class="value">${formatValue(value)}</div>
    `;

    container.appendChild(row);
  });
}

/* ================= FORMATTERS ================= */

function formatValue(val) {
  if (val === null || val === undefined) return "-";

  if (Array.isArray(val)) return val.join(", ");

  if (typeof val === "object") {
    if (val.download) {
      return `<a href="${val.download}" target="_blank">Download</a>`;
    }
    return `<pre>${JSON.stringify(val, null, 2)}</pre>`;
  }

  return val.toString();
}
