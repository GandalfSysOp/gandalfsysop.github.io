const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadWorkflows);

async function loadWorkflows() {
  const select = document.getElementById("workflowSelect");
  select.innerHTML = `<option>Loading...</option>`;

  const workflows = await apiGet("workflows");

  document.getElementById("countText").textContent =
    `Total Workflows: ${workflows.length}`;

  select.innerHTML = workflows.map(w =>
    `<option value="${w.id}">${w.title} (${w.id})</option>`
  ).join("");
}

/* ================= FETCH SINGLE ================= */

async function fetchWorkflowDetails() {
  const id = document.getElementById("workflowSelect").value;
  if (!id) return;

  const result = await apiGet(`workflows/${id}`);
  const workflow = Array.isArray(result) ? result[0] : result;

  renderWorkflow(workflow);
}

/* ================= RENDER ================= */

function renderWorkflow(wf) {
  const container = document.getElementById("workflowInfo");

  container.innerHTML = `
    <div class="card p-3">
      <h6 class="mb-2">${wf.title}</h6>

      <div class="row small mb-2">
        <div class="col-md-3"><strong>ID:</strong> ${wf.id}</div>
        <div class="col-md-3"><strong>Status:</strong> ${wf.status}</div>
        <div class="col-md-3"><strong>Default:</strong> ${wf.is_default ? "Yes" : "No"}</div>
        <div class="col-md-3"><strong>Stages:</strong> ${wf.workflow_stages.length}</div>
      </div>

      <div class="row small mb-3">
        <div class="col-md-6"><strong>Created:</strong> ${formatDate(wf.created_at)}</div>
        <div class="col-md-6"><strong>Updated:</strong> ${formatDate(wf.updated_at)}</div>
      </div>

      <div class="table-responsive">
        <table class="table table-sm table-bordered align-middle">
          <thead>
            <tr>
              <th>Stage ID</th>
              <th>Title</th>
              <th>Default</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Workflow</th>
            </tr>
          </thead>
          <tbody>
            ${wf.workflow_stages.map(s => `
              <tr>
                <td>${s.id}</td>
                <td>
                  ${s.title}
                  ${s.is_default ? `<span class="badge bg-success ms-1">Default</span>` : ""}
                </td>
                <td>${s.is_default ? "Yes" : "No"}</td>
                <td>${formatDate(s.created_at)}</td>
                <td>${formatDate(s.updated_at)}</td>
                <td>${s.workflow}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ================= UTIL ================= */

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}
