const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ============ API ============ */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ============ INIT ============ */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const projects = await apiGet("projects");
  const projectSelect = document.getElementById("projectSelect");

  projectSelect.innerHTML =
    `<option value="">Select project</option>` +
    projects.map(p => `<option value="${p.id}">${p.title}</option>`).join("");

  projectSelect.addEventListener("change", loadFolders);
}

/* ============ LOAD FOLDERS ============ */

async function loadFolders() {
  const projectId = document.getElementById("projectSelect").value;
  const folderSelect = document.getElementById("folderSelect");

  folderSelect.innerHTML = `<option value="">Loading folders...</option>`;
  document.getElementById("filesBody").innerHTML = "";
  document.getElementById("countText").textContent = "";

  if (!projectId) return;

  const root = await apiGet(`projects/${projectId}/folders`);
  const folders = [];
  flattenFolders(root, folders);

  folderSelect.innerHTML =
    `<option value="">Select folder</option>` +
    folders.map(f => `
      <option value="${f.id}">
        ${"— ".repeat(f.level - 1)}${f.name}
      </option>
    `).join("");
}

/* ============ FETCH FILES ============ */

async function fetchFiles() {
  const projectId = document.getElementById("projectSelect").value;
  const folderId = document.getElementById("folderSelect").value;

  if (!projectId || !folderId) return;

  const files = await apiGet(
    `projects/${projectId}/folders/${folderId}/files`
  );

  renderFiles(files || []);
}

/* ============ FLATTEN FOLDER TREE ============ */

function flattenFolders(node, list) {
  if (!node) return;

  list.push({
    id: node.id,
    name: node.name,
    level: node.level
  });

  if (Array.isArray(node.children)) {
    node.children.forEach(child => flattenFolders(child, list));
  }
}

/* ============ RENDER FILES ============ */

function renderFiles(files) {
  const body = document.getElementById("filesBody");
  body.innerHTML = "";

  document.getElementById("countText").textContent =
    `Total Files: ${files.length}`;

  if (!files.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No files found in this folder
        </td>
      </tr>`;
    return;
  }

  files.forEach(file => {
    body.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="file-name">
          <i class="bi bi-file-earmark me-1"></i>${file.name || "-"}
        </td>
        <td>${file.id || "-"}</td>
        <td>${file.type || "-"}</td>
        <td>${formatSize(file.size)}</td>
        <td>${formatDate(file.created_at)}</td>
        <td>${formatDate(file.updated_at)}</td>
      </tr>
    `);
  });
}

/* ============ UTIL ============ */

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}

function formatSize(bytes) {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  return (kb / 1024).toFixed(2) + " MB";
}
