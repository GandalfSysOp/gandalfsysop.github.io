const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= HELPERS ================= */

function formatValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") {
    return value
      ? `<span class="badge-default">true</span>`
      : "false";
  }
  return value.toString();
}

/* ================= JSON FORMAT ================= */

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

function renderProjectStatus(statusList) {
  const container = document.getElementById("statusContainer");
  container.innerHTML = "";

  statusList.forEach(status => {
    const card = document.createElement("div");
    card.className = "card p-3";

    card.innerHTML = `
      ${Object.keys(status).map(key => `
        <div class="field-row">
          <div class="label">${key.replace(/_/g, " ")}</div>
          <div class="value">${formatValue(status[key])}</div>
        </div>
      `).join("")}
    `;

    container.appendChild(card);
  });
}

/* ================= ACTION ================= */

async function fetchProjectStatus() {
  const json = await apiGet("projectstatus");

  const statusList = Array.isArray(json) ? json : [];

  if (!statusList.length) {
    document.getElementById("statusContainer").innerHTML =
      "<div class='text-muted'>No project status found.</div>";
    return;
  }

  renderProjectStatus(statusList);

  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(json)}</pre>`;
}
