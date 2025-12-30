const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

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

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function formatAssignedTable(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";

  const rows = chunkArray(ids, 2);

  return `
    <table style="border-collapse:collapse;width:100%;font-size:12px;">
      ${rows.map(r => `
        <tr>
          ${r.map(id => `
            <td style="border:1px solid #e5e7eb;padding:6px;">
              ${personName(id)}
            </td>
          `).join("")}
          ${r.length === 1 ? `<td style="border:1px solid #e5e7eb;"></td>` : ""}
        </tr>
      `).join("")}
    </table>
  `;
}

/* ================= VALUE FORMAT ================= */

function formatValue(key, value) {
  if (value === null || value === undefined) return "-";

  if (key === "assigned") return formatAssignedTable(value);

  if (key === "category") return categoryName(value?.id);

  if (key === "status") return statusName(value?.id);

  if (typeof value === "object" && value.id) {
    return personName(value.id);
  }

  if (Array.isArray(value)) return value.join(", ");

  return value.toString();
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

/* ================= RENDER ================= */

function renderProject(project) {
  const container = document.getElementById("projectDetails");
  container.innerHTML = "";

  Object.keys(project).forEach(key => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `
      <div class="label">${key.replace(/_/g, " ")}</div>
      <div class="value">${formatValue(key, project[key])}</div>
    `;
    container.appendChild(row);
  });

  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(project)}</pre>`;
}

/* ================= ACTION ================= */

async function getProject() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter a Project ID");

  await Promise.all([
    loadPeopleMap(),
    loadCategoryMap(),
    loadStatusMap()
  ]);

  const json = await apiGet(`projects/${id}`);
  renderProject(json);
}
