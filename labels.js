const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzoLhRhFe9Y6ufl2DVFwh9mEWdRTelfD1EA7xSesXOWXsmYH9NoeXOJmIrJcYs3Miy9tg/exec";

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ================= FETCH ================= */

async function fetchLabels() {
  const res = await apiGet("labels");
  const labels = res.data || res;

  renderLabels(labels);
}

/* ================= RENDER ================= */

function renderLabels(labels) {
  const tbody = document.getElementById("labelsTable");
  tbody.innerHTML = "";

  if (!labels || !labels.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          No labels found
        </td>
      </tr>`;
    return;
  }

  labels.forEach(label => {
    const projects =
      label.projects && label.projects.length
        ? label.projects.join(", ")
        : "—";

    tbody.innerHTML += `
      <tr>
        <td>${label.id}</td>
        <td>${label.name}</td>
        <td>
          <span class="color-box" style="background:${label.color}"></span>
          <span class="ms-1">${label.color}</span>
        </td>
        <td>${projects}</td>
      </tr>
    `;
  });
}
