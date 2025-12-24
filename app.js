const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PROJECT DETECTOR ================= */

function findProjectsDeep(data) {
  const results = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.id && node.title && !seen.has(node.id)) {
      seen.add(node.id);
      results.push(node);
    }

    Object.values(node).forEach(walk);
  }

  walk(data);
  return results;
}

/* ================= FORMATTERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "—");

function formatCategoryName(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.id) return `Category ID: ${p.category.id}`;
  return "—";
}

/* ================= JSON OUTPUT ================= */

function setOutput(data) {
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}

/* ================= TABLE RENDER ================= */

function renderTable(projects) {
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <!-- Project -->
      <td>
        <div class="cell-title">${p.title}</div>
        <div class="cell-sub">ID: ${p.id}</div>
      </td>

      <!-- Dates -->
      <td>
        <div class="cell-sub">Start: ${formatDate(p.start_date)}</div>
        <div class="cell-sub">End: ${formatDate(p.end_date)}</div>
      </td>

      <!-- Status -->
      <td>
        <div class="cell-sub">${p.status?.id ?? "—"}</div>
      </td>

      <!-- People -->
      <td>
        <div class="cell-sub">Creator: ${p.creator?.id ?? "—"}</div>
        <div class="cell-sub">Manager: ${p.manager?.id ?? "—"}</div>
      </td>

      <!-- Assigned -->
      <td>
        <div class="assigned-container">
          ${(p.assigned || []).length
            ? p.assigned.map(id => `<div class="assigned-id">${id}</div>`).join("")
            : "—"}
        </div>
      </td>

      <!-- Category -->
      <td>
        ${formatCategoryName(p)}
      </td>
    `;

    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });
}

/* ================= ACTIONS ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderTable(projects);
  setOutput(json);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = findProjectsDeep(json);
  renderTable(projects);
  setOutput(json);
}
