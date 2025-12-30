const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzG4IrtIkFgaQmVWeu9wr3VaXUbxYQSBai8H0uzLZvKgTIvS621u8Fih4zwbiYJ68qk/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= ACTION ================= */

async function fetchWorkflows() {
  const body = document.getElementById("workflowBody");
  body.innerHTML = `<tr><td colspan="7" class="text-muted">Loading...</td></tr>`;

  const data = await apiGet("workflows");

  document.getElementById("countText").textContent =
    `Total Workflows: ${data.length}`;

  if (!Array.isArray(data) || !data.length) {
    body.innerHTML = `<tr><td colspan="7">No workflows found</td></tr>`;
    return;
  }

  body.innerHTML = "";
  data.forEach(wf => renderWorkflowRow(wf, body));
}

/* ================= RENDER ================= */

function renderWorkflowRow(wf, container) {
  const expandId = `wf_${wf.id}`;

  /* ---- MAIN ROW ---- */
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="expand" onclick="toggle('${expandId}')">
      <i class="bi bi-chevron-right" id="${expandId}_icon"></i>
    </td>
    <td>
      <strong>${wf.title}</strong><br>
      <span class="text-muted small">${wf.id}</span>
    </td>
    <td>${wf.status}</td>
    <td>${wf.is_default ? "Yes" : "No"}</td>
    <td>${wf.workflow_stages.length}</td>
    <td>${formatDate(wf.created_at)}</td>
    <td>${formatDate(wf.updated_at)}</td>
  `;

  /* ---- EXPANDED ROW ---- */
  const expandRow = document.createElement("tr");
  expandRow.id = expandId;
  expandRow.style.display = "none";
  expandRow.innerHTML = `
    <td colspan="7">
      <div class="table-responsive mt-2">
        <table class="table table-sm table-bordered align-middle mb-0">
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
            ${
              wf.workflow_stages.map(stage => `
                <tr>
                  <td>${stage.id}</td>
                  <td>
                    ${stage.title}
                    ${
                      stage.is_default
                        ? `<span class="badge bg-success ms-1">Default</span>`
                        : ""
                    }
                  </td>
                  <td>${stage.is_default ? "Yes" : "No"}</td>
                  <td>${formatDate(stage.created_at)}</td>
                  <td>${formatDate(stage.updated_at)}</td>
                  <td>${stage.workflow}</td>
                </tr>
              `).join("")
            }
          </tbody>
        </table>
      </div>
    </td>
  `;

  container.appendChild(row);
  container.appendChild(expandRow);
}

/* ================= TOGGLE ================= */

function toggle(id) {
  const row = document.getElementById(id);
  const icon = document.getElementById(`${id}_icon`);

  if (!row) return;

  if (row.style.display === "none") {
    row.style.display = "table-row";
    icon.className = "bi bi-chevron-down";
  } else {
    row.style.display = "none";
    icon.className = "bi bi-chevron-right";
  }
}

/* ================= UTIL ================= */

function formatDate(val) {
  if (!val) return "-";
  return new Date(val).toLocaleString();
}
