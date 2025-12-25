const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= PEOPLE CACHE ================= */

let PEOPLE_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOAD PEOPLE ================= */

async function loadPeopleMap() {
  if (Object.keys(PEOPLE_MAP).length) return;

  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

function personName(id) {
  return PEOPLE_MAP[id]
    ? `${PEOPLE_MAP[id]} (${id})`
    : id;
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

/* ================= HELPERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "-");

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return a.map(id => personName(id)).join(", ");
}

function formatPerson(obj) {
  if (!obj || !obj.id) return "-";
  return personName(obj.id);
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
  const el = document.getElementById("output");
  if (!el) return;
  el.innerHTML = `<pre style="line-height:1.6">${formatJsonPretty(data)}</pre>`;
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
      <td>${p.status?.id ?? "-"}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${p.category?.id ?? "-"}</td>
      <td>${formatPerson(p.creator)}</td>
      <td>${formatPerson(p.manager)}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });
}

/* ================= ACTION ================= */

async function fetchProjects() {
  await loadPeopleMap(); // 🔑 one-time people fetch

  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);

  renderTable(projects);
  setOutput(json);
}
