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
  const projectSelect = document.getElementById("projectSelect");

  projectSelect.innerHTML =
    `<option value="">Select project</option>` +
    projects.map(p => `<option value="${p.id}">${p.title}</option>`).join("");

  projectSelect.addEventListener("change", loadFolders);
}

/* ================= FOLDERS ================= */

async function loadFolders() {
  const projectId = document.getElementById("projectSelect").value;
  const folderSelect = document.getElementById("folderSelect");

  folderSelect.innerHTML = `<option>Loading...</option>`;
  document.getElementById("filesBody").innerHTML = "";
  document.getElementById("countText").textContent = "";

  if (!projectId) return;

  const root = await apiGet(`projects/${projectId}/folders`);
  const folders = [];
  flattenFolders(root, folders);

  folderSelect.innerHTML =
    `<option value="">Select folder</option>` +
    folders.map(f =>
      `<option value="${f.id}">${"— ".repeat(f.level - 1)}${f.name}</option>`
    ).join("");
}

function flattenFolders(node, list) {
  if (!node) return;
  list.push({ id: node.id, name: node.name, level: node.level });
  if (Array.isArray(node.children)) {
    node.children.forEach(c => flattenFolders(c, list));
  }
}

/* ================= FILES ================= */

async function fetchFiles() {
  const projectId = document.getElementById("projectSelect").value;
  const folderId = document.getElementById("folderSelect").value;

  if (!projectId || !folderId) return;

  const files = await apiGet(
    `projects/${projectId}/folders/${folderId}/files`
  );

  renderFiles(files || []);
}

/* ================= RENDER ================= */

function renderFiles(files) {
  const body = document.getElementById("filesBody");
  body.innerHTML = "";

  document.getElementById("countText").textContent =
    `Total Files: ${files.length}`;

  if (!files.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No files found</td>
      </tr>`;
    return;
  }

  files.forEach(file => {
    const rowId = `file-${file.id}`;

    /* Main Row */
    body.insertAdjacentHTML("beforeend", `
      <tr>
        <td style="width:28px" onclick="toggle('${rowId}')">
          <i class="bi bi-chevron-right text-primary"></i>
        </td>
        <td>${file.name || "-"}</td>
        <td>${file.id}</td>
        <td>${file.file_type || "-"}</td>
        <td>${formatSize(file.byte_size)}</td>
        <td>${formatDate(file.created_at)}</td>
      </tr>
    `);

    /* Expanded Row */
    body.insertAdjacentHTML("beforeend", `
      <tr id="${rowId}" style="display:none;background:#f8fafc">
        <td colspan="6">
          <div class="row g-2">

            ${detail("Approved By", file.approved_by)}
            ${detail("Approved Count", file.approved_count)}
            ${detail("Approved By Me", file.approved_by_me)}
            ${detail("By Me", file.by_me)}

            ${detail("Creator ID", file.creator?.id)}
            ${detail("Updated By", file.updated_by)}

            ${detail("Current Version", file.current_version)}
            ${detail("Proof Count", file.proof_count)}
            ${detail("Proof Version", file.proof_version)}
            ${detail("Version Count", file.version_count)}

            ${detail("Connected With", file.connected_with)}
            ${detail("Connected ID", file.connected_id)}
            ${detail("Source", file.source)}

            ${detail("Notify Users", join(file.notify))}
            ${detail("Project ID", file.project?.id)}
            ${detail("Folder ID", file.folder?.id)}

            ${link("View", file.url?.view)}
            ${link("Download", file.url?.download)}
            ${link("Proofing", file.url?.proofing)}
            ${link("Share", file.url?.share)}

            ${detail("Updated At", formatDate(file.updated_at))}
          </div>
        </td>
      </tr>
    `);
  });
}

/* ================= TOGGLE ================= */

function toggle(id) {
  const row = document.getElementById(id);
  if (!row) return;
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

/* ================= HELPERS ================= */

function detail(label, value) {
  return `
    <div class="col-md-4">
      <div class="text-muted small">${label}</div>
      <div>${value ?? "-"}</div>
    </div>`;
}

function link(label, url) {
  if (!url) return "";
  return `
    <div class="col-md-4">
      <div class="text-muted small">${label}</div>
      <a href="${url}" target="_blank">${label}</a>
    </div>`;
}

function join(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "-";
}

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}

function formatSize(bytes) {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  return kb < 1024 ? kb.toFixed(1) + " KB" : (kb / 1024).toFixed(2) + " MB";
}
