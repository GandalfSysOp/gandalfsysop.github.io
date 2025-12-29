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
  const select = document.getElementById("projectSelect");

  select.innerHTML = projects
    .map(p => `<option value="${p.id}">${p.title}</option>`)
    .join("");
}

/* ============ FETCH ============ */

async function fetchFolders() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  const root = await apiGet(`projects/${projectId}/folders`);

  const flat = [];
  flatten(root, flat);

  document.getElementById("countText").textContent =
    `Total Folders: ${flat.length}`;

  render(flat);
}

/* ============ FLATTEN TREE ============ */

function flatten(node, list, parentId = "-") {
  if (!node) return;

  list.push({
    id: node.id,
    name: node.name,
    level: node.level,
    parent_id: parentId,
    created_at: node.created_at,
    updated_at: node.updated_at
  });

  if (Array.isArray(node.children)) {
    node.children.forEach(child =>
      flatten(child, list, node.id)
    );
  }
}

/* ============ RENDER ============ */

function render(folders) {
  const body = document.getElementById("foldersBody");
  body.innerHTML = "";

  if (!folders.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No folders found
        </td>
      </tr>`;
    return;
  }

  folders.forEach(f => {
    body.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="folder-name level-${f.level}">
          <i class="bi bi-folder me-1"></i>${f.name}
        </td>
        <td>${f.id}</td>
        <td>${f.level}</td>
        <td>${f.parent_id}</td>
        <td>${formatDate(f.created_at)}</td>
        <td>${formatDate(f.updated_at)}</td>
      </tr>
    `);
  });
}

/* ============ UTIL ============ */

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}
