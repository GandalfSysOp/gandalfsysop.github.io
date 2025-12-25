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
  return `<div class="assigned-text">${a.map(id => `${id},`).join("<br>")}</div>`;
}

/* ================= JSON FORMATTER ================= */

function syntaxHighlight(json) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) cls = "json-boolean";
      else if (/null/.test(match)) cls = "json-null";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function setOutput(data) {
  const el = document.getElementById("output");
  if (!el) return;
  el.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
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
      <td>${p.creator?.id ?? "-"}</td>
      <td>${p.manager?.id ?? "-"}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });
}

/* ================= ACTION ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderTable(projects);
  setOutput(json);
}
