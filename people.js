const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= CONFIG ================= */

/* Fields we explicitly do NOT want to show */
const EXCLUDED_FIELDS = [
  "cell",
  "profile_color",
  "send_invite",
  "initials"
];

/* ================= HELPERS ================= */

function formatValue(value) {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ");
  }

  return value.toString();
}

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

function renderPeople(people) {
  const container = document.getElementById("peopleContainer");
  container.innerHTML = "";

  people.forEach(person => {
    const card = document.createElement("div");
    card.className = "card p-3";

    card.innerHTML = `
      <div class="person-header">
        <img class="avatar" src="${person.image_url || ""}" alt="avatar">
        <div>
          <div class="name">${person.first_name} ${person.last_name}</div>
          <div class="sub">${person.title || "—"} • ${person.email || ""}</div>
        </div>
      </div>

      ${Object.keys(person)
        .filter(key => !EXCLUDED_FIELDS.includes(key))
        .map(key => `
          <div class="field-row">
            <div class="label">${key.replace(/_/g, " ")}</div>
            <div class="value">${formatValue(person[key])}</div>
          </div>
        `)
        .join("")}

      <div class="json-panel">
        <pre style="line-height:1.6">${formatJsonPretty(person)}</pre>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ================= ACTION ================= */

async function fetchPeople() {
  const json = await apiGet("people");

  const people = Array.isArray(json) ? json : [];

  if (!people.length) {
    document.getElementById("peopleContainer").innerHTML =
      "<div class='text-muted'>No people found.</div>";
    return;
  }

  renderPeople(people);
}
