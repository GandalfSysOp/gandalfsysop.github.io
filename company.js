const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= RENDER ================= */

function renderCompany(data) {
  const el = document.getElementById("companyContent");

  el.innerHTML = `
    <div class="row g-4 align-items-center mb-4">
      <div class="col-md-3 text-center">
        <img
          src="https:${data.logo}"
          alt="Company Logo"
          class="company-logo"
        />
      </div>

      <div class="col-md-9">
        <div class="mb-2">
          <div class="label">Company Name</div>
          <div class="value fs-5">${data.name}</div>
        </div>
      </div>
    </div>

    <hr />

    <div class="row g-3">
      <div class="col-md-4">
        <div class="label">Theme Color</div>
        <div class="value">${data.theme_color}</div>
      </div>

      <div class="col-md-4">
        <div class="label">Login Theme</div>
        <div class="value">${data.login_theme}</div>
      </div>

      <div class="col-md-4">
        <div class="label">Allowed IPs</div>
        <div class="value">
          ${data.allowed_ips ? data.allowed_ips : "Not restricted"}
        </div>
      </div>

      <div class="col-md-6 mt-3">
        <div class="label">Owner (User ID)</div>
        <div class="value">${data.owner}</div>
      </div>

      <div class="col-md-6 mt-3">
        <div class="label">Logo File Name</div>
        <div class="value">${data.file_name}</div>
      </div>
    </div>
  `;
}

/* ================= LOAD ================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await apiGet("company");
    renderCompany(data);
  } catch (err) {
    document.getElementById("companyContent").innerHTML =
      `<div class="text-danger">${err.message}</div>`;
  }
});
