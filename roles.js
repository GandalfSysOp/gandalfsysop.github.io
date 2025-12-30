const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

/* ================= ACTION ================= */

async function fetchRoles() {
  const container = document.getElementById("output");
  container.innerHTML = "Loading…";

  const roles = await apiGet("roles");

  renderRoles(roles);
}

/* ================= RENDER ================= */

function renderRoles(roles) {
  const container = document.getElementById("output");

  if (!Array.isArray(roles) || !roles.length) {
    container.innerHTML = "<p>No roles found</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Default</th>
          <th>Sort Order</th>
        </tr>
      </thead>
      <tbody>
  `;

  roles.forEach(r => {
    html += `
      <tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>
          <span class="badge ${r.is_default ? "yes" : "no"}">
            ${r.is_default ? "Yes" : "No"}
          </span>
        </td>
        <td>${r.sort}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
