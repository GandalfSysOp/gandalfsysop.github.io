const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

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
  const id = `wf_${wf.id}`;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="expand" onclick="toggle('${id}')">
      <i class="bi bi-chevron-right" id="${id}_icon"></i>
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

  const expandRow = document.createElement("tr");
  expandRow.id = id;
  expandRow.style.display = "none";
  expandRow.innerHTML = `
    <td colspan="7">
      <div>
        ${wf.workflow_stages.map(stage => `
          <span class="stage-pill ${stage.is_default ? "default" : ""}">
            ${stage.title}
          </span>
        `).join("")}
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
  return new Date(val).toLocaleDateString();
}
