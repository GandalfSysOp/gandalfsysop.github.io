const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= HELPERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleString() : "-");

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return a.join(", ");
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

function renderProject(p) {
  const el = document.getElementById("projectDetails");

  el.innerHTML = `
    <div class="card p-3">
      <div class="row g-3">

        <div class="col-md-6">
          <div class="label">Project ID</div>
          <div class="value">${p.id}</div>
        </div>

        <div class="col-md-6">
          <div class="label">Title</div>
          <div class="value">${p.title}</div>
        </div>

        <div class="col-md-12">
          <div class="label">Description</div>
          <div class="value">${p.description || "-"}</div>
        </div>

        <div class="col-md-4">
          <div class="label">Start Date</div>
          <div class="value">${formatDate(p.start_date)}</div>
        </div>

        <div class="col-md-4">
          <div class="label">End Date</div>
          <div class="value">${formatDate(p.end_date)}</div>
        </div>

        <div class="col-md-4">
          <div class="label">Status</div>
          <div class="value">${p.status?.id ?? "-"}</div>
        </div>

        <div class="col-md-6">
          <div class="label">Assigned</div>
          <div class="value assigned-text">${formatAssigned(p.assigned)}</div>
        </div>

        <div class="col-md-3">
          <div class="label">Category ID</div>
          <div class="value">${p.category?.id ?? "-"}</div>
        </div>

        <div class="col-md-3">
          <div class="label">Creator</div>
          <div class="value">${p.creator?.id ?? "-"}</div>
        </div>

        <div class="col-md-3">
          <div class="label">Manager</div>
          <div class="value">${p.manager?.id ?? "-"}</div>
        </div>

        <div class="col-md-3">
          <div class="label">Created At</div>
          <div class="value">${formatDate(p.created_at)}</div>
        </div>

        <div class="col-md-3">
          <div class="label">Updated At</div>
          <div class="value">${formatDate(p.updated_at)}</div>
        </div>

      </div>
    </div>
  `;

  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(p)}</pre>`;
}

/* ================= ACTION ================= */

async function getProject() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) {
    alert("Please enter a Project ID");
    return;
  }

  const json = await apiGet(`projects/${id}`);
  renderProject(json);
}
