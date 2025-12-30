const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= HELPERS ================= */

function formatLimit(value, unit = "") {
  return value === 99999 ? "Unlimited" : `${value}${unit}`;
}

function percent(value) {
  return Math.min(Number(value) || 0, 100);
}

function metricCard(title, main, sub, pct) {
  return `
    <div class="col-md-4">
      <div class="card p-3 h-100">
        <div class="metric-title">${title}</div>
        <div class="metric-value">${main}</div>
        <div class="metric-sub mb-2">${sub}</div>
        ${pct !== null ? `
          <div class="progress">
            <div class="progress-bar bg-indigo" style="width:${pct}%"></div>
          </div>` : ""}
      </div>
    </div>
  `;
}

/* ================= FETCH ================= */

async function fetchUsage() {
  const container = document.getElementById("usageContainer");
  container.innerHTML = `<div class="text-muted">Loading…</div>`;

  try {
    const d = await apiGet("memory_usage");

    container.innerHTML = `
      ${metricCard(
        "Projects",
        `${d.projects_limit_consumed}`,
        `Limit: ${formatLimit(d.projects_limit)}`,
        percent(d.projects_limit_consumed_percentage)
      )}

      ${metricCard(
        "Users",
        `${d.user_limit_consumed}`,
        `Limit: ${formatLimit(d.user_limit)}`,
        percent(d.user_limit_consumed_percentage)
      )}

      ${metricCard(
        "Storage",
        `${d.memory_limit_consumed} GB`,
        `Limit: ${formatLimit(d.memory_limit, " GB")}`,
        percent(d.memory_limit_consumed_percentage)
      )}
    `;

  } catch (err) {
    container.innerHTML =
      `<div class="text-danger">${err.message}</div>`;
  }
}
