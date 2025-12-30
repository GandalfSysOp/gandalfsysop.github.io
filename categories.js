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
  if (typeof value === "boolean") return value ? "true" : "false";
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

function renderCategories(categories) {
  const container = document.getElementById("categoriesContainer");
  container.innerHTML = "";

  categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "card p-3";

    card.innerHTML = `
      ${Object.keys(category).map(key => `
        <div class="field-row">
          <div class="label">${key.replace(/_/g, " ")}</div>
          <div class="value">${formatValue(category[key])}</div>
        </div>
      `).join("")}
    `;

    container.appendChild(card);
  });
}

/* ================= ACTION ================= */

async function fetchCategories() {
  const json = await apiGet("categories");

  const categories = Array.isArray(json) ? json : [];

  if (!categories.length) {
    document.getElementById("categoriesContainer").innerHTML =
      "<div class='text-muted'>No categories found.</div>";
    return;
  }

  renderCategories(categories);

  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(json)}</pre>`;
}
