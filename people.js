/* ================= CONFIG ================= */

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= LOOKUP MAPS ================= */

let ROLE_MAP = {};
let GROUP_MAP = {};
let PROJECT_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

/* ================= LOADERS ================= */

async function loadRolesMap() {
  if (Object.keys(ROLE_MAP).length) return;

  const roles = await apiGet("roles");
  roles.forEach(r => {
    ROLE_MAP[r.id] = r.name;
  });
}

async function loadGroupsMap() {
  if (Object.keys(GROUP_MAP).length) return;

  const groups = await apiGet("groups");
  groups.forEach(g => {
    GROUP_MAP[g.id] = g.name;
  });
}

async function loadProjectsMap() {
  if (Object.keys(PROJECT_MAP).length) return;

  const projects = await apiGet("projects");
  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
  });
}

/* ================= FORMAT HELPERS ================= */

function roleName(id) {
  return ROLE_MAP[id] || id || "-";
}

function groupNames(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";
  return ids.map(id => GROUP_MAP[id] || id).join(", ");
}

function projectNames(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";
  return ids.map(id => PROJECT_MAP[id] || id).join(", ");
}

function field(label, value) {
  return `
    <div class="field-row">
      <div class="label">${label}</div>
      <div class="value">${value ?? "-"}</div>
    </div>
  `;
}

/* ================= RENDER ================= */

function renderPeople(people) {
  const container = document.getElementById("peopleContainer");
  container.innerHTML = "";

  if (!Array.isArray(people) || !people.length) {
    container.innerHTML =
      `<div class="text-muted text-center py-4">No people found</div>`;
    return;
  }

  people.forEach(p => {
    const card = document.createElement("div");
    card.className = "card p-3";

    card.innerHTML = `
      <div class="person-header">
        <img class="avatar" src="${p.image_url || ""}">
        <div>
          <div class="name">${p.first_name} ${p.last_name}</div>
          <div class="sub">
            ${roleName(p.role?.id)} • ${p.email}
          </div>
        </div>
      </div>

      ${field("User ID", p.id)}
      ${field("Groups", groupNames(p.groups))}
      ${field("Projects", projectNames(p.projects))}
      ${field("Verified", p.verified)}
      ${field("Suspended", p.suspended)}
      ${field("Timezone", p.timezone)}
      ${field("Language", p.language)}
      ${field("Last Active", p.last_active)}
      ${field("Created At", p.created_at)}
      ${field("Updated At", p.updated_at)}
    `;

    container.appendChild(card);
  });
}

/* ================= ACTION ================= */

async function fetchPeople() {
  const container = document.getElementById("peopleContainer");
  container.innerHTML = `
    <div class="text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm"></div>
      Loading people…
    </div>
  `;

  await Promise.all([
    loadRolesMap(),
    loadGroupsMap(),
    loadProjectsMap()
  ]);

  const people = await apiGet("people");
  renderPeople(people);
}
