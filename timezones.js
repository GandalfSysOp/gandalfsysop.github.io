const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzNjVt4eZjS9N2fGWFxxAD_lS9L2azpobkHjG5XxMojfYV21XrIU8mfePS7X4km0OeuhQ/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${GAS_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= FETCH ================= */

async function fetchTimezones() {
  const body = document.getElementById("timezoneBody");
  const countText = document.getElementById("countText");

  body.innerHTML = `<tr><td colspan="5" class="text-muted">Loading…</td></tr>`;
  countText.textContent = "";

  try {
    const data = await apiGet("timezones");

    if (!Array.isArray(data) || !data.length) {
      body.innerHTML =
        `<tr><td colspan="5" class="text-muted">No timezones found</td></tr>`;
      return;
    }

    countText.textContent = `Total Timezones: ${data.length}`;

    body.innerHTML = data.map(tz => `
      <tr>
        <td>${tz.id}</td>
        <td>${tz.country || "-"}</td>
        <td>${tz.timezone || "-"}</td>
        <td>${tz.time_diff || "-"}</td>
        <td>${tz.order_id || "-"}</td>
      </tr>
    `).join("");

  } catch (err) {
    body.innerHTML =
      `<tr><td colspan="5" class="text-danger">${err.message}</td></tr>`;
  }
}
