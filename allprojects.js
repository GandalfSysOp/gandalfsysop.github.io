const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= LOOKUP CACHES ================= */

let PEOPLE_MAP = {};
let CATEGORY_MAP = {};
let STATUS_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOADERS ================= */

async function loadPeopleMap() {
  if (Object.keys(PEOPLE_MAP).length) return;
  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadCategoryMap() {
  if (Object.keys(CATEGORY_MAP).length) return;
  const categories = await apiGet("categories");
  categories.forEach(c => {
    CATEGORY_MAP[c.id] = c.name;
  });
}

async function loadStatusMap() {
  if (Object.keys(STATUS_MAP).length) return;
  const statuses = await apiGet("projectstatus");
  statuses.forEach(s => {
    STATUS_MAP[s.id] = s.title;
  });
}

/* ================= FORMATTERS ================= */

function personName(id) {
  return PEOPLE_MAP[id] ? `${PEOPLE_MAP[id]} (${id})` : id;
}

function categoryName(id) {
  return CATEGORY_MAP[id] || id || "-";
}

function statusName(id) {
  return STATUS_MAP[id] || id || "-";
}

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "-");

function formatAssigned(arr) {
  if (!Array.isArray(arr) || !arr.length) return "-";
  return arr.map(id => personName(id)).join(", ");
}

/* ================= PROJECT FINDER ================= */

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

/* ================= JSON ================= */

function formatJsonPretty(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
}

function setOutput(data) {
  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(data)}</pre>`;
}

/* ================= RENDER ================= */

function renderTable(projects) {
  document.getElementById("totalProjects").textContent = projects.length;
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.description || "-"}</td>
      <td>${formatDate(p.start_date)}</td>
      <td>${formatDate(p.end_date)}</td>
      <td>${statusName(p.status?.id)}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${categoryName(p.category?.id)}</td>
      <td>${personName(p.creator?.id)}</td>
      <td>${personName(p.manager?.id)}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });
}

/* ================= ACTION ================= */

async function fetchProjects() {
  await Promise.all([
    loadPeopleMap(),
    loadCategoryMap(),
    loadStatusMap()
  ]);

  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);

  renderTable(projects);
  setOutput(json);
}
