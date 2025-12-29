const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const projects = await apiGet("projects");
  const select = document.getElementById("projectSelect");

  select.innerHTML = projects
    .map(p => `<option value="${p.id}">${p.title} (${p.id})</option>`)
    .join("");
}

/* ================= FETCH ================= */

async function fetchFolders() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  // IMPORTANT: response is an OBJECT, not array
  const rootFolder = await apiGet(`projects/${projectId}/folders`);

  // Flatten folders: root + children
  const folders = [
    rootFolder,
    ...(Array.isArray(rootFolder.children) ? rootFolder.children : [])
  ];

  document.getElementById("countText").textContent =
    `Total Folders: ${folders.length}`;

  renderFolders(folders);
}

/* ================= RENDER ================= */

function renderFolders(folders) {
  const body = document.getElementById("foldersBody");
  body.innerHTML = "";

  if (!folders || !folders.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No folders found
        </td>
      </tr>`;
    return;
  }

  folders.forEach(folder => {
    const rowId = `folder-${folder.id}`;

    body.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="expand" onclick="toggle('${rowId}')">
          <i class="bi bi-chevron-right"></i>
        </td>
        <td>${folder.name || "-"}</td>
        <td>${folder.id}</td>
        <td>${folder.parent_id ?? "-"}</td>
        <td>${formatDate(folder.created_at)}</td>
        <td>${formatDate(folder.updated_at)}</td>
      </tr>

      <tr id="${rowId}" class="expanded-row d-none">
        <td colspan="6">
          <pre>${JSON.stringify(folder, null, 2)}</pre>
        </td>
      </tr>
    `);
  });
}

/* ================= TOGGLE ================= */

function toggle(id) {
  const row = document.getElementById(id);
  if (row) row.classList.toggle("d-none");
}

/* ================= UTIL ================= */

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}
