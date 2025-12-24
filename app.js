const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PROJECT FINDER ================= */

function findProjectsDeep(data) {
  const results = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (
      typeof node.id === "number" &&
      typeof node.title === "string" &&
      !seen.has(node.id)
    ) {
      seen.add(node.id);
      results.push(node);
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
    } else {
      Object.values(node).forEach(walk);
    }
  }

  walk(data);
  return results;
}

/* ================= FORMATTERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "-");

function formatCategoryName(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.id) return `Category ID: ${p.category.id}`;
  return "-";
}

/* ================= RENDER ================= */

function renderProjects(projects) {
  const container = document.getElementById("projectsContainer");
  container.innerHTML = "";

  projects.forEach(p => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="project-title">${p.title}</div>
      <div class="project-id">ID: ${p.id}</div>

      <div class="section">
        <div class="label">Description</div>
        <div class="value">${p.description || "-"}</div>
      </div>

      <div class="section grid-2">
        <div>
          <div class="label">Start Date</div>
          <div class="value">${formatDate(p.start_date)}</div>
        </div>
        <div>
          <div class="label">End Date</div>
          <div class="value">${formatDate(p.end_date)}</div>
        </div>
        <div>
          <div class="label">Status</div>
          <div class="value">${p.status?.id ?? "-"}</div>
        </div>
        <div>
          <div class="label">Category</div>
          <div class="value">${formatCategoryName(p)}</div>
        </div>
      </div>

      <div class="section">
        <div class="label">Assigned</div>
        <div class="assigned-grid">
          ${(p.assigned || []).length
            ? p.assigned.map(id => `<div class="assigned-id">${id}</div>`).join("")
            : "-"}
        </div>
      </div>

      <div class="section grid-2">
        <div>
          <div class="label">Creator</div>
          <div class="value">${p.creator?.id ?? "-"}</div>
        </div>
        <div>
          <div class="label">Manager</div>
          <div class="value">${p.manager?.id ?? "-"}</div>
        </div>
      </div>

      <button class="btn btn-link mt-2" onclick='toggleJson(this)'>
        View Raw JSON
      </button>
      <pre style="display:none">${JSON.stringify(p, null, 2)}</pre>
    `;

    container.appendChild(card);
  });
}

/* ================= ACTIONS ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderProjects(projects);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = findProjectsDeep(json);
  renderProjects(projects);
}

/* ================= UI HELPERS ================= */

function toggleJson(btn) {
  const pre = btn.nextElementSibling;
  pre.style.display = pre.style.display === "none" ? "block" : "none";
}
