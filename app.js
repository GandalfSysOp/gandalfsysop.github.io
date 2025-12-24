const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= FIND PROJECTS ================= */

function findProjectsDeep(data) {
  const found = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.id && node.title && !seen.has(node.id)) {
      seen.add(node.id);
      found.push(node);
    }

    Object.values(node).forEach(walk);
  }

  walk(data);
  return found;
}

/* ================= FORMATTERS ================= */

const formatDate = d => d ? new Date(d).toLocaleDateString() : "—";
const formatUser = u => u?.id ?? "—";
const formatStatus = s => s?.id ?? "—";

function formatCategoryName(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.id) return `Category ID: ${p.category.id}`;
  return "—";
}

/* ================= RENDER ================= */

function renderList(projects) {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  projects.forEach(p => {
    const div = document.createElement("div");
    div.className = "project-item";
    div.innerHTML = `
      <div class="project-title">${p.title}</div>
      <div class="project-id">${p.id}</div>
    `;
    div.onclick = () => renderDetails(p);
    list.appendChild(div);
  });
}

function renderDetails(p) {
  document.getElementById("details").innerHTML = `
    <div class="field"><div class="label">Title</div><div class="value">${p.title}</div></div>
    <div class="field"><div class="label">Description</div><div class="value">${p.description || "—"}</div></div>
    <div class="field"><div class="label">Start Date</div><div class="value">${formatDate(p.start_date)}</div></div>
    <div class="field"><div class="label">End Date</div><div class="value">${formatDate(p.end_date)}</div></div>
    <div class="field"><div class="label">Status</div><div class="value">${formatStatus(p.status)}</div></div>
    <div class="field"><div class="label">Category</div><div class="value">${formatCategoryName(p)}</div></div>
    <div class="field"><div class="label">Creator</div><div class="value">${formatUser(p.creator)}</div></div>
    <div class="field"><div class="label">Manager</div><div class="value">${formatUser(p.manager)}</div></div>
    <div class="field">
      <div class="label">Assigned</div>
      ${(p.assigned || []).map(id => `<span class="assigned-id">${id}</span>`).join("") || "—"}
    </div>
    <div class="field"><div class="label">Created</div><div class="value">${formatDate(p.created_at)}</div></div>
    <div class="field"><div class="label">Updated</div><div class="value">${formatDate(p.updated_at)}</div></div>
  `;

  document.getElementById("output").textContent =
    JSON.stringify(p, null, 2);
}

/* ================= ACTIONS ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderList(projects);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = findProjectsDeep(json);
  renderList(projects);
  if (projects[0]) renderDetails(projects[0]);
}
